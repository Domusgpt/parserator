"""
Parserator Google ADK Integration Example
Demonstrates how to use Parserator with Google's Agent Development Kit
"""

import requests
from typing import Dict, Any
from dataclasses import dataclass
from google import generativeai as genai

@dataclass
class UserIntent:
    action: str
    entity: str
    parameters: Dict[str, Any]

class ParseratorADKTool:
    """ADK tool wrapper for Parserator API"""
    
    def __init__(self, api_key: str = None):
        self.base_url = "https://app-5108296280.us-central1.run.app/v1"
        self.api_key = api_key
    
    def parse_user_intent(self, user_message: str) -> UserIntent:
        """Parse user message into structured intent"""
        schema = {
            "action": "string",
            "entity": "string", 
            "parameters": "object"
        }
        
        response = requests.post(
            f"{self.base_url}/parse",
            json={
                "text": user_message,
                "schema": schema,
                "context": "user_intent_parsing"
            },
            headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        )
        
        result = response.json()
        return UserIntent(**result["data"])

# ADK Agent Integration
@genai.configure
def setup_agent():
    # Initialize Parserator tool
    parserator = ParseratorADKTool()
    
    @genai.tool
    def extract_user_intent(user_message: str) -> UserIntent:
        """Extract structured intent from user messages"""
        return parserator.parse_user_intent(user_message)
    
    return extract_user_intent

# Usage Example
if __name__ == "__main__":
    tool = setup_agent()
    
    # Test with sample user input
    user_input = "Schedule a meeting with Sarah tomorrow at 3pm about Q4 budget"
    intent = tool(user_input)
    
    print(f"Action: {intent.action}")
    print(f"Entity: {intent.entity}")
    print(f"Parameters: {intent.parameters}")
    
    # Expected Output:
    # Action: schedule_meeting
    # Entity: Sarah
    # Parameters: {'time': '3pm', 'date': 'tomorrow', 'topic': 'Q4 budget'}