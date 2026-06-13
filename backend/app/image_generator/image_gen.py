"""Image generation service for reference images."""

import base64
import os
from typing import Literal

import replicate
from pydantic import BaseModel

from app.core.logging import logger


class ImageGenRequest(BaseModel):
    """Request model for image generation."""

    prompt: str
    style: Literal["anime", "pixar", "realistic", "cinematic", "fantasy"] = "cinematic"
    aspect_ratio: Literal["1:1", "16:9", "9:16", "4:3"] = "1:1"
    num_images: int = 1
    negative_prompt: str | None = None


class ImageGenResponse(BaseModel):
    """Response model for image generation."""

    success: bool
    images: list[str] = []
    error: str | None = None


class ImageGenerator:
    """Image generation service using Replicate API."""

    def __init__(self):
        """Initialize image generator.

        """
        self.api_token = os.getenv("REPLICATE_API_TOKEN")

        if not self.api_token:
            raise ValueError("REPLICATE_API_TOKEN environment variable must be set")

        self.client = replicate.Client(api_token=self.api_token)
        self.model_type = os.getenv("MODEL_TYPE", "text2image")
        self.model_id = os.getenv("REPLICATE_MODEL_ID", "prunaai/p-image")

    async def close(self):
        """Close the client connection.

        Note: replicate.Client manages httpx connections internally and
        cleans them up on garbage collection. This is a no-op for compatibility.
        """
        pass

    async def generate_character_reference(
        self,
        character_name: str,
        description: str,
        style: str = "cinematic",
    ) -> str | None:
        """Generate a reference image for a character.

        Args:
            character_name: Name of the character
            description: Visual description of the character
            style: Art style (anime, pixar, realistic, cinematic, fantasy)

        Returns:
            URL of the generated image, or None if generation failed
        """
        logger.info("Generating character reference image", character=character_name, style=style)
        prompt = self._build_character_prompt(character_name, description, style)
        result = await self._generate_image(prompt, aspect_ratio="1:1")
        if result:
            logger.success("Character reference image generated", character=character_name, url=result)
        else:
            logger.warning("Character reference image generation failed", character=character_name)
        return result

    async def generate_setting_reference(
        self,
        setting_name: str,
        description: str,
        style: str = "cinematic",
    ) -> str | None:
        """Generate a reference image for a setting/location.

        Args:
            setting_name: Name of the setting
            description: Visual description of the setting
            style: Art style

        Returns:
            URL of the generated image, or None if generation failed
        """
        prompt = self._build_setting_prompt(setting_name, description, style)
        return await self._generate_image(prompt, aspect_ratio="16:9")

    async def generate_scene_reference(
        self,
        visual_prompt: str,
        style: str = "cinematic",
        reference_paths: list[str] | None = None
    ) -> str | None:
        """Generate a reference image for a scene.

        Args:
            visual_prompt: Detailed visual description prompt
            style: Art style (currently unused, for future enhancement)
            reference_paths: List of local file paths to use as references

        Returns:
            URL of the generated image, or None if generation failed
        """
        return await self._generate_image(
            visual_prompt,
            aspect_ratio="16:9",
            reference_paths=reference_paths or []
        )

    async def _generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        reference_paths: list[str] | None = None
    ) -> str | None:
        """Generate an image using the model.

        Args:
            prompt: Text prompt for image generation
            aspect_ratio: Image aspect ratio
            reference_paths: List of local file paths to use as references (for image2image)

        Returns:
            URL of the generated image, or None if generation failed
        """
        try:
            logger.debug("Creating prediction", aspect_ratio=aspect_ratio, model_type=self.model_type)

            input_params = {
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
            }

            # Add reference images if model supports it and references are provided
            if self.model_type == "image2image" and reference_paths:
                image_inputs = []
                for ref_path in reference_paths:
                    try:
                        with open(ref_path, "rb") as file:
                            data = base64.b64encode(file.read()).decode("utf-8")
                            image_inputs.append(f"data:application/octet-stream;base64,{data}")
                    except Exception as e:
                        logger.warning("Failed to read reference image", path=ref_path, error=str(e))

                if image_inputs:
                    input_params["image_input"] = image_inputs
                    logger.debug("Added reference images", count=len(image_inputs))

            output = await self.client.async_run(self.model_id, input=input_params)

            if output is None:
                logger.error("No output from model")
                return None

            # Output is a FileOutput object
            if hasattr(output, 'url'):
                logger.success("Image generation succeeded", url=output.url)
                return output.url

            # If output is a list, get the first item
            if isinstance(output, list) and len(output) > 0:
                first_item = output[0]
                if hasattr(first_item, 'url'):
                    logger.success("Image generation succeeded", url=first_item.url)
                    return first_item.url

            logger.error("Unexpected output format", output_type=type(output))
            return None

        except Exception as e:
            logger.error("Image generation exception", error=str(e))
            return None

    def _build_character_prompt(
        self,
        name: str,
        description: str,
        style: str,
    ) -> str:
        """Build a prompt for character reference image.

        Args:
            name: Character name
            description: Visual description
            style: Art style

        Returns:
            Complete prompt for image generation
        """
        style_map = {
            "anime": "anime style, clean lines, vibrant colors, Studio Ghibli inspired",
            "pixar": "Pixar style, 3D render, cute, expressive, high detail",
            "realistic": "photorealistic, professional photography, 8K, hyperrealistic",
            "cinematic": "cinematic, dramatic lighting, film still, high detail, 4K",
            "fantasy": "fantasy art, magical, ethereal, detailed illustration",
        }

        style_desc = style_map.get(style, style_map["cinematic"])
        return f"""Character {name}.
{description}
Requirements:
- Full body character
- Standing pose
- Front view
- Entire character visible from head to toe
- Focus on character appearance
{style_desc}, high quality, detailed character design."""

    def _build_setting_prompt(
        self,
        name: str,
        description: str,
        style: str,
    ) -> str:
        """Build a prompt for setting reference image.

        Args:
            name: Setting name
            description: Visual description
            style: Art style

        Returns:
            Complete prompt for image generation
        """
        style_map = {
            "anime": "anime style background, Makoto Shinkai inspired, vibrant",
            "pixar": "Pixar style environment, 3D render, colorful, detailed",
            "realistic": "photorealistic landscape, professional photography, 8K",
            "cinematic": "cinematic establishing shot, dramatic lighting, film still",
            "fantasy": "fantasy landscape, magical atmosphere, detailed illustration",
        }

        style_desc = style_map.get(style, style_map["cinematic"])
        return f"""Environment concept art: {name}.
{description}
Wide establishing shot.
{style_desc}, high quality, detailed background."""


__all__ = ["ImageGenerator", "ImageGenRequest", "ImageGenResponse"]
