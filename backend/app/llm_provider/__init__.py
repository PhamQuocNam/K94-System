"""LLM provider factory."""

from langchain_core.language_models.chat_models import BaseChatModel

from app.llm_provider.base import BaseLLMProvider
from app.llm_provider.claude_provider import ClaudeProvider
from app.llm_provider.config import llm_config
from app.llm_provider.google_provider import GoogleProvider
from app.llm_provider.openai_provider import OpenAIProvider

_PROVIDERS: dict[str, type[BaseLLMProvider]] = {
    "openai": OpenAIProvider,
    "claude": ClaudeProvider,
    "google": GoogleProvider,
}


def get_llm(provider: str | None = None, model_override: str | None = None) -> BaseChatModel:
    """Return a configured LangChain chat model.

    Args:
        provider: One of 'openai', 'claude', 'google'. Defaults to agent_params.yml default.
        model_override: Override the model name from config.
    """
    name = provider or llm_config.default_provider
    cls = _PROVIDERS.get(name)
    if cls is None:
        raise ValueError(f"Unknown provider '{name}'. Choose from: {list(_PROVIDERS)}")
    return cls(model_override=model_override).get_model()


__all__ = ["get_llm", "OpenAIProvider", "ClaudeProvider", "GoogleProvider"]
