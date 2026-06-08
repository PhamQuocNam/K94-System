"""Story analysis service for Phase 1: Extract characters, settings, scenes."""

import uuid
from typing import Any

from langchain_core.exceptions import OutputParserException
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnableParallel
from sqlmodel import Session, select

from app.core.exceptions import BusinessRuleException
from app.core.logging import logger
from app.image_generator.image_gen import ImageGenerator
from app.llm_provider import get_llm
from app.models import (
    Character,
    Scene,
    SceneCharacterLink,
    Setting,
    StoryBoard,
)
from app.prompts.story_analysis import (
    CHARACTER_EXTRACTION_PROMPT,
    SCENE_EXTRACTION_PROMPT,
    SETTING_EXTRACTION_PROMPT
)


class StoryAnalysisService:
    """Service for analyzing stories and generating Phase 1 data."""

    def __init__(self, session: Session, llm_provider: str | None = None):
        """Initialize the story analysis service.

        Args:
            session: Database session
            llm_provider: LLM provider to use (openai, claude, google)
        """
        self.session = session
        self.llm = get_llm(provider=llm_provider)
        self.image_generator: ImageGenerator | None = None

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
            extraction_chain = RunnableParallel(
                characters=CHARACTER_EXTRACTION_PROMPT | self.llm | JsonOutputParser(),
                scenes=SCENE_EXTRACTION_PROMPT | self.llm | JsonOutputParser(),
            )

            extraction_result = await extraction_chain.ainvoke({"story": story_content})
        except OutputParserException as e:
            logger.error("LLM output parsing failed", error=str(e), llm_output=str(e.llm_output) if hasattr(e, 'llm_output') else 'N/A')
            raise BusinessRuleException(
                f"Failed to parse LLM response. The story content may be too short or unclear. "
                f"Please provide a complete story with dialogue and descriptions. "
                f"LLM said: {str(e)}"
            ) from e
        logger.debug("LLM extraction completed", characters=len(extraction_result.get("characters", [])), scenes=len(extraction_result.get("scenes", [])))

        # Step 2: Save characters first (needed for scene-character linking)
        character_count = await self._save_characters(
            storyboard_id, extraction_result.get("characters", []), style, generate_images
        )

        # Step 3: Save scenes (links characters to scenes)
        scene_count = await self._save_scenes(
            storyboard_id, extraction_result.get("scenes", []), style
        )

        # Step 4: Create settings based on scenes (consecutive scenes with same setting)
        setting_count = await self._create_settings_from_scenes(
            storyboard_id, extraction_result.get("scenes", []), style, generate_images
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
                    character.reference_image_url = image_url

            self.session.add(character)
            count += 1

        self.session.commit()

        if self.image_generator:
            await self.image_generator.close()
            self.image_generator = None

        return count

    async def _save_scenes(
        self,
        storyboard_id: uuid.UUID,
        scenes_data: list[dict],
        style: str,
    ) -> int:
        """Save scenes to database.

        Args:
            storyboard_id: Storyboard UUID
            scenes_data: List of scene dictionaries from LLM
            style: Art style for visual descriptions

        Returns:
            Number of scenes saved
        """
        logger.info("Saving scenes", count=len(scenes_data))

        # Get existing characters for linking
        characters = self.session.exec(
            select(Character).where(Character.storyboard_id == storyboard_id)
        ).all()

        char_map = {c.name: c.id for c in characters if c.name}

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

        descriptions = [
            scene.get("narrative_description", "")
            for scene in scenes_data
            if scene.get("narrative_description")
        ]
        combined_description = [f"{i}. {description}" for i, description in enumerate(descriptions)]

        chain = self.llm | JsonOutputParser()
        setting_list = await chain.ainvoke(SETTING_EXTRACTION_PROMPT.format(story=combined_description))

        count = 0
        for setting_data in setting_list:
            setting_data["storyboard_id"] = storyboard_id
            setting = Setting(**setting_data)

            if generate_images and self.image_generator:
                image_url = await self.image_generator.generate_setting_reference(
                    setting_name=setting.name,
                    description=setting.description,
                    style=style,
                )
                if image_url:
                    setting.reference_image_url = image_url

            self.session.add(setting)
            count += 1

        self.session.commit()

        if self.image_generator:
            await self.image_generator.close()
            self.image_generator = None

        return count


__all__ = ["StoryAnalysisService"]
