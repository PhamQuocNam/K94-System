"""OpenAI LLM provider."""

import os

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI

from app.llm_provider.base import BaseLLMProvider
from app.llm_provider.config import llm_config


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, model_override: str | None = None) -> None:
        cfg = llm_config.openai
        self.model = model_override or cfg.model
        self.temperature = cfg.temperature
        self.max_tokens = cfg.max_tokens
        self.api_key = os.environ["OPENAI_API_KEY"]

    def get_model(self) -> BaseChatModel:
        return ChatOpenAI(
            model=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            api_key=self.api_key,
        )
