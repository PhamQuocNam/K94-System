"""Storage utility helpers for reference URL handling."""

from typing import Sequence

from app.core.logging import logger
from app.core.storage import storage
from app.models import Character, Setting


async def collect_reference_paths(
    characters: Sequence[Character] | None = None,
    setting: Setting | None = None,
) -> list[str]:
    """Collect and download reference images to local paths.

    Args:
        characters: List of character models with reference images
        setting: Setting model with reference image

    Returns:
        List of local file paths for downloaded references
    """
    # Collect all reference URLs
    reference_urls = []
    
    if characters:
        reference_urls.extend(
            char.reference_image_url 
            for char in characters 
            if char.reference_image_url
        )
    
    if setting and setting.reference_image_url:
        reference_urls.append(setting.reference_image_url)
    
    # Download references to local files
    reference_paths = []
    for url in reference_urls:
        if url:
            try:
                local_path = await storage.download_to_temp(url)
                if local_path:
                    reference_paths.append(local_path)
            except Exception as e:
                logger.warning("Failed to download reference", url=url, error=str(e))
    
    return reference_paths
