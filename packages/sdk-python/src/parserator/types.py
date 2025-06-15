"""
Type definitions for Parserator Python SDK
"""

from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel


class ParseRequest(BaseModel):
    """Request model for parsing operations"""
    input_data: str
    output_schema: Dict[str, str]
    confidence_threshold: Optional[float] = None
    options: Optional[Dict[str, Any]] = None


class ErrorRecovery(BaseModel):
    """Error recovery suggestions"""
    suggestions: List[Dict[str, Any]]
    suggested_schema: Optional[Dict[str, Any]] = None
    suggested_input: Optional[str] = None
    auto_retry_recommended: bool = False
    explanation: str


class ParseMetadata(BaseModel):
    """Metadata from parsing operation"""
    confidence: float
    processing_time_ms: int
    tokens_used: int
    request_id: str
    timestamp: str
    version: str
    features: List[str]
    architect_plan: Optional[Dict[str, Any]] = None


class ParseResponse(BaseModel):
    """Response model for parsing operations"""
    success: bool
    parsed_data: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    metadata: Optional[ParseMetadata] = None
    recovery: Optional[ErrorRecovery] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    message: str
    timestamp: str
    version: str