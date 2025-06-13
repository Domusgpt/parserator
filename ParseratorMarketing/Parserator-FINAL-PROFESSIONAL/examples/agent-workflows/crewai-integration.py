"""
CrewAI Integration Example for Parserator
Production Ready - Available Now
"""

from crewai import Agent, Task, Crew
from crewai.tools import BaseTool
import requests
import json
from typing import Dict, Any

class ParseatorTool(BaseTool):
    """CrewAI tool for Parserator structured data extraction."""
    
    name: str = "parserator_extract"
    description: str = """
    Extract structured data from unstructured text using Parserator's Architect-Extractor pattern.
    Provide the input text and desired output schema. Returns structured JSON with 95% accuracy.
    """
    
    def __init__(self, api_key: str, base_url: str = "https://app-5108296280.us-central1.run.app"):
        super().__init__()
        self.api_key = api_key
        self.base_url = base_url
    
    def _run(self, text: str, schema: Dict[str, Any], context: str = "crewai_extraction") -> Dict[str, Any]:
        """Execute the Parserator extraction."""
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
                return result.get("parsedData", {})
            else:
                return {"error": f"API error: {response.status_code}", "details": response.text}
                
        except Exception as e:
            return {"error": f"Request failed: {str(e)}"}

# Example CrewAI Agents with Parserator Integration

def create_data_analyst_agent(api_key: str):
    """Create a data analyst agent with Parserator capabilities."""
    
    parserator_tool = ParseatorTool(api_key=api_key)
    
    return Agent(
        role="Data Analyst",
        goal="Extract and analyze structured data from various sources",
        backstory="""
        You are a skilled data analyst who specializes in extracting meaningful 
        insights from unstructured data. You use Parserator to convert messy 
        text into clean, structured data for analysis.
        """,
        tools=[parserator_tool],
        verbose=True
    )

def create_email_processor_agent(api_key: str):
    """Create an email processing agent with Parserator capabilities."""
    
    parserator_tool = ParseatorTool(api_key=api_key)
    
    return Agent(
        role="Email Processor",
        goal="Process and categorize incoming emails automatically",
        backstory="""
        You are an intelligent email processing agent that can parse 
        email content, extract action items, and categorize messages 
        for appropriate routing and response.
        """,
        tools=[parserator_tool],
        verbose=True
    )

def create_document_extractor_agent(api_key: str):
    """Create a document processing agent with Parserator capabilities."""
    
    parserator_tool = ParseatorTool(api_key=api_key)
    
    return Agent(
        role="Document Processor",
        goal="Extract structured information from various document types",
        backstory="""
        You are a document processing specialist who can extract 
        structured data from invoices, contracts, reports, and other 
        business documents with high accuracy.
        """,
        tools=[parserator_tool],
        verbose=True
    )

def create_customer_support_agent(api_key: str):
    """Create a customer support agent with Parserator capabilities."""
    
    parserator_tool = ParseatorTool(api_key=api_key)
    
    return Agent(
        role="Customer Support Analyst",
        goal="Analyze customer feedback and support tickets for insights",
        backstory="""
        You are a customer support analyst who processes customer 
        feedback, extracts sentiment and issues, and provides 
        recommendations for support team action.
        """,
        tools=[parserator_tool],
        verbose=True
    )

# Example Tasks

def email_processing_task(email_content: str):
    """Task for processing email content."""
    
    return Task(
        description=f"""
        Process the following email content and extract structured information:
        
        {email_content}
        
        Extract the following information:
        - Sender information (name, email, company)
        - Action items with due dates and priorities
        - Mentioned contacts
        - Key dates
        - Sentiment analysis
        - Summary
        
        Use the parserator_extract tool with appropriate schema.
        """,
        expected_output="Structured JSON with email analysis"
    )

def document_analysis_task(document_content: str, document_type: str):
    """Task for analyzing business documents."""
    
    return Task(
        description=f"""
        Analyze the following {document_type} document and extract structured data:
        
        {document_content}
        
        Extract relevant information based on the document type:
        - For invoices: invoice number, date, amount, vendor, line items
        - For contracts: parties, dates, key terms, obligations
        - For reports: title, author, findings, recommendations, metrics
        
        Use the parserator_extract tool with appropriate schema for {document_type}.
        """,
        expected_output=f"Structured JSON with {document_type} analysis"
    )

def customer_feedback_task(feedback_content: str):
    """Task for analyzing customer feedback."""
    
    return Task(
        description=f"""
        Analyze the following customer feedback and extract insights:
        
        {feedback_content}
        
        Extract the following information:
        - Customer information (name, email, tier)
        - Sentiment analysis
        - Issues and their severity
        - Priority level
        - Suggested actions
        - Escalation requirements
        - Summary
        
        Use the parserator_extract tool with appropriate schema.
        """,
        expected_output="Structured JSON with customer feedback analysis"
    )

# Example Crew Setup

def create_data_processing_crew(api_key: str):
    """Create a crew for comprehensive data processing."""
    
    # Create agents
    data_analyst = create_data_analyst_agent(api_key)
    email_processor = create_email_processor_agent(api_key)
    document_extractor = create_document_extractor_agent(api_key)
    support_analyst = create_customer_support_agent(api_key)
    
    return Crew(
        agents=[data_analyst, email_processor, document_extractor, support_analyst],
        tasks=[],  # Tasks will be added dynamically
        verbose=2
    )

