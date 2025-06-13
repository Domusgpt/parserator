"""
Parserator Presets Package.

This package contains pre-defined parsing configurations for common use cases.
"""

from typing import Dict, Any, List, Optional
from ..types import ParsePreset, ParseOptions


# Email contact extraction preset
EMAIL_PARSER = ParsePreset(
    name="email_contact",
    description="Extract contact information from emails",
    output_schema={
        "sender_name": "string",
        "sender_email": "email",
        "subject": "string",
        "phone": "phone",
        "company": "string",
        "title": "string"
    },
    instructions="Extract contact details from email headers and signatures"
)

# Invoice processing preset
INVOICE_PARSER = ParsePreset(
    name="invoice_processor",
    description="Extract structured data from invoices",
    output_schema={
        "invoice_number": "string",
        "invoice_date": "iso_date",
        "due_date": "iso_date",
        "vendor_name": "string",
        "vendor_address": "string",
        "total_amount": "number",
        "currency": "string",
        "line_items": "object",
        "tax_amount": "number"
    },
    instructions="Extract key billing information and line items from invoices"
)

# Contact information preset
CONTACT_PARSER = ParsePreset(
    name="contact_extractor",
    description="Extract contact information from text",
    output_schema={
        "name": "string",
        "email": "email",
        "phone": "phone",
        "address": "string",
        "company": "string",
        "title": "string"
    },
    instructions="Extract contact details from business cards, signatures, or profiles"
)

# CSV data preset
CSV_PARSER = ParsePreset(
    name="csv_normalizer",
    description="Normalize and clean CSV data",
    output_schema={
        "headers": "string_array",
        "data_rows": "object",
        "row_count": "number",
        "column_count": "number"
    },
    instructions="Parse and normalize CSV data with proper header detection"
)

# Log file analysis preset
LOG_PARSER = ParsePreset(
    name="log_analyzer",
    description="Extract key information from log files",
    output_schema={
        "timestamp": "iso_date",
        "log_level": "string",
        "message": "string",
        "source": "string",
        "error_code": "string",
        "user_id": "string"
    },
    instructions="Extract structured data from application logs"
)

# Document analysis preset
DOCUMENT_PARSER = ParsePreset(
    name="document_analyzer",
    description="Extract metadata and key content from documents",
    output_schema={
        "title": "string",
        "author": "string",
        "creation_date": "iso_date",
        "document_type": "string",
        "key_topics": "string_array",
        "summary": "string",
        "page_count": "number"
    },
    instructions="Extract document metadata and summarize key content"
)

# All available presets
ALL_PRESETS = [
    EMAIL_PARSER,
    INVOICE_PARSER,
    CONTACT_PARSER,
    CSV_PARSER,
    LOG_PARSER,
    DOCUMENT_PARSER
]


def get_preset_by_name(name: str) -> Optional[ParsePreset]:
    """
    Get a preset by name.
    
    Args:
        name: The name of the preset to retrieve
        
    Returns:
        The preset if found, None otherwise
    """
    for preset in ALL_PRESETS:
        if preset.name == name:
            return preset
    return None


def list_available_presets() -> List[str]:
    """
    List all available preset names.
    
    Returns:
        List of preset names
    """
    return [preset.name for preset in ALL_PRESETS]


# Export all presets and functions
__all__ = [
    'EMAIL_PARSER',
    'INVOICE_PARSER', 
    'CONTACT_PARSER',
    'CSV_PARSER',
    'LOG_PARSER',
    'DOCUMENT_PARSER',
    'ALL_PRESETS',
    'get_preset_by_name',
    'list_available_presets'
]