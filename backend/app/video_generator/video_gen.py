"""Video generation service using Replicate API."""

import os
import base64

import replicate
from app.core.logging import logger


class VideoGenerator:
    """Video generation service using Replicate p-video API."""

    def __init__(self):
        """Initialize video generator."""
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        
        if not self.api_token:
            raise ValueError("REPLICATE_API_TOKEN environment variable must be set")

        self.client = replicate.Client(api_token=self.api_token)
        self.model_id = "prunaai/p-video"

    async def generate_video_from_image(
        self,
        image_path: str,
        prompt: str,
        duration: float = 3.0,
    ) -> str | None:
        """Generate a video from an image using p-video.

        Args:
            image_path: Local path to the input image
            prompt: Text description for video generation
            duration: Video duration in seconds (1-10)

        Returns:
            URL of the generated video, or None if generation failed
        """
        try:
            logger.info("Generating video from image", image=image_path, duration=duration)
            
            # Read and encode image
            try:
                with open(image_path, "rb") as file:
                    data = base64.b64encode(file.read()).decode("utf-8")
                    image_data = f"data:application/octet-stream;base64,{data}"
            except FileNotFoundError:
                logger.error("Image file not found", path=image_path)
                return None
            except Exception as e:
                logger.error("Failed to read image file", path=image_path, error=str(e))
                return None

            # Call p-video API
            output = await self.client.async_run(
                self.model_id,
                input={
                    "prompt": prompt,
                    "image": image_data,
                    "duration": min(max(duration, 1.0), 10.0),  # Clamp to 1-10 seconds
                }
            )

            if output is None:
                logger.error("No output from video model")
                return None

            # Get video URL
            if hasattr(output, 'url'):
                logger.success("Video generation succeeded", url=output.url)
                return output.url

            if isinstance(output, list) and len(output) > 0:
                first_item = output[0]
                if hasattr(first_item, 'url'):
                    logger.success("Video generation succeeded", url=first_item.url)
                    return first_item.url

            logger.error("Unexpected output format", output_type=type(output))
            return None

        except Exception as e:
            logger.error("Video generation exception", error=str(e))
            return None


__all__ = ["VideoGenerator"]
