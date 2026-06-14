"""Scene generation service for Phase 2: Generate scene images and videos."""

import uuid
from collections import deque
from dataclasses import dataclass, field
from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.output_parsers import JsonOutputParser
from sqlmodel import Session, select

from app.core.logging import logger
from app.core.storage import storage
from app.models import Character, Scene, Setting, StoryBoard
from app.prompts.scene_visual import (
    CHARACTER_STATE_UPDATE_PROMPT,
    SCENE_VISUAL_PROMPT,
)
from app.services.base import BaseService
from app.utils.storage_helpers import collect_reference_paths


@dataclass
class CharacterState:
    """Track the state of a character across scenes."""

    character_id: uuid.UUID | None = None
    name: str = ""
    position: str = "standing"
    emotion: str = "neutral"
    holding: list[str] = field(default_factory=list)
    appearance_notes: str = ""
    visible_body_parts: str = "full body"


@dataclass
class SceneHistoryItem:
    """An item in scene history for context."""

    scene_id: uuid.UUID
    sequence_number: int
    title: str
    narrative_description: str
    visual_description: str
    character_states: dict[str, CharacterState] = field(default_factory=dict)


class SceneHistoryManager:
    """Manage scene history for context-aware generation."""

    def __init__(self, max_history: int = 8):
        """Initialize scene history manager.

        Args:
            max_history: Maximum number of previous scenes to keep
        """
        self.max_history = max_history
        self.history: deque[SceneHistoryItem] = deque(maxlen=max_history)

    def add_scene(self, scene_item: SceneHistoryItem) -> None:
        """Add a scene to history.

        Args:
            scene_item: Scene item to add
        """
        self.history.append(scene_item)
        logger.debug(
            "Scene added to history",
            scene_id=str(scene_item.scene_id),
            sequence=scene_item.sequence_number,
            history_size=len(self.history),
        )

    def get_history_string(self, current_sequence: int) -> str:
        """Get formatted history string for LLM prompt.

        Args:
            current_sequence: Current scene sequence number

        Returns:
            Formatted string of previous scenes
        """
        if not self.history:
            return "No previous scenes"

        lines = []
        for idx, item in enumerate(self.history):
            if item.sequence_number < current_sequence:
                char_states = ", ".join(
                    [f"{name}: {s.position}, {s.emotion}" for name, s in item.character_states.items()]
                )
                lines.append(
                    f"Scene {idx + 1}: {item.title}\n"
                    f"  {item.narrative_description}\n"
                    f"  Characters: {char_states}"
                )

        return "\n\n".join(lines) if lines else "No previous scenes"

    def get_last_character_state(self, character_name: str) -> CharacterState | None:
        """Get the most recent state of a character.

        Args:
            character_name: Name of the character

        Returns:
            CharacterState if found, None otherwise
        """
        for item in reversed(self.history):
            if character_name in item.character_states:
                return item.character_states[character_name]
        return None


class CharacterStateTracker:
    """Track and update character states across scenes."""

    def __init__(self, llm: BaseChatModel) -> None:
        """Initialize character state tracker.

        Args:
            llm: LLM instance for state inference
        """
        self.llm = llm
        self.current_states: dict[str, CharacterState] = {}

    async def update_states(
        self,
        scene_title: str,
        narrative_description: str,
        character_names: list[str],
        previous_states: dict[str, dict[str, Any]] | None = None,
    ) -> dict[str, CharacterState]:
        """Update character states based on scene content.

        Args:
            scene_title: Title of the current scene
            narrative_description: Narrative description of the scene
            character_names: List of character names in the scene
            previous_states: Previous character states (if any)

        Returns:
            Updated character states
        """
        if not character_names:
            return {}

        # Build character list string
        character_list = "\n".join([f"- {name}" for name in character_names])

        # Build previous states string
        prev_states_str = "No previous states"
        if previous_states:
            state_lines = []
            for name, state in previous_states.items():
                state_lines.append(
                    f"{name}: position={state.get('position', 'unknown')}, "
                    f"emotion={state.get('emotion', 'unknown')}, "
                    f"holding={state.get('holding', [])}"
                )
            prev_states_str = "\n".join(state_lines) if state_lines else "No previous states"

        try:
            chain = CHARACTER_STATE_UPDATE_PROMPT | self.llm | JsonOutputParser()
            result = await chain.ainvoke({
                "scene_title": scene_title,
                "narrative_description": narrative_description,
                "character_list": character_list,
                "previous_states": prev_states_str,
            })

            # Update current states
            updated_states: dict[str, CharacterState] = {}
            for name in character_names:
                if name in result:
                    updated_states[name] = CharacterState(
                        name=name,
                        position=result[name].get("position", "standing"),
                        emotion=result[name].get("emotion", "neutral"),
                        holding=result[name].get("holding", []),
                        appearance_notes=result[name].get("appearance_notes", ""),
                        visible_body_parts=result[name].get("visible_body_parts", "full body"),
                    )
                else:
                    # Use default state
                    updated_states[name] = CharacterState(
                        name=name,
                        position="standing",
                        emotion="neutral",
                    )

            self.current_states = updated_states
            logger.debug("Character states updated", states=len(updated_states))
            return updated_states

        except Exception as e:
            logger.warning("Failed to update character states, using defaults", error=str(e))
            # Return default states
            return {
                name: CharacterState(
                    name=name,
                    position="standing",
                    emotion="neutral",
                )
                for name in character_names
            }


