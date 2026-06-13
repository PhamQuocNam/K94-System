"""Prompt templates for story analysis."""

from langchain_core.prompts import ChatPromptTemplate

# Character extraction prompt
CHARACTER_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert story analyzer. 
You are given a story and your task is to analyze and extract all characters from the given story.

For each character, provide:
- name: Character's name
- gender: male/female/other
- age: Estimated age (number)
- body_build: Physical description (height, build, etc.)
- face: Facial features description
- hair: Hair style and color
- clothes: Typical clothing/attire
- nationality: Ethnicity or nationality

Rules:
1. If a visual attribute is explicitly described in the story, use that description.
2. If an attribute is not described, generate a realistic appearance consistent with the story.
3. Never leave visual fields empty.
4. For non-human characters:
- Adapt fields naturally.
- Use species traits when applicable.
- Do not invent human-like features unless explicitly stated in the story.
- Replace human traits with equivalent species traits.
- If a field does not logically apply, provide a suitable equivalent description.
5. Age should be an estimated integer.
6. Return ONLY a valid JSON array.
7. Do not merge character appearances when the same character undergoes a significant visual transformation.
8. If a character changes appearance substantially during the story, create separate character entries for each major visual form.

JSON REQUIREMENTS:
- Return ONLY valid JSON.
- Return a JSON array.
- No markdown.
- No explanations.
- No code blocks.
- No text before or after JSON.

Examples:
Human:
{{
"name": "John",
"character_type": "human",
"gender": "male",
"age": 35,
"body_build": "Tall athletic man",
"face": "Square jaw and blue eyes",
"hair": "Short blond hair",
"clothes": "Blue shirt and jeans",
"nationality": "American"
}}

Animal:
{{
"name": "Buddy",
"character_type": "dog",
"gender": "male",
"age": 5,
"body_build": "Medium-sized golden retriever",
"face": "Friendly muzzle and expressive brown eyes",
"hair": "Golden fur",
"clothes": "Red collar",
"nationality": ""
}}
"""),
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
- description: short visual description of the environment.
- time_of_day: morning, afternoon, evening, night, dawn, dusk, or unknown
- weather: weather conditions
- art_style: visual style suitable for image generation
- scene_start: index of the first scene where this setting appears
- scene_end: index of the last consecutive scene where this setting remains the primary setting

INFERENCE RULES
If a field is explicitly described in the story:
- Use the information from the story.

If a field is not described:
- Infer a reasonable value based on the story context, genre, mood, and surrounding events.
- Keep the inference realistic and consistent with the story.
- Never let the field empty, null or unknown.

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
        "scene_start": 1,
        "scene_end": 5
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
You are an expert screenplay analyst and storyboard writer.
Your task is to analyze and convert the given story into a long detailed sequence of visual scenes. More scenes, more better
Prefer a larger number of meaningful scenes rather than merging important moments together. Break major events into smaller visual moments, including setup, action, reaction, and consequence whenever appropriate.

SCENE SEGMENTATION RULES:
1. Keep scenes visually coherent.
2. Preserve chronological order.
3. Multiple shots of the same event are allowed when they provide a different cinematic perspective.
4. Prefer a larger number of meaningful scenes rather than merging important moments together.
5. Create additional scenes for important emotional moments when appropriate.
6. Significant actions may be shown from multiple cinematic perspectives.

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
    "sequence_number": 30,
    "title": "Entering the Forest",
    "narrative_description": "John arrives at the edge of the forest and hesitates before entering.",
    "visual_description": "A young man standing before a dark misty forest at sunset.",
    "characters_present": ["John"]
  }}
]
"""),
    ("human", """Story to analyze:
{story}

Characters:
{characters}

Break this story into multiple scenes and return as JSON array."""),
])

ADD_MISSING_SCENES_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an expert storyboard writer.
You are given:
1. A story.
2. A sequence of storyboard scenes.

Your task is to identify narrative gaps and generate ONLY the missing scenes needed to improve story continuity.

Rules:
- Do NOT modify existing scenes.
- Do NOT rewrite existing scenes.
- Do NOT return existing scenes.
- Generate newly added scenes.
- Every generated scene must fit naturally into the story.
- sequence_number indicates where the scene should be inserted.
- If no additional scenes are needed, return [].

JSON REQUIREMENTS:
- Return ONLY valid JSON.
- Return a JSON array.
- No markdown.
- No explanations.
- No code blocks.
- No text before or after JSON.
"""
        ),
        (
            "human",
            """
Story:
{story}

Sequence of scenes:
{scenes}

Analyze the story and existing scenes.
Generate ONLY the missing scenes.
Return valid JSON.
"""
        ),
    ]
)

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
