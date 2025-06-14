"""
Parserator Exception Classes
"""


class ParseException(Exception):
    """Base exception for parsing errors."""
    pass


class APIException(Exception):
    """Exception for API-related errors."""
    
    def __init__(self, message: str, error_data: dict = None):
        super().__init__(message)
        self.error_data = error_data or {}