class SceneGenerationService(BaseService):
    """Service for generating scene images and videos (Phase 2)."""

    def __init__(
        self,
        session: Session,
        storyboard_id: uuid.UUID,
        llm: BaseChatModel,
    ):
        """Initialize scene generation service.

        Args:
            session: Database session
            storyboard_id: Storyboard UUID
            llm: LangChain chat model instance
        """
        super().__init__(session=session, llm=llm)
        self.storyboard_id = storyboard_id

        # Load storyboard data
        self.storyboard = self.session.exec(
            select(StoryBoard).where(StoryBoard.id == storyboard_id)
        ).first()

        if not self.storyboard:
            raise ValueError(f"StoryBoard {storyboard_id} not found")

        # Initialize managers
        self.history_manager = SceneHistoryManager(max_history=5)
        self.state_tracker = CharacterStateTracker(self.llm)

    async def generate_scene_images(
        self,
        start_scene: int = 1,
        end_scene: int | None = None,
    ) -> dict[str, Any]:
        """Generate images for all scenes in range.

        Args:
            start_scene: Starting scene sequence number
            end_scene: Ending scene sequence number (None = all scenes)

        Returns:
            Dictionary with generation results
        """
        logger.info(
            "Starting scene image generation",
            storyboard=str(self.storyboard_id),
            start=start_scene,
            end=end_scene,
        )

        # Get scenes to process
        query = select(Scene).where(
            Scene.storyboard_id == self.storyboard_id,
            Scene.sequence_number >= start_scene,
        )
        if end_scene is not None:
            query = query.where(Scene.sequence_number <= end_scene)

        scenes = self.session.exec(query.order_by(Scene.sequence_number)).all()
        logger.info("Found scenes to process", count=len(scenes))

        if not scenes:
            return {"generated": 0, "skipped": 0, "errors": []}

        # Get all settings for reference
        settings = self.session.exec(
            select(Setting).where(Setting.storyboard_id == self.storyboard_id)
        ).all()

        setting_map = {s.id: s for s in settings}

        # Generate images
        generated = 0
        skipped = 0
        errors = []

        self.image_generator = ImageGenerator()

        try:
            for scene in scenes:
                try:
                    # Get scene characters
                    scene_characters = list(scene.characters)

                    # Get scene setting
                    scene_setting = None
                    if scene.setting_id and scene.setting_id in setting_map:
                        scene_setting = setting_map[scene.setting_id]

                    # Update character states based on scene narrative
                    character_names = [char.name for char in scene_characters if char.name]

                    # Collect reference paths using utility
                    reference_paths = await collect_reference_paths(
                        characters=scene_characters,
                        setting=scene_setting,
                    )

                    # Convert CharacterState objects to dicts for the LLM prompt
                    previous_states_dict: dict[str, dict] = {
                        name: {
                            "position": s.position,
                            "emotion": s.emotion,
                            "holding": s.holding,
                        }
                        for name, s in self.state_tracker.current_states.items()
                    }

                    character_states = await self.state_tracker.update_states(
                        scene_title=scene.title or "Untitled",
                        narrative_description=scene.narrative_description or "",
                        character_names=character_names,
                        previous_states=previous_states_dict,
                    )

                    # Build visual prompt with history
                    visual_prompt_data = await self._generate_visual_prompt(
                        scene=scene,
                        characters=scene_characters,
                        setting=scene_setting,
                    )

                    # Generate image
                    image_url = await self.image_generator.generate_scene_reference(
                        visual_prompt=visual_prompt_data["visual_prompt"],
                        style=self.storyboard.style or "cinematic",
                        reference_paths=reference_paths
                    )

                    if image_url:
                        # Download and save locally
                        saved_url = await storage.download_and_save(image_url, "images")
                        scene.reference_image_url = saved_url
                        scene.visual_prompt = visual_prompt_data["visual_prompt"]
                        self.session.add(scene)
                        generated += 1
                        logger.success(
                            "Scene image generated",
                            scene_id=str(scene.id),
                            sequence=scene.sequence_number,
                        )

                        # Add scene to history for context
                        history_item = SceneHistoryItem(
                            scene_id=scene.id,
                            sequence_number=scene.sequence_number,
                            title=scene.title or "Untitled",
                            narrative_description=scene.narrative_description or "",
                            visual_description=scene.visual_description or "",
                            character_states=character_states,
                        )
                        self.history_manager.add_scene(history_item)
                    else:
                        errors.append(f"Scene {scene.sequence_number}: Image generation failed")
                        logger.warning("Image generation failed", scene_id=str(scene.id))

                except Exception as e:
                    errors.append(f"Scene {scene.sequence_number}: {str(e)}")
                    logger.error("Scene generation error", scene_id=str(scene.id), error=str(e))

            self.session.commit()

        finally:
            if self.image_generator:
                await self.image_generator.close()
                self.image_generator = None

        return {
            "generated": generated,
            "skipped": skipped,
            "errors": errors,
        }

    async def _generate_visual_prompt(
        self,
        scene: Scene,
        characters: list[Character],
        setting: Setting | None,
    ) -> dict[str, Any]:
        """Generate visual prompt for scene image.

        Args:
            scene: Scene object
            characters: List of characters in scene
            setting: Setting object (optional)

        Returns:
            Visual prompt data dictionary
        """
        # Build character info string
        character_info = ""
        for char in characters:
            if char.reference_image_url:
                character_info += f"""
{char.name} (reference image available):
- Age: {char.age}
- Gender: {char.gender}
- Body: {char.body_build}
- Face: {char.face}
- Hair: {char.hair}
- Clothes: {char.clothes}
"""
            else:
                character_info += f"\n{char.name}: {char.body_build}, {char.face}, {char.hair}, {char.clothes}"

        # Build setting info string
        setting_info = ""
        if setting:
            setting_info = f"""
{setting.name}:
{setting.description}
Time: {setting.time_of_day}
Weather: {setting.weather}
"""

        # Get scene history
        scene_history = self.history_manager.get_history_string(scene.sequence_number)

        try:
            chain = SCENE_VISUAL_PROMPT | self.llm | JsonOutputParser()
            result = await chain.ainvoke({
                "scene_title": scene.title or "Untitled",
                "narrative_description": scene.narrative_description or "",
                "visual_description": scene.visual_description or "",
                "character_info": character_info or "No characters",
                "setting_info": setting_info or "No setting specified",
                "art_style": self.storyboard.style or "cinematic",
                "scene_history": scene_history,
            })

            logger.debug("Visual prompt generated", scene_id=str(scene.id))
            return result

        except Exception as e:
            logger.warning("Failed to generate visual prompt, using base description", error=str(e))
            return {
                "visual_prompt": scene.visual_description or scene.narrative_description or "",
                "camera_angle": "medium",
                "lighting": "natural",
                "mood": "neutral",
                "composition_notes": "",
            }

    async def generate_scene_videos(
        self,
        start_scene: int = 1,
        end_scene: int | None = None,
        duration: float = 3.0,
    ) -> dict[str, Any]:
        """Generate videos for scenes with images.

        Args:
            start_scene: Starting scene sequence number
            end_scene: Ending scene sequence number (None = all scenes)
            duration: Video duration in seconds

        Returns:
            Dictionary with generation results
        """
        logger.info(
            "Starting scene video generation",
            storyboard=str(self.storyboard_id),
            start=start_scene,
            end=end_scene,
            duration=duration,
        )

        # Get scenes with images but no videos
        query = select(Scene).where(
            Scene.storyboard_id == self.storyboard_id,
            Scene.sequence_number >= start_scene,
            Scene.reference_image_url.isnot(None),
            Scene.reference_video_url.is_(None),
        )
        if end_scene is not None:
            query = query.where(Scene.sequence_number <= end_scene)

        scenes = self.session.exec(query.order_by(Scene.sequence_number)).all()

        if not scenes:
            return {"generated": 0, "skipped": 0, "errors": ["No scenes with images found"]}

        # Initialize video generator
        if not self.video_generator:
            self.video_generator = VideoGenerator()

        generated = 0
        errors = []

        for scene in scenes:
            image_path = None
            try:
                logger.info("Generating video for scene", scene=scene.sequence_number, title=scene.title)

                # Download image to local temp file
                image_path = await storage.download_to_temp(scene.reference_image_url)

                if not image_path:
                    errors.append(f"Scene {scene.sequence_number}: Failed to download image")
                    continue

                # Generate video using image and visual prompt
                video_url = await self.video_generator.generate_video_from_image(
                    image_path=image_path,
                    prompt=scene.visual_prompt or scene.narrative_description,
                    duration=duration,
                )

                if video_url:
                    scene.reference_video_url = video_url
                    self.session.add(scene)
                    generated += 1
                    logger.success("Video generated for scene", scene=scene.sequence_number)
                else:
                    errors.append(f"Scene {scene.sequence_number}: Video generation failed")

            except Exception as e:
                error_msg = f"Scene {scene.sequence_number}: {str(e)}"
                errors.append(error_msg)
                logger.error("Video generation error", scene=scene.sequence_number, error=str(e))
            finally:
                # Always clean up temp file
                if image_path:
                    storage.delete_file(image_path)

        self.session.commit()

        return {
            "generated": generated,
            "skipped": len(scenes) - generated,
            "errors": errors,
        }


__all__ = [
    "SceneGenerationService",
    "SceneHistoryManager",
    "CharacterStateTracker",
    "CharacterState",
    "SceneHistoryItem",
]
