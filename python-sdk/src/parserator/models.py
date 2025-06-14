"""
Parserator Data Models
"""
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ParseRequest:
    """Request model for parse operations."""
    text: str
    schema: Dict[str, Any]
    context: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API request."""
        data = {
            "text": self.text,
            "schema": self.schema
        }
        if self.context:
            data["context"] = self.context
        return data


@dataclass 
class ParseResponse:
    """Response model for parse operations."""
    success: bool
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    request_id: Optional[str] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ParseResponse':
        """Create from API response dictionary."""
        return cls(
            success=data.get("success", False),
            data=data.get("data", {}),
            metadata=data.get("metadata", {}),
            request_id=data.get("request_id")
        )