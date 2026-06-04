"""Load LLM provider configuration from agent_params.yml."""

from dataclasses import dataclass
from pathlib import Path

import yaml

_CONFIG_PATH = Path(__file__).parents[3] / "agent_params.yml"


@dataclass
class ProviderConfig:
    model: str
    temperature: float
    max_tokens: int


@dataclass
class LLMConfig:
    default_provider: str
    openai: ProviderConfig
    claude: ProviderConfig
    google: ProviderConfig


def _load() -> LLMConfig:
    with open(_CONFIG_PATH) as f:
        raw = yaml.safe_load(f)["llm"]
    return LLMConfig(
        default_provider=raw["default_provider"],
        openai=ProviderConfig(**raw["openai"]),
        claude=ProviderConfig(**raw["claude"]),
        google=ProviderConfig(**raw["google"]),
    )


llm_config = _load()
