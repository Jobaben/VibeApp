"""Exception types raised by the LLM layer."""


class InsightGenerationError(Exception):
    """Raised when the LLM call fails after SDK-level retries are exhausted."""


class InsightSchemaError(Exception):
    """Raised when the LLM response does not conform to the AIInsight schema."""

    def __init__(self, message: str, raw_output: str = ""):
        super().__init__(message)
        self.raw_output = raw_output
