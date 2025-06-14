"""
Parserator SDK - Official Python SDK for Parserator AI-powered data parsing.

The Parserator SDK provides a simple interface to the Parserator API,
enabling you to parse unstructured text into structured JSON using
the revolutionary Architect-Extractor pattern.

Example:
    >>> from parserator import Parserator
    >>> client = Parserator(api_key="your_api_key")
    >>> result = client.parse("John Smith, john@email.com, 555-1234", {
    ...     "name": "string",
    ...     "email": "string", 
    ...     "phone": "string"
    ... })
    >>> print(result.data)
    {'name': 'John Smith', 'email': 'john@email.com', 'phone': '555-1234'}
"""

__version__ = "1.1.0-alpha"
__author__ = "Paul Phillips"
__email__ = "Gen-rl-millz@parserator.com"

from .client import Parserator
from .exceptions import ParseException, APIException
from .models import ParseRequest, ParseResponse

__all__ = [
    "Parserator",
    "ParseException", 
    "APIException",
    "ParseRequest",
    "ParseResponse"
]