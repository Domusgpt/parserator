"""
Parserator Errors Package.

This package contains custom exception classes for the Parserator SDK.
"""


class ParseratorError(Exception):
    """Base exception class for all Parserator errors."""
    
    def __init__(self, message: str, error_code: str = None, details: dict = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}


class ValidationError(ParseratorError):
    """Raised when input validation fails."""
    pass


class AuthenticationError(ParseratorError):
    """Raised when API authentication fails."""
    pass


class RateLimitError(ParseratorError):
    """Raised when API rate limit is exceeded."""
    pass


class QuotaExceededError(ParseratorError):
    """Raised when API quota is exceeded."""
    pass


class NetworkError(ParseratorError):
    """Raised when network communication fails."""
    pass


class TimeoutError(ParseratorError):
    """Raised when requests timeout."""
    pass


class ParseFailedError(ParseratorError):
    """Raised when parsing operation fails."""
    pass


class ServiceUnavailableError(ParseratorError):
    """Raised when the Parserator service is unavailable."""
    pass


# Export all errors
__all__ = [
    'ParseratorError',
    'ValidationError',
    'AuthenticationError',
    'RateLimitError',
    'QuotaExceededError',
    'NetworkError',
    'TimeoutError',
    'ParseFailedError',
    'ServiceUnavailableError'
]