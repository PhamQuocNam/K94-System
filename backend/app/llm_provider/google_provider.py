"""Google Gemini LLM provider."""

import os

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI

from app.llm_provider.base import BaseLLMProvider
from app.llm_provider.config import llm_config


class GoogleProvider(BaseLLMProvider):
    def __init__(self, model_override: str | None = None) -> None:
        cfg = llm_config.google
        self.model = model_override or cfg.model
        self.temperature = cfg.temperature
        self.max_tokens = cfg.max_tokens
        self.api_key = os.environ["GOOGLE_API_KEY"]

    def get_model(self) -> BaseChatModel:
        return ChatGoogleGenerativeAI(
            model=self.model,
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
            google_api_key=self.api_key,
        )
