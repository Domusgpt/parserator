"""
AutoGPT Block for Parserator
Production-ready AutoGPT block for parsing unstructured data using current block architecture
"""

import uuid
from typing import Any, Dict, Optional, List
import logging

try:
    from autogpt_platform.backend.backend.blocks.basic import Block, BlockOutput, BlockSchema
    from autogpt_platform.backend.backend.util.request import requests
    AUTOGPT_AVAILABLE = True
except ImportError:
    try:
        # Alternative import structure
        from backend.blocks.basic import Block, BlockOutput, BlockSchema
        from backend.util.request import requests
        AUTOGPT_AVAILABLE = True
    except ImportError:
        AUTOGPT_AVAILABLE = False
        Block = object
        BlockSchema = object
        BlockOutput = object
        requests = None

from ..services import ParseatorClient
from ..types import ParseResult

logger = logging.getLogger(__name__)


class ParseTextBlock(Block):
    """
    AutoGPT block for parsing unstructured text using Parserator's AI engine.
    
    This block enables AutoGPT workflows to convert any unstructured text into
    structured JSON data using Parserator's two-stage Architect-Extractor pattern.
    
    Usage in AutoGPT workflows:
    - Input: Raw text and desired output schema
    - Processing: AI-powered parsing with 95% accuracy
    - Output: Structured JSON data with confidence scores
    """
    
    class Input(BlockSchema):
        api_key: str = "Parserator API key"
        input_data: str = "Raw unstructured text to parse"
        output_schema: Dict[str, Any] = "Desired JSON structure (e.g., {'name': 'string', 'email': 'string'})"
        instructions: Optional[str] = "Additional parsing instructions (optional)"
        base_url: Optional[str] = "Custom API base URL (optional)"
    
    class Output(BlockSchema):
        parsed_data: Dict[str, Any] = "Structured data matching the provided schema"
        confidence: float = "Parsing confidence score (0.0 to 1.0)"
        processing_time: int = "Processing time in milliseconds"
        tokens_used: int = "Number of tokens consumed"
        success: bool = "Whether parsing was successful"
        error: str = "Error message if parsing failed"
    
    def __init__(self):
        super().__init__(
            id=str(uuid.uuid4()),
            input_schema=ParseTextBlock.Input,
            output_schema=ParseTextBlock.Output,
            test_input={
                "api_key": "pk_test_your_api_key",
                "input_data": "John Smith, Senior Engineer, john@tech.com, +1-555-0123",
                "output_schema": {
                    "name": "string",
                    "title": "string", 
                    "email": "string",
                    "phone": "string"
                },
                "instructions": "Extract contact information from the text"
            },
            test_output=[
                ("parsed_data", dict),
                ("confidence", float),
                ("success", bool)
            ],
            test_mock={
                "parsed_data": {
                    "name": "John Smith",
                    "title": "Senior Engineer",
                    "email": "john@tech.com",
                    "phone": "+1-555-0123"
                },
                "confidence": 0.95,
                "processing_time": 2200,
                "tokens_used": 450,
                "success": True,
                "error": ""
            }
        )
    
    def run(self, input_data: Input, **kwargs) -> BlockOutput:
        """Execute the parsing operation using Parserator API."""
        try:
            # Validate inputs
            if not input_data.api_key:
                yield "error", "API key is required"
                yield "success", False
                return
                
            if not input_data.input_data:
                yield "error", "Input data is required"
                yield "success", False
                return
                
            if not input_data.output_schema:
                yield "error", "Output schema is required"
                yield "success", False
                return
            
            # Create Parserator client
            client = ParseatorClient(
                api_key=input_data.api_key,
                base_url=input_data.base_url
            )
            
            # Execute parsing
            result = client.parse(
                input_data=input_data.input_data,
                output_schema=input_data.output_schema,
                instructions=input_data.instructions
            )
            
            if result.success:
                yield "parsed_data", result.parsed_data
                yield "confidence", result.metadata.get("confidence", 0.0)
                yield "processing_time", result.metadata.get("processingTimeMs", 0)
                yield "tokens_used", result.metadata.get("tokensUsed", 0)
                yield "success", True
                yield "error", ""
            else:
                yield "parsed_data", {}
                yield "confidence", 0.0
                yield "processing_time", 0
                yield "tokens_used", 0
                yield "success", False
                yield "error", result.error_message or "Parsing failed"
                
        except Exception as e:
            logger.error(f"ParseTextBlock failed: {str(e)}")
            yield "parsed_data", {}
            yield "confidence", 0.0
            yield "processing_time", 0
            yield "tokens_used", 0
            yield "success", False
            yield "error", f"Block execution failed: {str(e)}"


