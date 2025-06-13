"""
Google ADK Integration for Parserator
Production-ready integration using correct Google ADK v1.3.0 API
"""

from typing import Any, Dict, List, Optional, Type
from pydantic import BaseModel, Field
import logging

try:
    from google.adk import Agent, tools
    from google.adk.tools import Tool
    ADK_AVAILABLE = True
except ImportError:
    ADK_AVAILABLE = False
    Tool = object
    Agent = object
    tools = None

from ..services import ParseatorClient
from ..types import ParseResult

logger = logging.getLogger(__name__)


class ParseatorTool(Tool):
    """
    Google ADK tool for parsing unstructured data using Parserator.
    
    This tool enables Google ADK agents to convert any unstructured text into
    structured JSON data using Parserator's two-stage parsing engine.
    
    Example:
        ```python
        from parserator.integrations.google_adk import ParseatorTool
        from google.adk import Agent
        
        # Create Parserator tool
        parser_tool = ParseatorTool(
            api_key="your_api_key",
            name="data_parser",
            description="Parse unstructured data into JSON"
        )
        
        # Create agent with parsing capability
        agent = Agent(
            name="DataAnalyst",
            description="Expert at extracting structured data",
            tools=[parser_tool]
        )
        
        # Use in agent workflow
        result = agent.run("Parse this email: John Smith <john@tech.com> Senior Engineer")
        ```
    """
    
    def __init__(
        self,
        api_key: str,
        name: str = "parserator",
        description: str = "Parse unstructured text into structured JSON data",
        base_url: Optional[str] = None,
        **kwargs
    ):
        if not ADK_AVAILABLE:
            raise ImportError(
                "Google ADK is not installed. Install with: pip install google-adk>=1.3.0"
            )
            
        super().__init__(
            name=name,
            description=description,
            **kwargs
        )
        
        self.client = ParseatorClient(
            api_key=api_key,
            base_url=base_url
        )
    
    def execute(
        self,
        input_data: str,
        output_schema: Dict[str, Any],
        instructions: Optional[str] = None,
        context: Optional[str] = "adk_extraction"
    ) -> Dict[str, Any]:
        """
        Execute the parsing operation.
        
        Args:
            input_data: Raw unstructured text to parse
            output_schema: Desired JSON structure
            instructions: Optional additional parsing instructions
            context: Context for parsing optimization
            
        Returns:
            Structured data according to output_schema
        """
        try:
            result = self.client.parse(
                input_data=input_data,
                output_schema=output_schema,
                instructions=instructions,
                context=context
            )
            
            if not result.success:
                return {
                    "error": True,
                    "message": result.error_message,
                    "parsed_data": None,
                    "confidence": 0.0
                }
            
            return {
                "error": False,
                "parsed_data": result.parsed_data,
                "confidence": result.metadata.get("confidence", 0.0),
                "processing_time": result.metadata.get("processingTimeMs", 0),
                "tokens_used": result.metadata.get("tokensUsed", 0)
            }
            
        except Exception as e:
            logger.error(f"Parserator ADK tool failed: {str(e)}")
            return {
                "error": True,
                "message": f"Parsing failed: {str(e)}",
                "parsed_data": None,
                "confidence": 0.0
            }


class EmailParserTool(ParseatorTool):
    """Specialized Google ADK tool for parsing email content."""
    
    def __init__(self, api_key: str, **kwargs):
        super().__init__(
            api_key=api_key,
            name="email_parser",
            description="Extract structured information from email content",
            **kwargs
        )
    
    def execute(self, email_content: str, custom_fields: Optional[List[str]] = None) -> Dict[str, Any]:
        """Parse email content with predefined schema."""
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
        if custom_fields:
            for field in custom_fields:
                schema[field] = "string"
        
        return super().execute(
            input_data=email_content,
            output_schema=schema,
            instructions="Extract key information from email content, including sender, recipient, subject, and any action items or important dates mentioned.",
            context="email_parsing"
        )


class DocumentParserTool(ParseatorTool):
    """Specialized Google ADK tool for parsing document content."""
    
    def __init__(self, api_key: str, **kwargs):
        super().__init__(
            api_key=api_key,
            name="document_parser",
            description="Extract structured information from documents",
            **kwargs
        )
    
    def execute(self, document_content: str, document_type: str = "general") -> Dict[str, Any]:
        """Parse document content with type-specific schema."""
        base_schema = {
            "title": "string",
            "document_type": "string",
            "summary": "string",
            "key_topics": "array",
            "main_points": "array"
        }
        
        # Add type-specific fields
        if document_type.lower() == "contract":
            base_schema.update({
                "parties": "array",
                "terms": "array", 
                "dates": "array",
                "obligations": "array"
            })
        elif document_type.lower() == "invoice":
            base_schema.update({
                "invoice_number": "string",
                "amount": "number",
                "due_date": "string",
                "items": "array"
            })
        elif document_type.lower() == "report":
            base_schema.update({
                "findings": "array",
                "recommendations": "array",
                "data_points": "array"
            })
        
        return super().execute(
            input_data=document_content,
            output_schema=base_schema,
            instructions=f"Analyze this {document_type} document and extract all relevant structured information.",
            context=f"{document_type}_parsing"
        )


