"""
Google ADK Integration Example for Parserator
Production Ready - Available Now
"""

from google.adk import agent
from typing import Dict, Any
import requests
import json

# Configure Parserator for ADK
PARSERATOR_API_KEY = "pk_live_your_api_key"
PARSERATOR_BASE_URL = "https://app-5108296280.us-central1.run.app"

class ParseForAgent:
    """Parserator integration for Google ADK agents."""
    
    @staticmethod
    def extract(text: str, schema: Dict[str, Any], context: str = "adk_extraction", api_key: str = None) -> Dict[str, Any]:
        """
        Extract structured data using Parserator's Architect-Extractor pattern.
        
        Args:
            text: Input text to parse
            schema: Expected output schema
            context: Context for parsing optimization
            api_key: Parserator API key (overrides default)
            
        Returns:
            Structured data matching the provided schema
        """
        key = api_key or PARSERATOR_API_KEY
        
        try:
            response = requests.post(
                f"{PARSERATOR_BASE_URL}/v1/parse",
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
                return result.get("parsedData", {})
            else:
                return {"error": f"API error: {response.status_code}", "details": response.text}
                
        except Exception as e:
            return {"error": f"Request failed: {str(e)}"}

@agent.tool
def extract_user_intent(user_message: str) -> Dict[str, Any]:
    """
    Extract structured intent from natural language user messages.
    
    Args:
        user_message: Natural language input from user
        
    Returns:
        Structured intent object with action, entities, and context
    """
    schema = {
        "action": "string",  # Primary action (schedule, create, delete, etc.)
        "entities": {
            "contact": "string",
            "datetime": "string", 
            "location": "string",
            "topic": "string"
        },
        "confidence": "float",
        "urgency": "string",
        "context": "string"
    }
    
    return ParseForAgent.extract(
        text=user_message,
        schema=schema,
        context="user_intent_extraction"
    )

@agent.tool  
def parse_email_content(email_body: str) -> Dict[str, Any]:
    """
    Parse email content for structured information.
    
    Args:
        email_body: Raw email content
        
    Returns:
        Structured email data with contacts, actions, dates
    """
    schema = {
        "sender": {
            "name": "string",
            "email": "string",
            "company": "string"
        },
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
        "summary": "string",
        "urgency": "string"
    }
    
    return ParseForAgent.extract(
        text=email_body,
        schema=schema,
        context="email_parsing"
    )

@agent.tool
def extract_document_data(document_text: str, document_type: str = "general") -> Dict[str, Any]:
    """
    Extract structured data from various document types.
    
    Args:
        document_text: Raw document content
        document_type: Type of document (invoice, contract, report, etc.)
        
    Returns:
        Document-specific structured data
    """
    # Dynamic schema based on document type
    schemas = {
        "invoice": {
            "invoice_number": "string",
            "date": "string",
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
    
    return ParseForAgent.extract(
        text=document_text,
        schema=schema,
        context=f"{document_type}_parsing"
    )

@agent.tool
def parse_customer_feedback(feedback_text: str) -> Dict[str, Any]:
    """
    Parse customer feedback for sentiment analysis and issue extraction.
    
    Args:
        feedback_text: Customer feedback or support ticket content
        
    Returns:
        Structured feedback analysis with sentiment, issues, and priority
    """
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
    
    return ParseForAgent.extract(
        text=feedback_text,
        schema=schema,
        context="customer_support_analysis"
    )

@agent.tool
def parse_meeting_notes(notes_text: str) -> Dict[str, Any]:
    """
    Parse meeting notes to extract action items, decisions, and participants.
    
    Args:
        notes_text: Raw meeting notes or transcript
        
    Returns:
        Structured meeting data with action items and decisions
    """
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
    
    return ParseForAgent.extract(
        text=notes_text,
        schema=schema,
        context="meeting_notes_parsing"
    )

# Example ADK Agent Configuration
@agent.configure
def setup_parserator_agent():
    """Configure agent with Parserator parsing capabilities."""
    return {
        "name": "Parserator Enhanced Agent",
        "description": "AI agent with advanced structured data parsing via Parserator",
        "tools": [
            extract_user_intent,
            parse_email_content, 
            extract_document_data,
            parse_customer_feedback,
            parse_meeting_notes
        ],
        "capabilities": [
            "Natural language understanding",
            "Document parsing and analysis",
            "Email processing and extraction",
            "Customer feedback analysis",
            "Meeting notes structuring",
            "Structured data extraction (95% accuracy)"
        ]
    }

# Example usage in agent workflow
async def process_user_request(request: str) -> Dict[str, Any]:
    """Example agent workflow using Parserator tools."""
    
    # Extract intent from user request
    intent = extract_user_intent(request)
    
    if intent.get("action") == "parse_email":
        # User wants to parse an email
        email_content = get_email_content()  # Your email retrieval logic
        parsed_email = parse_email_content(email_content)
        
        return {
            "action": "email_parsed",
            "data": parsed_email,
            "next_steps": suggest_actions_from_email(parsed_email)
        }
    
    elif intent.get("action") == "analyze_document":
        # User wants to analyze a document
        doc_content = get_document_content()  # Your document retrieval logic
        doc_type = detect_document_type(doc_content)  # Your type detection
        parsed_doc = extract_document_data(doc_content, doc_type)
        
        return {
            "action": "document_analyzed", 
            "data": parsed_doc,
            "insights": generate_insights(parsed_doc)
        }
    
    elif intent.get("action") == "process_feedback":
        # User wants to process customer feedback
        feedback = get_customer_feedback()  # Your feedback retrieval logic
        analyzed_feedback = parse_customer_feedback(feedback)
        
        return {
            "action": "feedback_processed",
            "data": analyzed_feedback,
            "recommendations": generate_support_recommendations(analyzed_feedback)
        }
    
    else:
        return {
            "action": "intent_understood",
            "intent": intent,
            "response": "I understand your request. How can I help you parse this data?",
            "available_tools": [
                "Email parsing",
                "Document analysis", 
                "Customer feedback processing",
                "Meeting notes structuring"
            ]
        }

# Helper functions (implement these based on your system)
def get_email_content():
    """Retrieve email content from your email system."""
    pass

def get_document_content():
    """Retrieve document content from your document system."""
    pass

def detect_document_type(content):
    """Detect document type based on content."""
    pass

def suggest_actions_from_email(parsed_email):
    """Suggest actions based on parsed email data."""
    pass

def generate_insights(parsed_doc):
    """Generate insights from parsed document data."""
    pass

def get_customer_feedback():
    """Retrieve customer feedback from your support system."""
    pass

def generate_support_recommendations(feedback_analysis):
    """Generate support recommendations based on feedback analysis."""
    pass

if __name__ == "__main__":
    # Example usage
    print("=== Parserator ADK Integration Examples ===")
    
    # Test user intent extraction
    user_input = "Schedule a call with John tomorrow at 3pm to discuss the quarterly budget"
    intent = extract_user_intent(user_input)
    print(f"Intent: {intent}")
    
    # Test email parsing
    email = """
    From: sarah@company.com
    Subject: Project Update
    
    Hi team, the Q4 project deadline is December 15th. 
    Please submit your reports by December 10th.
    
    Best,
    Sarah
    """
    email_data = parse_email_content(email)
    print(f"Email Data: {email_data}")