class ParseEmailBlock(Block):
    """
    Specialized AutoGPT block for parsing email content with predefined schema.
    """
    
    class Input(BlockSchema):
        api_key: str = "Parserator API key"
        email_content: str = "Raw email content to parse"
        custom_fields: Optional[List[str]] = "Additional custom fields to extract (optional)"
        base_url: Optional[str] = "Custom API base URL (optional)"
    
    class Output(BlockSchema):
        from_address: str = "Sender email address"
        to_address: str = "Recipient email address"
        subject: str = "Email subject line"
        date: str = "Email date"
        summary: str = "Email summary"
        action_items: List[str] = "Identified action items"
        mentioned_people: List[str] = "People mentioned in email"
        important_dates: List[str] = "Important dates mentioned"
        priority: str = "Email priority level"
        custom_data: Dict[str, Any] = "Custom extracted fields"
        confidence: float = "Parsing confidence score"
        success: bool = "Whether parsing was successful"
        error: str = "Error message if parsing failed"
    
    def __init__(self):
        super().__init__(
            id=str(uuid.uuid4()),
            input_schema=ParseEmailBlock.Input,
            output_schema=ParseEmailBlock.Output,
            test_input={
                "api_key": "pk_test_your_api_key",
                "email_content": "From: john@tech.com\nTo: team@company.com\nSubject: Project Update\n\nHi team, we need to finish the report by Friday. Please review the attached docs.",
                "custom_fields": ["project_name", "deadline_status"]
            },
            test_output=[
                ("from_address", str),
                ("subject", str),
                ("action_items", list),
                ("success", bool)
            ],
            test_mock={
                "from_address": "john@tech.com",
                "to_address": "team@company.com",
                "subject": "Project Update",
                "action_items": ["finish the report by Friday", "review the attached docs"],
                "priority": "medium",
                "success": True
            }
        )
    
    def run(self, input_data: Input, **kwargs) -> BlockOutput:
        """Execute email parsing with predefined schema."""
        try:
            # Build email parsing schema
            schema = {
                "from": "string",
                "to": "string", 
                "subject": "string",
                "date": "string",
                "summary": "string",
                "action_items": "array",
                "mentioned_people": "array",
                "important_dates": "array",
                "priority": "string"
            }
            
            # Add custom fields if specified
            if input_data.custom_fields:
                for field in input_data.custom_fields:
                    schema[field] = "string"
            
            # Create Parserator client
            client = ParseatorClient(
                api_key=input_data.api_key,
                base_url=input_data.base_url
            )
            
            # Execute parsing
            result = client.parse(
                input_data=input_data.email_content,
                output_schema=schema,
                instructions="Extract key information from email content, including sender, recipient, subject, and any action items or important dates mentioned."
            )
            
            if result.success:
                data = result.parsed_data
                yield "from_address", data.get("from", "")
                yield "to_address", data.get("to", "")
                yield "subject", data.get("subject", "")
                yield "date", data.get("date", "")
                yield "summary", data.get("summary", "")
                yield "action_items", data.get("action_items", [])
                yield "mentioned_people", data.get("mentioned_people", [])
                yield "important_dates", data.get("important_dates", [])
                yield "priority", data.get("priority", "")
                
                # Extract custom fields
                custom_data = {}
                if input_data.custom_fields:
                    for field in input_data.custom_fields:
                        custom_data[field] = data.get(field, "")
                yield "custom_data", custom_data
                
                yield "confidence", result.metadata.get("confidence", 0.0)
                yield "success", True
                yield "error", ""
            else:
                # Return empty results on failure
                for field in ["from_address", "to_address", "subject", "date", "summary", "priority"]:
                    yield field, ""
                for field in ["action_items", "mentioned_people", "important_dates"]:
                    yield field, []
                yield "custom_data", {}
                yield "confidence", 0.0
                yield "success", False
                yield "error", result.error_message or "Email parsing failed"
                
        except Exception as e:
            logger.error(f"ParseEmailBlock failed: {str(e)}")
            # Return empty results on exception
            for field in ["from_address", "to_address", "subject", "date", "summary", "priority"]:
                yield field, ""
            for field in ["action_items", "mentioned_people", "important_dates"]:
                yield field, []
            yield "custom_data", {}
            yield "confidence", 0.0
            yield "success", False
            yield "error", f"Block execution failed: {str(e)}"


