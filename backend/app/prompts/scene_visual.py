"""Prompt templates for Phase 2: Scene visual generation."""

from langchain_core.prompts import ChatPromptTemplate


# Visual prompt generation for scene images
SCENE_VISUAL_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert visual director and AI image generation specialist.
Your task is to create detailed visual prompts for generating scene images that maintain character consistency.

VISUAL PROMPT GUIDELINES:
1. Create a detailed, cinematic visual description
2. Incorporate character reference information
3. Consider setting/environment details
4. Include camera angle and composition
5. Add lighting and mood details
6. Specify the art style consistently

CHARACTER CONSISTENCY RULES:
1. If character references are provided, describe them EXACTLY as shown in references
2. Maintain consistent facial features, hair, clothing, and body type
3. Include character position and pose relevant to the scene action
4. If no character reference exists, describe based on narrative description

SCENE HISTORY CONTEXT:
Previous scenes provide context for:
- Character position changes
- Character emotional states
- Props or objects being carried
- Time progression
- Weather/lighting changes

OUTPUT FORMAT:
Return ONLY a valid JSON object with these exact keys:
- visual_prompt: detailed visual description for image generation
- camera_angle: one of wide/medium/close-up/extreme close-up/bird's eye/low angle
- lighting: description of lighting conditions
- mood: overall mood of the scene

JSON REQUIREMENTS:
- Return ONLY valid JSON
- No markdown
- No explanations
- No code blocks
"""),
    ("human", """Generate a visual prompt for this scene:

SCENE: {scene_title}
NARRATIVE: {narrative_description}
BASE VISUAL: {visual_description}

CHARACTERS IN SCENE:
{character_info}

SETTING:
{setting_info}

STYLE: {art_style}

SCENE HISTORY (previous scenes for context):
{scene_history}

Generate visual prompt as JSON."""),
])


# Character state update prompt
CHARACTER_STATE_UPDATE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert character state tracker for animation and storytelling.
Your task is to analyze a scene and determine how character states change.

CHARACTER STATE ASPECTS TO TRACK:
1. Physical position: standing, sitting, lying down, walking, running
2. Emotional state: happy, sad, angry, fearful, surprised, neutral
3. Props/objects held: what characters are carrying or holding
4. Appearance changes: injuries, clothing damage, dirt, etc.

OUTPUT FORMAT:
For each character, provide these keys in a JSON object:
- character_name (as the key)
- position: current physical position
- emotion: dominant emotional state
- holding: list of objects being held
- appearance_notes: any visible changes to appearance
- visible_body_parts: which parts are visible in frame

Return a flat JSON object with character names as keys, not an array.

JSON RULES:
- Return ONLY valid JSON
- Return a JSON object (not array)
- No markdown
- No explanations
- No code blocks
"""),
    ("human", """Analyze character states for this scene:

SCENE: {scene_title}
NARRATIVE: {narrative_description}

CHARACTERS IN SCENE:
{character_list}

PREVIOUS STATES (if any):
{previous_states}

Determine new character states as JSON."""),
])


# Scene camera and composition prompt
CAMERA_COMPOSITION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are an expert cinematographer and visual storyteller.
Your task is to determine the best camera angle and composition for a scene.

CAMERA ANGLE OPTIONS:
- wide shot (establishing, full environment)
- medium shot (waist up, character interaction)
- close-up (facial expressions, emotion)
- extreme close-up (detail focus, eyes, hands)
- bird's eye (overhead, unique perspective)
- low angle (power, dominance)
- dutch angle (tension, unease)
- over-the-shoulder (conversation, POV)

COMPOSITION FACTORS:
1. Scene action and movement
2. Emotional tone
3. Character relationships
4. Environmental context
5. Pacing and rhythm

OUTPUT FORMAT:
Return a JSON object with these keys:
- camera_angle: selected angle from the options above
- reasoning: why this angle fits the scene
- composition_notes: specific framing guidance
- focal_length: suggested focal length like 24mm, 35mm, 50mm, or 85mm
- depth_of_field: shallow or deep based on focus needs

JSON RULES:
- Return ONLY valid JSON
- No markdown
- No explanations
- No code blocks
"""),
    ("human", """Determine camera and composition for:

SCENE: {scene_title}
NARRATIVE: {narrative_description}
SCENE TYPE: {scene_type}
MOOD: {mood}

CHARACTERS: {character_count}
SETTING: {setting_name}

Return camera decision as JSON."""),
])


ADD_NEW_SCENE_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a professional storyboard writer.
You are given:
1. A story.
2. A brief content description.
3. Characters name in the story.

Your task is to convert the brief content into a complete storyboard scene.
Scene fields:
- title: short scene title
- narrative_description: detailed description of what happens
- visual_description: what should be visible on screen
- characters_present: list of character names appearing in the scene

Rules:
- Stay consistent with the story.
- Do not invent major events that contradict the story.
- Make the scene visually clear and image-generation friendly.
- Include only characters that are actually present in the scene.

JSON REQUIREMENTS:
- Return ONLY valid JSON.
- No markdown.
- No explanations.
- No code blocks.

Return format:
{{
  "title": string,
  "narrative_description": string,
  "visual_description": string,
  "characters_present": [string]
}}
"""
        ),
        (
            "human",
            """
Story:
{story}

Brief content:
{content}

Characters:
{characters}

Generate the scene and return valid JSON.
"""
        ),
    ]
)


__all__ = [
    "SCENE_VISUAL_PROMPT",
    "CHARACTER_STATE_UPDATE_PROMPT",
    "CAMERA_COMPOSITION_PROMPT",
]
