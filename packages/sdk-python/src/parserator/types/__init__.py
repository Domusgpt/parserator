"""
Parserator Types Package.

This package contains type definitions and data models for the Parserator SDK.
"""

from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
from enum import Enum


class ValidationType(Enum):
    """Supported validation types for parsed fields."""
    STRING = "string"
    EMAIL = "email"
    PHONE = "phone"
    NUMBER = "number"
    ISO_DATE = "iso_date"
    URL = "url"
    STRING_ARRAY = "string_array"
    OBJECT = "object"


class ErrorCode(Enum):
    """Error codes for Parserator operations."""
    INVALID_INPUT = "invalid_input"
    INVALID_SCHEMA = "invalid_schema"
    PARSING_FAILED = "parsing_failed"
    TIMEOUT = "timeout"
    QUOTA_EXCEEDED = "quota_exceeded"
    AUTHENTICATION_ERROR = "authentication_error"
    RATE_LIMIT = "rate_limit"
    NETWORK_ERROR = "network_error"
    SERVICE_UNAVAILABLE = "service_unavailable"


@dataclass
class ParseOptions:
    """Options for parsing operations."""
    confidence_threshold: Optional[float] = None
    timeout: Optional[float] = None
    max_retries: Optional[int] = None
    preserve_formatting: Optional[bool] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values."""
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class ParseMetadata:
    """Metadata returned with parsing results."""
    request_id: str
    processing_time_ms: int
    confidence: float
    tokens_used: int
    architect_plan: Dict[str, Any]
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ParseMetadata':
        """Create from dictionary."""
        return cls(
            request_id=data.get('requestId', ''),
            processing_time_ms=data.get('processingTimeMs', 0),
            confidence=data.get('confidence', 0.0),
            tokens_used=data.get('tokensUsed', 0),
            architect_plan=data.get('architectPlan', {})
        )


@dataclass
class ParseError:
    """Error information for failed parsing operations."""
    code: ErrorCode
    message: str
    details: Optional[Dict[str, Any]] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ParseError':
        """Create from dictionary."""
        return cls(
            code=ErrorCode(data.get('code', 'unknown')),
            message=data.get('message', 'Unknown error'),
            details=data.get('details')
        )


@dataclass
class ParseRequest:
    """Request data for parsing operations."""
    input_data: str
    output_schema: Dict[str, Any]
    instructions: Optional[str] = None
    options: Optional[ParseOptions] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API requests."""
        result = {
            'inputData': self.input_data,
            'outputSchema': self.output_schema
        }
        
        if self.instructions:
            result['instructions'] = self.instructions
            
        if self.options:
            result.update(self.options.to_dict())
            
        return result


@dataclass
class ParseResponse:
    """Response data from parsing operations."""
    success: bool
    parsed_data: Optional[Dict[str, Any]] = None
    metadata: Optional[ParseMetadata] = None
    error: Optional[ParseError] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ParseResponse':
        """Create from API response dictionary."""
        return cls(
            success=data.get('success', False),
            parsed_data=data.get('parsedData'),
            metadata=ParseMetadata.from_dict(data.get('metadata', {})) if data.get('metadata') else None,
            error=ParseError.from_dict(data.get('error', {})) if data.get('error') else None
        )


@dataclass
class BatchParseRequest:
    """Request for batch parsing operations."""
    items: List[ParseRequest]
    options: Optional[ParseOptions] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API requests."""
        result = {
            'items': [item.to_dict() for item in self.items]
        }
        
        if self.options:
            result['options'] = self.options.to_dict()
            
        return result


@dataclass
class BatchOptions:
    """Options for batch parsing operations."""
    parallel: Optional[bool] = None
    max_concurrent: Optional[int] = None
    fail_fast: Optional[bool] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values."""
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class BatchParseResponse:
    """Response from batch parsing operations."""
    success: bool
    results: List[ParseResponse]
    metadata: Optional[Dict[str, Any]] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BatchParseResponse':
        """Create from API response dictionary."""
        return cls(
            success=data.get('success', False),
            results=[ParseResponse.from_dict(item) for item in data.get('results', [])],
            metadata=data.get('metadata')
        )


@dataclass
class SearchStep:
    """Individual step in a parsing plan."""
    target_key: str
    description: str
    search_instruction: str
    validation_type: ValidationType
    is_required: bool
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SearchStep':
        """Create from dictionary."""
        return cls(
            target_key=data.get('targetKey', ''),
            description=data.get('description', ''),
            search_instruction=data.get('searchInstruction', ''),
            validation_type=ValidationType(data.get('validationType', 'string')),
            is_required=data.get('isRequired', False)
        )


@dataclass
class SearchPlan:
    """Complete parsing plan with steps."""
    strategy: str
    steps: List[SearchStep]
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SearchPlan':
        """Create from dictionary."""
        return cls(
            strategy=data.get('strategy', ''),
            steps=[SearchStep.from_dict(step) for step in data.get('steps', [])]
        )


@dataclass
class SchemaValidationResult:
    """Result of schema validation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str]


@dataclass
class ParsePreset:
    """Pre-defined parsing configuration."""
    name: str
    description: str
    output_schema: Dict[str, Any]
    instructions: Optional[str] = None
    options: Optional[ParseOptions] = None


@dataclass
class ParseratorConfig:
    """Configuration for Parserator client."""
    api_key: str
    base_url: str = "https://app-5108296280.us-central1.run.app"
    timeout: float = 30.0
    max_retries: int = 3
    default_options: Optional[ParseOptions] = None


# Export all types
__all__ = [
    'ValidationType',
    'ErrorCode', 
    'ParseOptions',
    'ParseMetadata',
    'ParseError',
    'ParseRequest',
    'ParseResponse',
    'BatchParseRequest',
    'BatchOptions',
    'BatchParseResponse',
    'SearchStep',
    'SearchPlan',
    'SchemaValidationResult',
    'ParsePreset',
    'ParseratorConfig'
]