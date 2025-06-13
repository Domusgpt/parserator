"""
AutoGPT Integration Example for Parserator
Production Ready - Available Now
"""

from typing import Dict, Any, List
import requests
import json

class ParseatorAutoGPTPlugin:
    """AutoGPT plugin for Parserator structured data extraction."""
    
    def __init__(self, api_key: str, base_url: str = "https://app-5108296280.us-central1.run.app"):
        self.api_key = api_key
        self.base_url = base_url
        self.name = "Parserator"
        self.version = "1.0.1"
        self.description = "Extract structured data with 95% accuracy using Parserator's Architect-Extractor pattern"
    
    def parse_data(self, text: str, schema: Dict[str, Any], context: str = "autogpt_extraction") -> Dict[str, Any]:
        """
        Parse unstructured text into structured data.
        
        Args:
            text: Input text to parse
            schema: Expected output schema
            context: Context for parsing optimization
            
        Returns:
            Structured data matching the provided schema
        """
        try:
            response = requests.post(
                f"{self.base_url}/v1/parse",
                headers={
                    "Content-Type": "application/json"
                },
                json={
                    "inputData": text,
                    "outputSchema": schema,
                    "context": context
                },
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "data": result.get("parsedData", {}),
                    "confidence": result.get("metadata", {}).get("confidence", 0.0),
                    "tokens_used": result.get("metadata", {}).get("tokensUsed", 0)
                }
            else:
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Request failed: {str(e)}"
            }
    
    def extract_email_data(self, email_content: str) -> Dict[str, Any]:
        """Extract structured data from email content."""
        schema = {
            "sender": {
                "name": "string",
                "email": "string",
                "company": "string"
            },
            "subject": "string",
            "action_items": [
                {
                    "task": "string",
                    "due_date": "string",
                    "priority": "string"
                }
            ],
            "mentioned_contacts": ["string"],
            "key_dates": ["string"],
            "sentiment": "string",
            "summary": "string"
        }
        
        return self.parse_data(email_content, schema, "email_parsing")
    
    def extract_document_data(self, document_content: str, document_type: str = "general") -> Dict[str, Any]:
        """Extract structured data from various document types."""
        schemas = {
            "invoice": {
                "invoice_number": "string",
                "date": "string",
                "due_date": "string",
                "amount": "float",
                "vendor": "string",
                "line_items": [
                    {
                        "description": "string",
                        "quantity": "integer",
                        "unit_price": "float",
                        "total": "float"
                    }
                ]
            },
            "contract": {
                "parties": ["string"],
                "effective_date": "string",
                "expiry_date": "string",
                "key_terms": ["string"],
                "obligations": [
                    {
                        "party": "string",
                        "obligation": "string",
                        "deadline": "string"
                    }
                ]
            },
            "report": {
                "title": "string",
                "date": "string",
                "author": "string",
                "key_findings": ["string"],
                "recommendations": ["string"],
                "metrics": [
                    {
                        "name": "string",
                        "value": "string",
                        "change": "string"
                    }
                ]
            },
            "general": {
                "document_type": "string",
                "summary": "string",
                "key_points": ["string"],
                "entities": ["string"],
                "dates": ["string"],
                "numbers": ["string"]
            }
        }
        
        schema = schemas.get(document_type, schemas["general"])
        return self.parse_data(document_content, schema, f"{document_type}_parsing")
    
    def extract_customer_feedback(self, feedback_content: str) -> Dict[str, Any]:
        """Extract insights from customer feedback."""
        schema = {
            "customer_info": {
                "name": "string",
                "email": "string",
                "tier": "string"
            },
            "sentiment": "string",
            "issues": [
                {
                    "type": "string",
                    "description": "string",
                    "severity": "string"
                }
            ],
            "priority": "string",
            "suggested_actions": ["string"],
            "escalation_required": "boolean",
            "summary": "string"
        }
        
        return self.parse_data(feedback_content, schema, "customer_feedback_analysis")
    
    def extract_meeting_notes(self, notes_content: str) -> Dict[str, Any]:
        """Extract structured data from meeting notes."""
        schema = {
            "meeting_info": {
                "title": "string",
                "date": "string",
                "duration": "string"
            },
            "participants": ["string"],
            "key_decisions": ["string"],
            "action_items": [
                {
                    "task": "string",
                    "assignee": "string",
                    "due_date": "string",
                    "priority": "string"
                }
            ],
            "next_meeting": {
                "date": "string",
                "agenda": ["string"]
            },
            "summary": "string"
        }
        
        return self.parse_data(notes_content, schema, "meeting_notes_parsing")
    
    def extract_web_content(self, web_content: str, content_type: str = "article") -> Dict[str, Any]:
        """Extract structured data from web content."""
        schemas = {
            "article": {
                "title": "string",
                "author": "string",
                "publish_date": "string",
                "summary": "string",
                "key_points": ["string"],
                "categories": ["string"],
                "sentiment": "string"
            },
            "product": {
                "name": "string",
                "price": "string",
                "description": "string",
                "features": ["string"],
                "specifications": {
                    "key": "value"
                },
                "availability": "string"
            },
            "profile": {
                "name": "string",
                "title": "string",
                "company": "string",
                "contact_info": {
                    "email": "string",
                    "phone": "string",
                    "social": ["string"]
                },
                "bio": "string",
                "experience": ["string"]
            }
        }
        
        schema = schemas.get(content_type, schemas["article"])
        return self.parse_data(web_content, schema, f"web_{content_type}_parsing")

