"""Prompt templates for story analysis."""

from langchain_core.prompts import ChatPromptTemplate

# Character extraction prompt
CHARACTER_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert story analyzer. Your task is to extract all characters from the given story.

For each character, provide:
- name: Character's name
- gender: male/female/other
- age: Estimated age (number)
- body_build: Physical description (height, build, etc.)
- face: Facial features description
- hair: Hair style and color
- clothes: Typical clothing/attire
- nationality: Ethnicity or nationality if mentioned

Return ONLY a valid JSON array of characters. Each character must have all fields.
If a field cannot be determined from the story, use null or empty string.
Example output format:
[
    {{
        "name": "John",
        "gender": "male",
        "age": 35,
        "body_build": "Tall and athletic",
        "face": "Square jaw, blue eyes",
        "hair": "Short blond hair",
        "clothes": "Blue button-down shirt",
        "nationality": "American"
    }}
]"""),
    ("human", """Story to analyze:
{story}

Extract all characters from this story and return as JSON array."""),
])

# Setting extraction prompt
SETTING_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert story analyzer. Your task is to extract all settings (locations) from the given story.

For each setting, provide:
- name: Setting/location name
- description: Brief description of the setting
- time_of_day: Time of day (morning, afternoon, evening, night, dawn, dusk)
- weather: Weather conditions (sunny, cloudy, rainy, stormy, foggy, etc.)
- art_style: Art style description for this setting
- dominant_colors: Main colors associated with this setting

Return ONLY a valid JSON array of settings.
If a field cannot be determined, use null or empty string.
Example output format:
[
    {{
        "name": "Mystical Forest",
        "description": "An ancient forest filled with towering trees and bioluminescent plants",
        "time_of_day": "evening",
        "weather": "foggy",
        "art_style": "Fantasy art, ethereal",
    }}
]"""),
    ("human", """Story to analyze:
{story}

Extract all settings from this story and return as JSON array."""),
])

# Scene extraction prompt
SCENE_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert story analyzer. Your task is to break down the story into individual scenes.

For each scene, provide:
- sequence_number: Sequential order starting from 1
- title: Brief title for the scene
- narrative_description: What happens in the story (original narrative)
- visual_description: Visual description for image generation
- scene_type: Type of scene (dialogue, action, transition, climax, etc.)
- characters_present: List of character names present in this scene
- setting_name: Name of the setting/location

Return ONLY a valid JSON array of scenes in order.
Example output format:
[
    {{
        "sequence_number": 1,
        "title": "Enter the Forest",
        "narrative_description": "John steps into the mysterious forest, feeling uneasy.",
        "visual_description": "A lone figure standing at the edge of a dense, foggy forest",
        "scene_type": "action",
        "characters_present": ["John"],
        "setting_name": "Mystical Forest"
    }}
]"""),
    ("human", """Story to analyze:
{story}

Break this story into scenes and return as JSON array."""),
])

# Visual description generation prompt
VISUAL_DESCRIPTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert visual director for AI image generation. Your task is to create detailed visual descriptions for scene images.

Create a visual prompt that includes:
- Camera angle (wide shot, close-up, medium shot, bird's eye view, etc.)
- Lighting description (golden hour, dramatic lighting, soft ambient, etc.)
- Composition details (foreground, background, depth)
- Character positions and expressions
- Environmental details and atmosphere
- Art style specification (Pixar, anime, cinematic, realistic, etc.)
- Technical quality keywords (high detail, 4K, professional, etc.)

Return ONLY a single string prompt suitable for AI image generation.
Focus on creating clear, actionable visual instructions."""),
    ("human", """Scene Information:
- Title: {scene_title}
- Narrative: {narrative_description}
- Characters: {characters}
- Setting: {setting_name}
- Art Style: {art_style}

Create a detailed visual prompt for generating this scene's reference image."""),
])

__all__ = [
    "CHARACTER_EXTRACTION_PROMPT",
    "SETTING_EXTRACTION_PROMPT",
    "SCENE_EXTRACTION_PROMPT",
    "VISUAL_DESCRIPTION_PROMPT",
]
