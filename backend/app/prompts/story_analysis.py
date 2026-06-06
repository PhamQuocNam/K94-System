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
You are an expert environment analyst and visual storyteller.
Your task is to extract all important settings (locations) from the story.

SETTING RULES
1. Extract every significant location that plays a role in the story.
2. Merge duplicate references to the same location.
3. Return settings in order of first appearance.
4. Ignore insignificant or one-time background locations.
5. Focus on locations that could be visually represented in an image or video.

FIELD RULES
For each setting provide:
- name: location name
- description: detailed visual description of the environment
- time_of_day: morning, afternoon, evening, night, dawn, dusk, or unknown
- weather: weather conditions or unknown
- art_style: visual style suitable for image generation
- dominant_colors: list of main colors associated with the setting

INFERENCE RULES
If a field is explicitly described in the story:
- Use the information from the story.

If a field is not described:
- Infer a reasonable value based on the story context, genre, mood, and surrounding events.
- Keep the inference realistic and consistent with the story.
- Do not invent major story details.

DESCRIPTION GUIDELINES
The description should be detailed enough for image generation and include:
- Environment appearance
- Important objects
- Atmosphere
- Lighting conditions when relevant

JSON RULES
- Return ONLY valid JSON.
- Return a JSON array.
- No markdown.
- No explanations.
- No code blocks.

Example:
[
    {{
        "name": "Mystical Forest",
        "description": "An ancient forest with towering trees, glowing plants, thick mist, and winding paths illuminated by soft evening light.",
        "time_of_day": "evening",
        "weather": "foggy",
        "art_style": "fantasy cinematic",
    }}
]
"""
    ),
    (
        "human",
        """
Story:

{story}

Extract all settings and return valid JSON.
"""),
])

# Scene extraction prompt
SCENE_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert screenplay analyst and storyboard planner.

Your task is to convert a narrative story into a sequence of visual scenes suitable for AI image and video generation.

SCENE SEGMENTATION RULES:
1. Keep scenes visually coherent.
2. Preserve chronological order.
3. Do not skip important events.
4. Do not create duplicate scenes.
5. Every scene should be visually representable.

For each scene return:

- sequence_number: integer
- title: short scene title
- narrative_description: detailed description of what happens
- visual_description: what should be visible on screen
- characters_present: list of character names

JSON REQUIREMENTS:
- Return ONLY valid JSON.
- Return a JSON array.
- No markdown.
- No explanations.
- No code blocks.
- No text before or after JSON.

Example:

[
  {{
    "sequence_number": 1,
    "title": "Entering the Forest",
    "narrative_description": "John arrives at the edge of the forest and hesitates before entering.",
    "visual_description": "A young man standing before a dark misty forest at sunset.",
    "characters_present": ["John"],
  }}
]
"""),
    ("human", """Story to analyze:
{story}

Break this story into scenes and return as JSON array."""),
])

# Visual description generation prompt
VISUAL_DESCRIPTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert character analyst and visual character designer.
Your task is to extract all significant characters from a story and create a visual profile for each character.

CHARACTER EXTRACTION RULES
1. Extract every important named character.
2. Ignore background or unnamed crowd characters.
3. Preserve the exact character name from the story.
4. Return characters in order of first appearance.

APPEARANCE RULES
If appearance information is explicitly mentioned in the story:
- Use the exact information.
If appearance information is NOT mentioned:
- Infer a reasonable appearance based on:
  - Character role
  - Age
  - Occupation
  - Personality
  - Story setting
- Keep inferred descriptions realistic and generic.
- Do NOT invent fantasy traits unless supported by the story.


For each character return:
- name
- gender
- age
- body_build
- face
- hair
- clothes
- nationality
- personality
- role
- appearance_source

appearance_source values:
- "explicit" = appearance described in story
- "inferred" = appearance generated by reasoning
- "mixed" = combination of both

JSON RULES
- Return ONLY valid JSON.
- Return a JSON array.
- No markdown.
- No explanations.
- No code blocks.

Example:

[
    {{
        "name": "John",
        "gender": "male",
        "age": 35,
        "body_build": "Tall and athletic",
        "face": "Square jaw and blue eyes",
        "hair": "Short blond hair",
        "clothes": "Blue button-down shirt",
        "nationality": "American",
        "personality": "Brave and determined",
        "role": "Protagonist",
        "appearance_source": "explicit"
    }}
]
"""
    ),
    (
        "human",
        """
Story:

{story}

Extract all significant characters and return valid JSON.
"""),
])

__all__ = [
    "CHARACTER_EXTRACTION_PROMPT",
    "SETTING_EXTRACTION_PROMPT",
    "SCENE_EXTRACTION_PROMPT",
    "VISUAL_DESCRIPTION_PROMPT",
]
