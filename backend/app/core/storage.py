"""Storage utility for saving and serving images."""

import uuid
from pathlib import Path

import httpx
from fastapi import HTTPException, status

from app.core.logging import logger


class Storage:
    """Storage service for managing uploaded/generated images."""

    def __init__(self, base_path: str | None = None):
        """Initialize storage service.

        Args:
            base_path: Base path for storing images. Defaults to 'static/uploads'
        """
        if base_path is None:
            # Default to 'static/uploads' in the project root
            project_root = Path(__file__).parent.parent.parent
            base_path = project_root / "static" / "uploads"

        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        logger.info("Storage initialized", path=str(self.base_path))

    async def download_and_save(self, url: str, subfolder: str = "generated") -> str:
        """Download image from URL and save to local storage.

        Args:
            url: URL of the image to download
            subfolder: Subfolder within storage (e.g., 'generated', 'uploaded')

        Returns:
            Relative path to saved image

        Raises:
            HTTPException: If download fails
        """
        folder = self.base_path / subfolder
        folder.mkdir(exist_ok=True)

        filename = f"{uuid.uuid4()}.png"
        file_path = folder / filename

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()

                file_path.write_bytes(response.content)
                logger.info("Image saved", path=str(file_path))

                # Return relative path for URL construction
                return f"/static/uploads/{subfolder}/{filename}"

        except httpx.HTTPError as e:
            logger.error("Failed to download image", url=url, error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to download image: {str(e)}"
            )
        except Exception as e:
            logger.error("Failed to save image", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save image: {str(e)}"
            )

    async def download_to_temp(self, url: str) -> str | None:
        """Download image from URL to temporary location.

        Args:
            url: URL of the image to download (or relative path)

        Returns:
            Absolute path to temporary file, or None if download fails
        """
        # Handle relative paths (already local)
        if url.startswith("/static/"):
            abs_path = self.get_absolute_path(url)
            if abs_path.exists():
                return str(abs_path)
            logger.warning("Local file not found", path=str(abs_path))
            return None

        temp_folder = self.base_path / "temp"
        temp_folder.mkdir(exist_ok=True)

        filename = f"{uuid.uuid4()}.png"
        file_path = temp_folder / filename

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()

                file_path.write_bytes(response.content)
                logger.debug("Temp image downloaded", path=str(file_path))
                return str(file_path)

        except Exception as e:
            logger.warning("Failed to download temp image", url=url, error=str(e))
            return None

    def save_upload(self, filename: str, contents: bytes, subfolder: str = "uploaded") -> str:
        """Save uploaded file to local storage.

        Args:
            filename: Original filename
            contents: File content as bytes
            subfolder: Subfolder within storage

        Returns:
            Relative path to saved file
        """
        folder = self.base_path / subfolder
        folder.mkdir(exist_ok=True)

        # Generate unique filename
        ext = Path(filename).suffix or ".png"
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = folder / unique_filename

        file_path.write_bytes(contents)
        logger.info("File uploaded", path=str(file_path))

        return f"/static/uploads/{subfolder}/{unique_filename}"

    def get_absolute_path(self, relative_path: str) -> Path:
        """Get absolute file path from relative URL path.

        Args:
            relative_path: Relative path like '/static/uploads/generated/xxx.png'

        Returns:
            Absolute path to file
        """
        # Convert URL path to file system path
        # '/static/uploads/generated/xxx.png' -> project_root / 'static/uploads/generated/xxx.png'
        if relative_path.startswith("/"):
            relative_path = relative_path[1:]

        # Get project root (parent of static directory)
        project_root = self.base_path.parent.parent
        return project_root / relative_path

    def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage.

        Args:
            file_path: Absolute or relative path to file

        Returns:
            True if deleted, False otherwise
        """
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                logger.debug("File deleted", path=str(path))
                return True
            return False
        except Exception as e:
            logger.warning("Failed to delete file", path=file_path, error=str(e))
            return False


# Global storage instance
storage = Storage()


__all__ = ["Storage", "storage"]
