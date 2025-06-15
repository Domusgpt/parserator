"""
Parserator Python SDK - Official client for Parserator API
"""

from .client import Parserator
from .types import ParseRequest, ParseResponse

__version__ = "1.0.0"
__all__ = ["Parserator", "ParseRequest", "ParseResponse"]