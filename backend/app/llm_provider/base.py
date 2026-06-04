"""Base Abstract class for LLM Providers."""

from abc import ABC, abstractmethod

from langchain_core.language_models.chat_models import BaseChatModel


class BaseLLMProvider(ABC):
    """Abstract base class for all Language Model Providers."""

    @abstractmethod
    def get_model(self) -> BaseChatModel:
        """Instantiate and return the configured chat model."""
        pass