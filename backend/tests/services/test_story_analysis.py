"""Unit tests for StoryAnalysisService.

Tests the modified logic where settings are created FROM scenes
with scene_start and scene_end tracking.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlmodel import Session, select

from app.models import Character, Scene, SceneCharacterLink, Setting, StoryBoard
from app.services.story_analysis import StoryAnalysisService


@pytest.fixture
def mock_session():
    """Create a mock database session."""
    session = MagicMock(spec=Session)
    session.exec = MagicMock()
    session.add = MagicMock()
    session.flush = MagicMock()
    session.commit = MagicMock()
    return session


@pytest.fixture
def storyboard_id():
    """Provide a test storyboard UUID."""
    return uuid.UUID("00000000-0000-0000-0000-000000000001")


@pytest.fixture
def service(mock_session):
    """Create a StoryAnalysisService instance with mocked dependencies."""
    # Mock get_llm to avoid requiring actual API keys
    with patch("app.services.story_analysis.get_llm") as mock_get_llm:
        mock_llm = MagicMock()
        mock_get_llm.return_value = mock_llm

        service = StoryAnalysisService(mock_session, llm_provider="openai")
        # Ensure the LLM is properly mocked
        service.llm = mock_llm
        yield service


class TestCreateSettingsFromScenes:
    """Tests for _create_settings_from_scenes method."""

    @pytest.mark.asyncio
    async def test_create_settings_from_scenes_single_setting(self, service, mock_session, storyboard_id):
        """Test creating one setting from a single scene."""
        scenes_data = [
            {
                "sequence_number": 1,
                "setting_name": "Forest",
                "narrative_description": "A dark forest",
                "visual_description": "Trees everywhere"
            }
        ]

        result = await service._create_settings_from_scenes(
            storyboard_id, scenes_data, "cinematic", generate_images=False
        )

        assert result == 1
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

        # Verify the created setting
        call_args = mock_session.add.call_args
        setting = call_args[0][0]
        assert isinstance(setting, Setting)
        assert setting.name == "Forest"
        assert setting.scene_start == 1
        assert setting.scene_end == 1

    @pytest.mark.asyncio
    async def test_create_settings_from_scenes_multiple_scenes_same_setting(
        self, service, mock_session, storyboard_id
    ):
        """Test grouping consecutive scenes with same setting."""
        scenes_data = [
            {"sequence_number": 1, "setting_name": "Forest", "narrative_description": "Enter forest"},
            {"sequence_number": 2, "setting_name": "Forest", "narrative_description": "Walk through"},
            {"sequence_number": 3, "setting_name": "Forest", "narrative_description": "Exit forest"},
        ]

        result = await service._create_settings_from_scenes(
            storyboard_id, scenes_data, "cinematic", generate_images=False
        )

        assert result == 1
        call_args = mock_session.add.call_args
        setting = call_args[0][0]
        assert setting.name == "Forest"
        assert setting.scene_start == 1
        assert setting.scene_end == 3
        assert "Enter forest" in setting.description
        assert "Walk through" in setting.description
        assert "Exit forest" in setting.description

    @pytest.mark.asyncio
    async def test_create_settings_from_scenes_multiple_settings(self, service, mock_session, storyboard_id):
        """Test creating multiple different settings."""
        scenes_data = [
            {"sequence_number": 1, "setting_name": "Forest", "narrative_description": "In forest"},
            {"sequence_number": 2, "setting_name": "Castle", "narrative_description": "In castle"},
            {"sequence_number": 3, "setting_name": "Beach", "narrative_description": "On beach"},
        ]

        result = await service._create_settings_from_scenes(
            storyboard_id, scenes_data, "cinematic", generate_images=False
        )

        assert result == 3
        assert mock_session.add.call_count == 3

    @pytest.mark.asyncio
    async def test_create_settings_from_scenes_time_extraction(self, service, mock_session, storyboard_id):
        """Test extraction of time_of_day from visual descriptions."""
        scenes_data = [
            {
                "sequence_number": 1,
                "setting_name": "Forest",
                "visual_description": "Morning light through trees"
            }
        ]

        await service._create_settings_from_scenes(
            storyboard_id, scenes_data, "cinematic", generate_images=False
        )

        call_args = mock_session.add.call_args
        setting = call_args[0][0]
        assert setting.time_of_day == "morning"

    @pytest.mark.asyncio
    async def test_create_settings_from_scenes_weather_extraction(self, service, mock_session, storyboard_id):
        """Test extraction of weather from visual descriptions."""
        scenes_data = [
            {
                "sequence_number": 1,
                "setting_name": "Forest",
                "visual_description": "Rainy day in the woods"
            }
        ]

        await service._create_settings_from_scenes(
            storyboard_id, scenes_data, "cinematic", generate_images=False
        )

        call_args = mock_session.add.call_args
        setting = call_args[0][0]
        assert setting.weather == "rainy"

    @pytest.mark.asyncio
    async def test_create_settings_from_scenes_empty_scenes(self, service, mock_session, storyboard_id):
        """Test handling of empty scenes list."""
        result = await service._create_settings_from_scenes(
            storyboard_id, [], "cinematic", generate_images=False
        )

        assert result == 0
        mock_session.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_settings_from_scenes_unnamed_setting(self, service, mock_session, storyboard_id):
        """Test default 'Unknown' setting for missing setting_name."""
        scenes_data = [
            {"sequence_number": 1, "narrative_description": "Somewhere"}
        ]

        await service._create_settings_from_scenes(
            storyboard_id, scenes_data, "cinematic", generate_images=False
        )

        call_args = mock_session.add.call_args
        setting = call_args[0][0]
        assert setting.name == "Unknown"

    @pytest.mark.asyncio
    async def test_create_settings_from_scenes_mixed_settings(self, service, mock_session, storyboard_id):
        """Test alternating locations create separate settings."""
        scenes_data = [
            {"sequence_number": 1, "setting_name": "Forest"},
            {"sequence_number": 2, "setting_name": "Castle"},
            {"sequence_number": 3, "setting_name": "Forest"},
        ]

        result = await service._create_settings_from_scenes(
            storyboard_id, scenes_data, "cinematic", generate_images=False
        )

        # Should create 3 settings (not 2) because scenes are not consecutive
        assert result == 3


class TestSaveCharacters:
    """Tests for _save_characters method."""

    @pytest.mark.asyncio
    async def test_save_characters_basic(self, service, mock_session, storyboard_id):
        """Test basic character saving with character_type field."""
        characters_data = [
            {
                "name": "John",
                "character_type": "human",
                "gender": "male",
                "age": 35,
                "body_build": "Tall",
                "face": "Square",
                "hair": "Blond",
                "clothes": "Shirt",
                "nationality": "American"
            }
        ]

        result = await service._save_characters(
            storyboard_id, characters_data, "cinematic", generate_images=False
        )

        assert result == 1
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

        call_args = mock_session.add.call_args
        character = call_args[0][0]
        assert isinstance(character, Character)
        assert character.name == "John"
        assert character.gender == "male"
        assert character.age == 35

    @pytest.mark.asyncio
    async def test_save_characters_animal_character(self, service, mock_session, storyboard_id):
        """Test saving animal character with character_type field."""
        characters_data = [
            {
                "name": "Buddy",
                "character_type": "dog",
                "gender": "male",
                "age": 5,
                "body_build": "Medium-sized golden retriever",
                "face": "Friendly muzzle and expressive brown eyes",
                "hair": "Golden fur",
                "clothes": "Red collar",
                "nationality": ""
            }
        ]

        result = await service._save_characters(
            storyboard_id, characters_data, "cinematic", generate_images=False
        )

        assert result == 1
        call_args = mock_session.add.call_args
        character = call_args[0][0]
        assert isinstance(character, Character)
        assert character.name == "Buddy"

    @pytest.mark.asyncio
    async def test_save_characters_with_image_generation(self, service, mock_session, storyboard_id):
        """Test character saving with image generation."""
        characters_data = [
            {
                "name": "John",
                "character_type": "human",
                "body_build": "Tall"
            }
        ]

        mock_image_gen = AsyncMock()
        mock_image_gen.generate_character_reference.return_value = "http://example.com/john.jpg"
        mock_image_gen.close = AsyncMock()

        with patch("app.services.story_analysis.ImageGenerator", return_value=mock_image_gen):
            result = await service._save_characters(
                storyboard_id, characters_data, "cinematic", generate_images=True
            )

        assert result == 1
        call_args = mock_session.add.call_args
        character = call_args[0][0]
        assert character.reference_image_url == "http://example.com/john.jpg"


class TestSaveScenes:
    """Tests for _save_scenes method."""

    @pytest.mark.asyncio
    async def test_save_scenes_basic(self, service, mock_session, storyboard_id):
        """Test basic scene saving."""
        mock_session.exec.return_value.all.return_value = []

        scenes_data = [
            {
                "sequence_number": 1,
                "title": "Enter Forest",
                "narrative_description": "John enters",
                "visual_description": "Walking",
                "scene_type": "action",
                "characters_present": [],
                "setting_name": "Forest"
            }
        ]

        result = await service._save_scenes(storyboard_id, scenes_data, "cinematic")

        assert result == 1
        mock_session.add.assert_called()
        mock_session.flush.assert_called()
        mock_session.commit.assert_called_once()

        call_args = mock_session.add.call_args_list[0]
        scene = call_args[0][0]
        assert isinstance(scene, Scene)
        assert scene.title == "Enter Forest"
        assert scene.sequence_number == 1

    @pytest.mark.asyncio
    async def test_save_scenes_with_character_linking(self, service, mock_session, storyboard_id):
        """Test scene saving with character linking."""
        mock_char = MagicMock()
        mock_char.id = uuid.UUID("00000000-0000-0000-0000-000000000002")
        mock_char.name = "John"

        mock_session.exec.return_value.all.return_value = [mock_char]

        scenes_data = [
            {
                "sequence_number": 1,
                "title": "Scene 1",
                "narrative_description": "John speaks",
                "visual_description": "Talking",
                "scene_type": "dialogue",
                "characters_present": ["John"],
                "setting_name": "Forest"
            }
        ]

        await service._save_scenes(storyboard_id, scenes_data, "cinematic")

        # Should add scene and character link
        assert mock_session.add.call_count >= 2

        # Check SceneCharacterLink was created
        link_calls = [call for call in mock_session.add.call_args_list]
        link_found = any(isinstance(call[0][0], SceneCharacterLink) for call in link_calls)
        assert link_found


class TestAnalyzeStoryIntegration:
    """Integration tests for the full analyze_story flow."""

    @pytest.mark.asyncio
    async def test_analyze_story_full_flow(self, service, mock_session, storyboard_id):
        """Test the complete story analysis flow with updated prompt format."""
        # Mock the LLM response with character_type field
        mock_llm_response = {
            "characters": [
                {
                    "name": "John",
                    "character_type": "human",
                    "gender": "male",
                    "age": 35,
                    "body_build": "Tall",
                    "face": "Square",
                    "hair": "Blond",
                    "clothes": "Shirt",
                    "nationality": "American"
                }
            ],
            "scenes": [
                {
                    "sequence_number": 1,
                    "title": "Scene 1",
                    "narrative_description": "In forest",
                    "visual_description": "Trees",
                    "scene_type": "action",
                    "characters_present": ["John"],
                    "setting_name": "Forest"
                }
            ]
        }

        # Mock the chain invoke with proper async behavior
        from langchain_core.runnables import RunnableParallel

        async def mock_invoke(input_dict):
            return mock_llm_response

        # Create a mock chain that returns our response
        mock_chain = AsyncMock()
        mock_chain.ainvoke = mock_invoke

        # Patch the chain creation to return our mock
        with patch("app.services.story_analysis.RunnableParallel", return_value=mock_chain):
            # Mock database queries
            mock_session.exec.return_value.all.return_value = []

            result = await service.analyze_story(
                storyboard_id, "John walks into the forest.", style="cinematic", generate_images=False
            )

        assert result["characters_extracted"] == 1
        assert result["settings_extracted"] == 1
        assert result["scenes_extracted"] == 1

    @pytest.mark.asyncio
    async def test_analyze_story_with_animal_characters(self, service, mock_session, storyboard_id):
        """Test story analysis with animal characters."""
        # Mock the LLM response with animal characters
        mock_llm_response = {
            "characters": [
                {
                    "name": "Buddy",
                    "character_type": "dog",
                    "gender": "male",
                    "age": 5,
                    "body_build": "Medium-sized golden retriever",
                    "face": "Friendly muzzle",
                    "hair": "Golden fur",
                    "clothes": "Red collar",
                    "nationality": ""
                }
            ],
            "scenes": [
                {
                    "sequence_number": 1,
                    "title": "Buddy Plays",
                    "narrative_description": "Buddy runs in the park",
                    "visual_description": "Golden dog running",
                    "scene_type": "action",
                    "characters_present": [],
                    "setting_name": "Park"
                }
            ]
        }

        async def mock_invoke(input_dict):
            return mock_llm_response

        mock_chain = AsyncMock()
        mock_chain.ainvoke = mock_invoke

        with patch("app.services.story_analysis.RunnableParallel", return_value=mock_chain):
            mock_session.exec.return_value.all.return_value = []

            result = await service.analyze_story(
                storyboard_id, "Buddy the dog plays in the park.", style="cinematic", generate_images=False
            )

        assert result["characters_extracted"] == 1
        assert result["settings_extracted"] == 1
        assert result["scenes_extracted"] == 1
