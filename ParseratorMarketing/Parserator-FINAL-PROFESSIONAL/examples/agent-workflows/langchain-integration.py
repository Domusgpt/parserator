"""
LangChain Integration Example for Parserator
Production Ready - Available Now
"""

from langchain.tools import BaseTool
from langchain.agents import initialize_agent, AgentType
from langchain.llms import OpenAI
from pydantic import BaseModel, Field
import requests
import json
from typing import Dict, Any, Optional

class ParseratorTool(BaseTool):
    """LangChain tool for Parserator structured data extraction."""
    
    name = "parserator_extract"
    description = """
    Extract structured data from unstructured text using Parserator's Architect-Extractor pattern.
    Input should be: {"text": "content to parse", "schema": {"field": "type"}, "context": "optional context"}
    Returns structured JSON with 95% accuracy.
    """
    
    api_key: str = Field(..., description="Parserator API key")
    base_url: str = Field(default="https://app-5108296280.us-central1.run.app", description="API base URL")
    
    def _run(self, query: str) -> str:
        """Execute the Parserator extraction."""
        try:
            # Parse the input query
            if isinstance(query, str):
                try:
                    query_data = json.loads(query)
                except json.JSONDecodeError:
                    # If not JSON, treat as plain text with default schema
                    query_data = {
                        "text": query,
                        "schema": {
                            "entities": ["string"],
                            "summary": "string",
                            "key_points": ["string"]
                        },
                        "context": "general_extraction"
                    }
            else:
                query_data = query
            
            # Make API request
            response = requests.post(
                f"{self.base_url}/v1/parse",
                headers={
                    "Content-Type": "application/json"
                },
                json={
                    "inputData": query_data["text"],
                    "outputSchema": query_data["schema"],
                    "context": query_data.get("context", "langchain_extraction")
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return json.dumps(result.get("parsedData", {}), indent=2)
            else:
                return f"Error: {response.status_code} - {response.text}"
                
        except Exception as e:
            return f"Error processing request: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)

class ParseratorTemplateTool(BaseTool):
    """LangChain tool for using Parserator templates."""
    
    name = "parserator_template"
    description = """
    Use a saved Parserator template to parse text. 
    Input: {"text": "content to parse", "template_id": "tmpl_xyz123"}
    Returns structured data using the specified template.
    """
    
    api_key: str = Field(..., description="Parserator API key")
    base_url: str = Field(default="https://app-5108296280.us-central1.run.app", description="API base URL")
    
    def _run(self, query: str) -> str:
        """Execute template-based parsing."""
        try:
            query_data = json.loads(query) if isinstance(query, str) else query
            
            response = requests.post(
                f"{self.base_url}/v1/run/{query_data['template_id']}",
                headers={
                    "Content-Type": "application/json"
                },
                json={"inputData": query_data["text"]}
            )
            
            if response.status_code == 200:
                result = response.json()
                return json.dumps(result.get("parsedData", {}), indent=2)
            else:
                return f"Error: {response.status_code} - {response.text}"
                
        except Exception as e:
            return f"Error processing template request: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        return self._run(query)

# Example LangChain Agent Setup
def create_parserator_agent(api_key: str, llm_api_key: str):
    """Create a LangChain agent enhanced with Parserator tools."""
    
    # Initialize LLM
    llm = OpenAI(openai_api_key=llm_api_key, temperature=0)
    
    # Create Parserator tools
    tools = [
        ParseratorTool(api_key=api_key),
        ParseratorTemplateTool(api_key=api_key)
    ]
    
    # Initialize agent
    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True
    )
    
    return agent

# Real-world usage examples
def example_email_parsing():
    """Example: Parse email content with LangChain + Parserator."""
    
    agent = create_parserator_agent(
        api_key="pk_live_your_key",
        llm_api_key="your_openai_key"
    )
    
    email_content = """
    From: john.smith@acme.com
    Subject: Q4 Planning Meeting
    
    Hi team,
    
    Let's schedule our Q4 planning meeting for next Tuesday at 2 PM in Conference Room A.
    We need to discuss budget allocation and project timelines.
    
    Please confirm your attendance.
    
    Best,
    John Smith
    Project Manager
    """
    
    result = agent.run(f"""
    Parse this email content using parserator_extract tool:
    {{"text": "{email_content}", "schema": {{"sender": "string", "subject": "string", "meeting_details": {{"date": "string", "time": "string", "location": "string"}}, "agenda": ["string"], "action_required": "string"}}, "context": "email_parsing"}}
    """)
    
    return result

def example_document_analysis():
    """Example: Analyze business document with structured extraction."""
    
    agent = create_parserator_agent(
        api_key="pk_live_your_key", 
        llm_api_key="your_openai_key"
    )
    
    document = """
    QUARTERLY SALES REPORT - Q3 2025
    
    Total Revenue: $1,250,000 (up 15% from Q2)
    New Customers: 340 (target was 300)
    Customer Retention: 92%
    
    Top Performing Products:
    1. Enterprise Suite - $450,000 revenue
    2. Professional Plan - $380,000 revenue  
    3. Starter Package - $420,000 revenue
    
    Key Challenges:
    - Increased competition in enterprise segment
    - Need for enhanced customer support
    - Product feature gaps identified
    
    Recommendations:
    - Increase R&D budget by 20%
    - Hire 3 additional support staff
    - Launch competitive analysis project
    """
    
    result = agent.run(f"""
    Extract key business metrics from this report using parserator_extract:
    {{"text": "{document}", "schema": {{"period": "string", "revenue": {{"total": "float", "growth": "string"}}, "customers": {{"new": "integer", "retention": "float"}}, "products": [{{"name": "string", "revenue": "float"}}], "challenges": ["string"], "recommendations": ["string"]}}, "context": "business_report_analysis"}}
    """)
    
    return result

def example_customer_support():
    """Example: Customer support ticket analysis and routing."""
    
    agent = create_parserator_agent(
        api_key="pk_live_your_key",
        llm_api_key="your_openai_key" 
    )
    
    ticket = """
    Ticket #12345
    From: frustrated.customer@company.com
    Priority: High
    
    I'm extremely frustrated with order #ORD-9876. It was supposed to arrive 
    last Tuesday but still hasn't shown up. I've called customer service 3 times 
    and each rep gives me a different story. One said it was delayed, another 
    said it was lost, and the third said it was never shipped!
    
    I need this resolved immediately or I want a full refund. This is completely 
    unacceptable for a company of your reputation.
    
    Sarah Johnson
    Premium Customer since 2020
    """
    
    result = agent.run(f"""
    Analyze this customer support ticket for routing and priority using parserator_extract:
    {{"text": "{ticket}", "schema": {{"ticket_id": "string", "customer": {{"name": "string", "email": "string", "tier": "string"}}, "issue": {{"type": "string", "order_id": "string", "description": "string"}}, "sentiment": "string", "urgency": "string", "previous_contacts": "integer", "resolution_needed": "string"}}, "context": "customer_support_triage"}}
    """)
    
    return result

# Advanced Chain Example
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

def create_parsing_chain(api_key: str, llm_api_key: str):
    """Create a specialized parsing chain with Parserator."""
    
    llm = OpenAI(openai_api_key=llm_api_key, temperature=0)
    
    # Template for parsing tasks
    parsing_template = """
    You are a data extraction specialist using Parserator for structured data extraction.
    
    Task: {task}
    Content: {content}
    
    First, analyze the content and determine the optimal schema for extraction.
    Then use the parserator_extract tool to extract structured data.
    Finally, provide insights based on the extracted data.
    
    Schema suggestion: {schema}
    
    Proceed with extraction:
    """
    
    prompt = PromptTemplate(
        input_variables=["task", "content", "schema"],
        template=parsing_template
    )
    
    tools = [ParseratorTool(api_key=api_key)]
    agent = initialize_agent(tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION)
    
    chain = LLMChain(llm=agent, prompt=prompt)
    return chain

if __name__ == "__main__":
    # Example usage
    print("=== Email Parsing Example ===")
    print(example_email_parsing())
    
    print("\n=== Document Analysis Example ===") 
    print(example_document_analysis())
    
    print("\n=== Customer Support Example ===")
    print(example_customer_support())