# Real-world usage examples

def process_business_email_example():
    """Example: Process a business email with CrewAI + Parserator."""
    
    api_key = "pk_live_your_key"
    crew = create_data_processing_crew(api_key)
    
    email_content = """
    From: sarah.johnson@techcorp.com
    Subject: Q4 Budget Review Meeting
    Date: June 12, 2025
    
    Hi team,
    
    I need to schedule our Q4 budget review meeting for next week. 
    Please block Tuesday, June 18th at 2:00 PM in the main conference room.
    
    We'll be reviewing:
    - Q3 performance metrics
    - Q4 budget allocations
    - Resource planning for 2026
    
    Please come prepared with your department's budget proposals.
    Deadline for submitting proposals is Friday, June 15th.
    
    Best regards,
    Sarah Johnson
    Finance Director
    """
    
    task = email_processing_task(email_content)
    crew.tasks = [task]
    
    result = crew.kickoff()
    return result

def process_invoice_example():
    """Example: Process an invoice with CrewAI + Parserator."""
    
    api_key = "pk_live_your_key"
    crew = create_data_processing_crew(api_key)
    
    invoice_content = """
    INVOICE #INV-2025-0542
    Date: June 12, 2025
    Due Date: July 12, 2025
    
    From: TechSupplies Inc.
    123 Business Ave
    Tech City, TC 12345
    
    To: Your Company
    456 Corporate Blvd
    Business Town, BT 67890
    
    Items:
    1. Laptop Computers (qty: 5) - $1,200.00 each = $6,000.00
    2. Software Licenses (qty: 10) - $150.00 each = $1,500.00
    3. Maintenance Contract (qty: 1) - $800.00 each = $800.00
    
    Subtotal: $8,300.00
    Tax (8%): $664.00
    Total: $8,964.00
    
    Payment Terms: Net 30 days
    """
    
    task = document_analysis_task(invoice_content, "invoice")
    crew.tasks = [task]
    
    result = crew.kickoff()
    return result

def process_customer_support_example():
    """Example: Process customer support ticket with CrewAI + Parserator."""
    
    api_key = "pk_live_your_key"
    crew = create_data_processing_crew(api_key)
    
    support_ticket = """
    Ticket #SUPP-7890
    From: angry.customer@email.com
    Priority: High
    Category: Order Issues
    
    Subject: Extremely disappointed with order #ORD-5432
    
    I placed order #ORD-5432 three weeks ago and it still hasn't arrived. 
    This is completely unacceptable! I've been a loyal customer for 5 years 
    and this is the worst experience I've ever had.
    
    The tracking shows it was "shipped" but the tracking number doesn't work. 
    When I called customer service, they put me on hold for 45 minutes and 
    then couldn't find my order.
    
    I demand:
    1. Full refund immediately
    2. Explanation of what went wrong
    3. Compensation for the inconvenience
    
    If this isn't resolved by Friday, I'm taking my business elsewhere 
    and posting negative reviews everywhere.
    
    John Smith
    Premium Customer ID: PREM-9876
    Phone: 555-123-4567
    """
    
    task = customer_feedback_task(support_ticket)
    crew.tasks = [task]
    
    result = crew.kickoff()
    return result

# Advanced Multi-Agent Workflow

def create_comprehensive_analysis_workflow(api_key: str, input_data: str, data_type: str):
    """Create a comprehensive analysis workflow with multiple agents."""
    
    crew = create_data_processing_crew(api_key)
    
    # Step 1: Initial data extraction
    extraction_task = Task(
        description=f"""
        Extract structured data from the following {data_type}:
        
        {input_data}
        
        Use the parserator_extract tool with appropriate schema for {data_type}.
        Focus on accuracy and completeness.
        """,
        expected_output="Raw structured data extraction"
    )
    
    # Step 2: Data analysis and insights
    analysis_task = Task(
        description="""
        Analyze the extracted structured data and provide insights:
        
        1. Identify key patterns and trends
        2. Highlight important information
        3. Flag any anomalies or issues
        4. Provide actionable recommendations
        
        Use the structured data from the previous task.
        """,
        expected_output="Comprehensive data analysis with insights"
    )
    
    # Step 3: Action recommendations
    recommendation_task = Task(
        description="""
        Based on the data analysis, provide specific action recommendations:
        
        1. Immediate actions required
        2. Follow-up tasks
        3. Risk mitigation strategies
        4. Optimization opportunities
        
        Prioritize recommendations by impact and urgency.
        """,
        expected_output="Prioritized action recommendations"
    )
    
    crew.tasks = [extraction_task, analysis_task, recommendation_task]
    
    return crew.kickoff()

if __name__ == "__main__":
    # Example usage
    print("=== CrewAI + Parserator Integration Examples ===")
    
    print("\n1. Processing Business Email:")
    email_result = process_business_email_example()
    print(f"Result: {email_result}")
    
    print("\n2. Processing Invoice:")
    invoice_result = process_invoice_example()
    print(f"Result: {invoice_result}")
    
    print("\n3. Processing Customer Support Ticket:")
    support_result = process_customer_support_example()
    print(f"Result: {support_result}")