class ParseDocumentBlock(Block):
    """
    Specialized AutoGPT block for parsing document content with type-specific schemas.
    """
    
    class Input(BlockSchema):
        api_key: str = "Parserator API key"
        document_content: str = "Raw document content to parse"
        document_type: str = "Document type (general, contract, invoice, report)"
        base_url: Optional[str] = "Custom API base URL (optional)"
    
    class Output(BlockSchema):
        title: str = "Document title"
        document_type: str = "Identified document type"
        summary: str = "Document summary"
        key_topics: List[str] = "Key topics identified"
        main_points: List[str] = "Main points extracted"
        type_specific_data: Dict[str, Any] = "Type-specific extracted data"
        confidence: float = "Parsing confidence score"
        success: bool = "Whether parsing was successful"
        error: str = "Error message if parsing failed"
    
    def __init__(self):
        super().__init__(
            id=str(uuid.uuid4()),
            input_schema=ParseDocumentBlock.Input,
            output_schema=ParseDocumentBlock.Output,
            test_input={
                "api_key": "pk_test_your_api_key",
                "document_content": "INVOICE #12345\nBill To: Acme Corp\nAmount: $2,500.00\nDue Date: 2024-01-15\nItems: Consulting services, Software license",
                "document_type": "invoice"
            },
            test_output=[
                ("title", str),
                ("summary", str),
                ("type_specific_data", dict),
                ("success", bool)
            ],
            test_mock={
                "title": "Invoice #12345",
                "document_type": "invoice",
                "summary": "Invoice for consulting services and software license",
                "type_specific_data": {
                    "invoice_number": "12345",
                    "amount": 2500.00,
                    "due_date": "2024-01-15"
                },
                "success": True
            }
        )
    
    def run(self, input_data: Input, **kwargs) -> BlockOutput:
        """Execute document parsing with type-specific schema."""
        try:
            # Build base schema
            schema = {
                "title": "string",
                "document_type": "string",
                "summary": "string",
                "key_topics": "array",
                "main_points": "array"
            }
            
            # Add type-specific fields
            doc_type = input_data.document_type.lower()
            if doc_type == "contract":
                schema.update({
                    "parties": "array",
                    "terms": "array",
                    "dates": "array", 
                    "obligations": "array"
                })
            elif doc_type == "invoice":
                schema.update({
                    "invoice_number": "string",
                    "amount": "number",
                    "due_date": "string",
                    "items": "array"
                })
            elif doc_type == "report":
                schema.update({
                    "findings": "array",
                    "recommendations": "array",
                    "data_points": "array"
                })
            
            # Create Parserator client
            client = ParseatorClient(
                api_key=input_data.api_key,
                base_url=input_data.base_url
            )
            
            # Execute parsing
            result = client.parse(
                input_data=input_data.document_content,
                output_schema=schema,
                instructions=f"Analyze this {doc_type} document and extract all relevant structured information."
            )
            
            if result.success:
                data = result.parsed_data
                yield "title", data.get("title", "")
                yield "document_type", data.get("document_type", doc_type)
                yield "summary", data.get("summary", "")
                yield "key_topics", data.get("key_topics", [])
                yield "main_points", data.get("main_points", [])
                
                # Extract type-specific data
                type_specific = {}
                base_fields = {"title", "document_type", "summary", "key_topics", "main_points"}
                for key, value in data.items():
                    if key not in base_fields:
                        type_specific[key] = value
                
                yield "type_specific_data", type_specific
                yield "confidence", result.metadata.get("confidence", 0.0)
                yield "success", True
                yield "error", ""
            else:
                yield "title", ""
                yield "document_type", doc_type
                yield "summary", ""
                yield "key_topics", []
                yield "main_points", []
                yield "type_specific_data", {}
                yield "confidence", 0.0
                yield "success", False
                yield "error", result.error_message or "Document parsing failed"
                
        except Exception as e:
            logger.error(f"ParseDocumentBlock failed: {str(e)}")
            yield "title", ""
            yield "document_type", input_data.document_type
            yield "summary", ""
            yield "key_topics", []
            yield "main_points", []
            yield "type_specific_data", {}
            yield "confidence", 0.0
            yield "success", False
            yield "error", f"Block execution failed: {str(e)}"


# Installation functions for AutoGPT
def register_parserator_blocks():
    """
    Register all Parserator blocks with AutoGPT.
    
    Add this to your AutoGPT block registry:
    ```python
    from parserator.integrations.autogpt_block import register_parserator_blocks
    register_parserator_blocks()
    ```
    """
    if not AUTOGPT_AVAILABLE:
        raise ImportError(
            "AutoGPT blocks are not available. Install AutoGPT platform to use these blocks."
        )
    
    return [
        ParseTextBlock,
        ParseEmailBlock,
        ParseDocumentBlock
    ]


def get_parserator_blocks():
    """
    Get list of all Parserator blocks for AutoGPT.
    
    Returns:
        List of block classes ready for AutoGPT registration
    """
    return register_parserator_blocks()


# Example usage documentation
INSTALLATION_GUIDE = """
# Parserator AutoGPT Blocks Installation Guide

## Installation Steps:

1. **Install Parserator SDK**:
   ```bash
   pip install parserator-sdk[integrations]
   ```

2. **Copy Block Files**:
   Copy this file to your AutoGPT blocks directory:
   ```
   autogpt_platform/backend/backend/blocks/parserator/
   ```

3. **Register Blocks**:
   Add to your AutoGPT block registry:
   ```python
   from backend.blocks.parserator.autogpt_block import register_parserator_blocks
   
   # Register all Parserator blocks
   blocks = register_parserator_blocks()
   ```

4. **Configure API Key**:
   Set your Parserator API key in AutoGPT environment or pass it directly to blocks.

## Available Blocks:

- **ParseTextBlock**: General purpose text parsing with custom schemas
- **ParseEmailBlock**: Specialized email parsing with predefined fields
- **ParseDocumentBlock**: Document parsing with type-specific schemas (invoice, contract, report)

## Usage in Workflows:

Blocks can be connected in AutoGPT workflows to:
- Parse unstructured data from various sources
- Extract structured information for decision making
- Transform text data for downstream processing
- Enable AI agents to understand complex documents

## API Requirements:

- Parserator API key (get from https://parserator.com)
- Internet connection for API calls
- Valid input data and output schemas
"""