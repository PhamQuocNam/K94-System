"""Image generation service for reference images."""

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

    MODEL_ID = "prunaai/p-image"

    def __init__(self, api_token: str | None = None):
        """Initialize image generator.

        Args:
            api_token: Replicate API token. If None, reads from REPLICATE_API_TOKEN env var.
        """
        self.api_token = api_token or os.getenv("REPLICATE_API_TOKEN")
        if not self.api_token:
            raise ValueError("REPLICATE_API_TOKEN environment variable must be set")

        self.client = replicate.Client(api_token=self.api_token)

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
    ) -> str | None:
        """Generate a reference image for a scene.

        Args:
            visual_prompt: Detailed visual description prompt
            style: Art style

        Returns:
            URL of the generated image, or None if generation failed
        """
        return await self._generate_image(visual_prompt, aspect_ratio="16:9")

    async def _generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
    ) -> str | None:
        """Generate an image using the model.

        Args:
            prompt: Text prompt for image generation
            aspect_ratio: Image aspect ratio

        Returns:
            URL of the generated image, or None if generation failed
        """
        try:
            logger.debug("Creating prediction", aspect_ratio=aspect_ratio)

            output = await self.client.async_run(
                self.MODEL_ID,
                input={
                    "prompt": prompt,
                    "aspect_ratio": aspect_ratio,
                },
            )

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
        return f"""Character reference sheet for {name}.
{description}
Full body shot, front view.
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