class ContactParserTool(ParseatorTool):
    """Specialized Google ADK tool for parsing contact information."""
    
    def __init__(self, api_key: str, **kwargs):
        super().__init__(
            api_key=api_key,
            name="contact_parser",
            description="Extract contact information from unstructured text",
            **kwargs
        )
    
    def execute(self, text_content: str) -> Dict[str, Any]:
        """Parse text to extract contact information."""
        schema = {
            "name": "string",
            "email": "string",
            "phone": "string", 
            "company": "string",
            "title": "string",
            "address": "string",
            "social_media": "array",
            "notes": "string"
        }
        
        return super().execute(
            input_data=text_content,
            output_schema=schema,
            instructions="Extract all contact information including names, emails, phone numbers, addresses, and company details.",
            context="contact_parsing"
        )


class DataExtractionTool(ParseatorTool):
    """Flexible Google ADK tool for custom data extraction."""
    
    def __init__(self, api_key: str, **kwargs):
        super().__init__(
            api_key=api_key,
            name="data_extractor",
            description="Extract custom data fields from unstructured text",
            **kwargs
        )
    
    def execute(
        self,
        text_content: str,
        extraction_fields: List[str],
        field_descriptions: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Extract custom fields from text."""
        schema = {}
        instructions_parts = ["Extract the following information:"]
        
        for field in extraction_fields:
            schema[field] = "string"
            if field_descriptions and field in field_descriptions:
                instructions_parts.append(f"- {field}: {field_descriptions[field]}")
            else:
                instructions_parts.append(f"- {field}")
        
        instructions = "\n".join(instructions_parts)
        
        return super().execute(
            input_data=text_content,
            output_schema=schema,
            instructions=instructions,
            context="custom_extraction"
        )


# Helper functions for Google ADK integration
def create_parsing_agent(
    api_key: str, 
    agent_name: str = "DataParser",
    agent_description: str = "Expert at parsing and structuring unstructured data",
    tools_config: Optional[List[str]] = None
) -> Agent:
    """
    Create a Google ADK agent with Parserator tools.
    
    Args:
        api_key: Parserator API key
        agent_name: Name for the ADK agent
        agent_description: Description of the agent's purpose
        tools_config: List of tool types to include ('email', 'document', 'contact', 'general', 'extractor')
        
    Returns:
        Configured Google ADK Agent
    """
    if not ADK_AVAILABLE:
        raise ImportError(
            "Google ADK is not installed. Install with: pip install google-adk>=1.3.0"
        )
    
    if tools_config is None:
        tools_config = ['general']
    
    agent_tools = []
    
    for tool_type in tools_config:
        if tool_type == 'email':
            agent_tools.append(EmailParserTool(api_key=api_key))
        elif tool_type == 'document':
            agent_tools.append(DocumentParserTool(api_key=api_key))
        elif tool_type == 'contact':
            agent_tools.append(ContactParserTool(api_key=api_key))
        elif tool_type == 'general':
            agent_tools.append(ParseatorTool(api_key=api_key))
        elif tool_type == 'extractor':
            agent_tools.append(DataExtractionTool(api_key=api_key))
    
    return Agent(
        name=agent_name,
        description=agent_description,
        tools=agent_tools
    )


def create_parsing_workflow(
    api_key: str,
    workflow_description: str,
    parsing_tasks: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Create a Google ADK workflow configuration for data parsing tasks.
    
    Args:
        api_key: Parserator API key
        workflow_description: Description of the overall workflow
        parsing_tasks: List of parsing task configurations
        
    Returns:
        List of configured workflow steps
    """
    workflow_steps = []
    
    for i, task in enumerate(parsing_tasks):
        tool_type = task.get('tool_type', 'general')
        step_name = task.get('name', f'parsing_step_{i+1}')
        
        # Create appropriate tool for this step
        if tool_type == 'email':
            tool = EmailParserTool(api_key=api_key)
        elif tool_type == 'document':
            tool = DocumentParserTool(api_key=api_key)
        elif tool_type == 'contact':
            tool = ContactParserTool(api_key=api_key)
        elif tool_type == 'extractor':
            tool = DataExtractionTool(api_key=api_key)
        else:
            tool = ParseatorTool(api_key=api_key)
        
        workflow_steps.append({
            "step_name": step_name,
            "tool": tool,
            "description": task.get('description', f'Parse data using {tool_type} parser'),
            "expected_input": task.get('input_description', 'Unstructured text data'),
            "expected_output": task.get('output_description', 'Structured JSON data')
        })
    
    return workflow_steps


# Example usage and integration patterns
def quick_parse(api_key: str, text: str, schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Quick parsing function for simple ADK integrations.
    
    Args:
        api_key: Parserator API key
        text: Text to parse
        schema: Desired output schema
        
    Returns:
        Parsed data
    """
    tool = ParseatorTool(api_key=api_key)
    return tool.execute(
        input_data=text,
        output_schema=schema
    )


def batch_parse_with_adk(
    api_key: str,
    text_items: List[str],
    schema: Dict[str, Any],
    tool_type: str = "general"
) -> List[Dict[str, Any]]:
    """
    Batch parsing using Google ADK tools.
    
    Args:
        api_key: Parserator API key
        text_items: List of texts to parse
        schema: Desired output schema for all items
        tool_type: Type of parsing tool to use
        
    Returns:
        List of parsed results
    """
    # Create appropriate tool
    if tool_type == 'email':
        tool = EmailParserTool(api_key=api_key)
    elif tool_type == 'document':
        tool = DocumentParserTool(api_key=api_key)
    elif tool_type == 'contact':
        tool = ContactParserTool(api_key=api_key)
    else:
        tool = ParseatorTool(api_key=api_key)
    
    results = []
    for text in text_items:
        if tool_type in ['email', 'document', 'contact']:
            # Use specialized execute methods
            result = tool.execute(text)
        else:
            # Use general execute method
            result = tool.execute(
                input_data=text,
                output_schema=schema
            )
        results.append(result)
    
    return results