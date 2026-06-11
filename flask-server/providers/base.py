"""Provider interface. Everything the app needs from an LLM is one method."""
from abc import ABC, abstractmethod


class LLMError(RuntimeError):
    """Raised when the upstream model call fails (network, auth, quota...)."""


class QuizProvider(ABC):
    @abstractmethod
    def generate_json(
        self, prompt: str, *, temperature: float, response_schema: dict
    ) -> str:
        """Run ``prompt`` and return the model's raw text (expected: JSON).

        Implementations should pass ``response_schema`` to the model when the
        backend supports structured output, and raise :class:`LLMError` on any
        transport/auth/quota failure.
        """
        raise NotImplementedError
