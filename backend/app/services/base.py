"""Base service class with common patterns."""

from sqlmodel import Session
from langchain_core.language_models.chat_models import BaseChatModel

from app.image_generator.image_gen import ImageGenerator
from app.video_generator import VideoGenerator
from app.llm_provider import get_llm


class BaseService:
    """Base service class with common initialization patterns."""

    def __init__(
        self,
        session: Session,
        llm_provider: str | None = None,
        llm: BaseChatModel | None = None,
    ):
        """Initialize base service.

        Args:
            session: Database session
            llm_provider: LLM provider name (openai, claude, google)
            llm: Pre-configured LLM instance (overrides llm_provider)
        """
        self.session = session
        self.llm = llm or get_llm(provider=llm_provider)
        self._image_generator: ImageGenerator | None = None
        self._video_generator: VideoGenerator | None = None

    @property
    def image_generator(self) -> ImageGenerator:
        """Lazy-load image generator."""
        if self._image_generator is None:
            self._image_generator = ImageGenerator()
        return self._image_generator

    @property
    def video_generator(self) -> VideoGenerator:
        """Lazy-load video generator."""
        if self._video_generator is None:
            self._video_generator = VideoGenerator()
        return self._video_generator

    async def cleanup(self) -> None:
        """Clean up resources."""
        if self._image_generator:
            await self._image_generator.close()
        if self._video_generator:
            await self._video_generator.close()