class ParseatorAutoGPTCommands:
    """AutoGPT commands for Parserator integration."""
    
    def __init__(self, plugin: ParseatorAutoGPTPlugin):
        self.plugin = plugin
    
    def parse_text_command(self, text: str, schema_type: str = "general") -> str:
        """
        Command: parse_text
        Parse unstructured text into structured data.
        
        Args:
            text: Text to parse
            schema_type: Type of schema to use (email, document, feedback, meeting, web)
        """
        if schema_type == "email":
            result = self.plugin.extract_email_data(text)
        elif schema_type == "document":
            result = self.plugin.extract_document_data(text)
        elif schema_type == "feedback":
            result = self.plugin.extract_customer_feedback(text)
        elif schema_type == "meeting":
            result = self.plugin.extract_meeting_notes(text)
        elif schema_type == "web":
            result = self.plugin.extract_web_content(text)
        else:
            # General parsing
            schema = {
                "summary": "string",
                "key_points": ["string"],
                "entities": ["string"],
                "sentiment": "string"
            }
            result = self.plugin.parse_data(text, schema)
        
        if result.get("success"):
            return f"Successfully parsed data:\n{json.dumps(result['data'], indent=2)}"
        else:
            return f"Parsing failed: {result.get('error', 'Unknown error')}"
    
    def analyze_email_command(self, email_content: str) -> str:
        """
        Command: analyze_email
        Analyze email content and extract actionable information.
        """
        result = self.plugin.extract_email_data(email_content)
        
        if result.get("success"):
            data = result["data"]
            analysis = f"""
Email Analysis Results:
- Sender: {data.get('sender', {}).get('name', 'Unknown')} ({data.get('sender', {}).get('email', 'Unknown')})
- Subject: {data.get('subject', 'No subject')}
- Sentiment: {data.get('sentiment', 'Neutral')}
- Action Items: {len(data.get('action_items', []))} found
- Summary: {data.get('summary', 'No summary available')}

Full structured data:
{json.dumps(data, indent=2)}
            """
            return analysis.strip()
        else:
            return f"Email analysis failed: {result.get('error', 'Unknown error')}"
    
    def process_document_command(self, document_content: str, doc_type: str = "general") -> str:
        """
        Command: process_document
        Process document and extract structured information.
        """
        result = self.plugin.extract_document_data(document_content, doc_type)
        
        if result.get("success"):
            data = result["data"]
            
            if doc_type == "invoice":
                summary = f"""
Invoice Processing Results:
- Invoice Number: {data.get('invoice_number', 'Not found')}
- Date: {data.get('date', 'Not found')}
- Amount: {data.get('amount', 'Not found')}
- Vendor: {data.get('vendor', 'Not found')}
- Line Items: {len(data.get('line_items', []))} items
                """
            elif doc_type == "contract":
                summary = f"""
Contract Processing Results:
- Parties: {', '.join(data.get('parties', []))}
- Effective Date: {data.get('effective_date', 'Not found')}
- Expiry Date: {data.get('expiry_date', 'Not found')}
- Key Terms: {len(data.get('key_terms', []))} terms found
                """
            else:
                summary = f"""
Document Processing Results:
- Type: {data.get('document_type', doc_type)}
- Summary: {data.get('summary', 'No summary available')}
- Key Points: {len(data.get('key_points', []))} points found
                """
            
            return f"{summary.strip()}\n\nFull structured data:\n{json.dumps(data, indent=2)}"
        else:
            return f"Document processing failed: {result.get('error', 'Unknown error')}"

# AutoGPT Plugin Registration
def register_parserator_plugin(api_key: str):
    """Register the Parserator plugin with AutoGPT."""
    
    plugin = ParseatorAutoGPTPlugin(api_key)
    commands = ParseatorAutoGPTCommands(plugin)
    
    # Register commands with AutoGPT
    command_registry = {
        "parse_text": {
            "function": commands.parse_text_command,
            "description": "Parse unstructured text into structured data using Parserator",
            "parameters": {
                "text": "Text to parse",
                "schema_type": "Type of schema (email, document, feedback, meeting, web, general)"
            }
        },
        "analyze_email": {
            "function": commands.analyze_email_command,
            "description": "Analyze email content and extract actionable information",
            "parameters": {
                "email_content": "Email content to analyze"
            }
        },
        "process_document": {
            "function": commands.process_document_command,
            "description": "Process document and extract structured information",
            "parameters": {
                "document_content": "Document content to process",
                "doc_type": "Document type (invoice, contract, report, general)"
            }
        }
    }
    
    return command_registry

# Example Usage
if __name__ == "__main__":
    # Initialize plugin
    api_key = "pk_live_your_key"
    plugin = ParseatorAutoGPTPlugin(api_key)
    commands = ParseatorAutoGPTCommands(plugin)
    
    # Example 1: Parse email
    email_content = """
    From: sarah@company.com
    Subject: Project Deadline Update
    
    Hi team,
    
    The Q4 project deadline has been moved to December 20th. 
    Please update your timelines accordingly and let me know if you need additional resources.
    
    Best,
    Sarah
    """
    
    print("=== Email Analysis ===")
    print(commands.analyze_email_command(email_content))
    
    # Example 2: Process invoice
    invoice_content = """
    INVOICE #INV-2025-1234
    Date: June 12, 2025
    
    From: Tech Supplies Co.
    To: Your Company
    
    Items:
    - Laptops (5x) @ $1,200 = $6,000
    - Software (10x) @ $100 = $1,000
    
    Total: $7,000
    """
    
    print("\n=== Invoice Processing ===")
    print(commands.process_document_command(invoice_content, "invoice"))
    
    # Example 3: General text parsing
    general_text = """
    The quarterly sales meeting will be held on Friday at 2 PM in the main conference room. 
    We'll discuss Q3 results, Q4 projections, and the new product launch strategy. 
    All department heads are required to attend.
    """
    
    print("\n=== General Text Parsing ===")
    print(commands.parse_text_command(general_text, "meeting"))