"""Story analysis service for Phase 1: Extract characters, settings, scenes."""

import uuid
from typing import Any

from langchain_core.exceptions import OutputParserException
from langchain_core.output_parsers import JsonOutputParser
from sqlmodel import Session, select

from app.core.exceptions import BusinessRuleException
from app.core.logging import logger
from app.core.storage import storage
from app.crud.scene import get_scenes_by_storyboard
from app.models import (
    Character,
    Scene,
    SceneCharacterLink,
    Setting,
)
from app.prompts.story_analysis import (
    CHARACTER_EXTRACTION_PROMPT,
    SCENE_EXTRACTION_PROMPT,
    SETTING_EXTRACTION_PROMPT,
)
from app.services.base import BaseService


class StoryAnalysisService(BaseService):
    """Service for analyzing stories and generating Phase 1 data."""

    async def analyze_story(
        self,
        storyboard_id: uuid.UUID,
        story_content: str,
        style: str = "cinematic",
        generate_images: bool = False,
    ) -> dict[str, Any]:
        """Analyze a story and extract characters, settings, and scenes.

        Args:
            storyboard_id: UUID of the storyboard to update
            story_content: The story text to analyze
            style: Art style for image generation
            generate_images: Whether to generate reference images

        Returns:
            Dictionary containing analysis results with counts
        """
        logger.info("Starting story analysis", storyboard_id=str(storyboard_id), style=style, generate_images=generate_images)

        # Step 1: Extract characters and scenes in parallel
        try:
            character_chain = CHARACTER_EXTRACTION_PROMPT | self.llm | JsonOutputParser()
            scene_chain = SCENE_EXTRACTION_PROMPT | self.llm | JsonOutputParser()

            characters = await character_chain.ainvoke({"story": story_content})
            character_names = "\n".join([char.get("name", "") for char in characters])
            scenes = await scene_chain.ainvoke({"story": story_content, "characters": character_names})
        except OutputParserException as e:
            logger.error("LLM output parsing failed", error=str(e), llm_output=str(e.llm_output) if hasattr(e, 'llm_output') else 'N/A')
            raise BusinessRuleException(
                f"Failed to parse LLM response. The story content may be too short or unclear. "
                f"Please provide a complete story with dialogue and descriptions. "
                f"LLM said: {str(e)}"
            ) from e
        logger.debug("LLM extraction completed", characters=len(characters), scenes=len(scenes))

        # Step 2: Save characters first (needed for scene-character linking)
        character_count = await self._save_characters(
            storyboard_id, characters, style, generate_images
        )

        # Step 3: Save scenes (links characters to scenes)
        scene_count = await self._save_scenes(
            storyboard_id, scenes
        )

        # Step 4: Create settings based on scenes (consecutive scenes with same setting)
        setting_count = await self._create_settings_from_scenes(
            storyboard_id, scenes, style, generate_images
        )

        result = {
            "characters_extracted": character_count,
            "settings_extracted": setting_count,
            "scenes_extracted": scene_count,
        }
        logger.info("Story analysis completed", **result)
        return result

    async def _save_characters(
        self,
        storyboard_id: uuid.UUID,
        characters_data: list[dict],
        style: str,
        generate_images: bool,
    ) -> int:
        """Save characters to database.

        Args:
            storyboard_id: Storyboard UUID
            characters_data: List of character dictionaries from LLM
            style: Art style
            generate_images: Whether to generate reference images

        Returns:
            Number of characters saved
        """
        logger.info("Saving characters", count=len(characters_data), generate_images=generate_images)

        if generate_images:
            self.image_generator = ImageGenerator()

        try:
            count = 0
            for char_data in characters_data:
                character = Character(
                    storyboard_id=storyboard_id,
                    name=char_data.get("name"),
                    gender=char_data.get("gender"),
                    age=char_data.get("age"),
                    body_build=char_data.get("body_build"),
                    face=char_data.get("face"),
                    hair=char_data.get("hair"),
                    clothes=char_data.get("clothes"),
                    nationality=char_data.get("nationality"),
                )

                # Generate reference image if requested
                if generate_images and self.image_generator:
                    description = f"""
Character profile:
- Age: {character.age}
- Gender: {character.gender}
- Nationality/Ethnicity: {character.nationality}
- Body build: {character.body_build}
- Facial features: {character.face}
- Hair: {character.hair}
- Clothing: {character.clothes}
""".strip()

                    image_url = await self.image_generator.generate_character_reference(
                        character_name=char_data.get("name", "Unknown"),
                        description=description,
                        style=style,
                    )
                    if image_url:
                        new_image_url = await storage.download_and_save(image_url, "images")
                        character.reference_image_url = new_image_url

                self.session.add(character)
                count += 1

            self.session.commit()
        finally:
            if self.image_generator:
                await self.image_generator.close()
                self.image_generator = None

        return count

    async def _save_scenes(
        self,
        storyboard_id: uuid.UUID,
        scenes_data: list[dict]
    ) -> int:
        """Save scenes to database.

        Args:
            storyboard_id: Storyboard UUID
            scenes_data: List of scene dictionaries from LLM

        Returns:
            Number of scenes saved
        """
        logger.info("Saving scenes", count=len(scenes_data))

        # Get existing characters for linking
        characters = self.session.exec(
            select(Character).where(Character.storyboard_id == storyboard_id)
        ).all()

        char_map: dict[str, uuid.UUID] = {}
        for c in characters:
            if c.name:
                if c.name in char_map:
                    logger.warning("Duplicate character name, skipping", name=c.name)
                else:
                    char_map[c.name] = c.id

        count = 0
        for scene_data in scenes_data:
            scene = Scene(
                storyboard_id=storyboard_id,
                sequence_number=scene_data.get("sequence_number", count + 1),
                title=scene_data.get("title"),
                narrative_description=scene_data.get("narrative_description"),
                visual_description=scene_data.get("visual_description"),
                scene_type=scene_data.get("scene_type"),
                mood=scene_data.get("mood"),
            )

            self.session.add(scene)
            self.session.flush()  # Get the scene ID

            # Link characters to scene
            for char_name in scene_data.get("characters_present", []):
                char_id = char_map.get(char_name)
                if char_id:
                    link = SceneCharacterLink(scene_id=scene.id, character_id=char_id)
                    self.session.add(link)

            count += 1

        self.session.commit()
        return count

    async def _create_settings_from_scenes(
        self,
        storyboard_id: uuid.UUID,
        scenes_data: list[dict],
        style: str,
        generate_images: bool,
    ) -> int:
        """Create settings based on consecutive scenes with the same location.

        Groups consecutive scenes that share the same setting_name and creates
        one Setting per group with scene_start and scene_end fields.

        Args:
            storyboard_id: Storyboard UUID
            scenes_data: List of scene dictionaries from LLM
            style: Art style for reference images
            generate_images: Whether to generate reference images

        Returns:
            Number of settings created
        """
        logger.info("Creating settings from scenes", scene_count=len(scenes_data), generate_images=generate_images)

        if generate_images:
            self.image_generator = ImageGenerator()

        combined_description = "\n".join(
            f"{i + 1}. {description}"
            for i, description in enumerate(
                scene.get("narrative_description", "")
                for scene in scenes_data
                if scene.get("narrative_description")
            )
        )

        chain = SETTING_EXTRACTION_PROMPT | self.llm | JsonOutputParser()
        setting_list = await chain.ainvoke({"story": combined_description})

        # Known fields on the Setting model (excluding auto-set ones)
        _SETTING_FIELDS = {"name", "description", "time_of_day", "weather", "art_style", "scene_start", "scene_end"}

        try:
            count = 0
            all_scenes = get_scenes_by_storyboard(self.session, storyboard_id)
            # Build a map from sequence_number (1-based) to Scene object
            scene_map = {scene.sequence_number: scene for scene in all_scenes}

            for setting_data in setting_list:
                filtered = {k: v for k, v in setting_data.items() if k in _SETTING_FIELDS}
                filtered["storyboard_id"] = storyboard_id
                setting = Setting(**filtered)

                if generate_images and self.image_generator:
                    image_url = await self.image_generator.generate_setting_reference(
                        setting_name=setting.name,
                        description=setting.description,
                        style=style,
                    )
                    if image_url:
                        new_image_url = await storage.download_and_save(image_url, "images")
                        setting.reference_image_url = new_image_url

                # Link scenes to this setting using scene_start and scene_end
                scene_start = setting_data.get("scene_start")
                scene_end = setting_data.get("scene_end")
                if scene_start is not None and scene_end is not None:
                    for seq_num in range(int(scene_start), int(scene_end) + 1):
                        scene = scene_map.get(seq_num)
                        if scene:
                            scene.setting_id = setting.id

                self.session.add(setting)
                count += 1

            self.session.commit()
        finally:
            if self.image_generator:
                await self.image_generator.close()
                self.image_generator = None

        return count


__all__ = ["StoryAnalysisService"]
