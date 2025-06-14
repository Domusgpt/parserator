"""
Parserator LangChain Integration Example
Demonstrates how to use Parserator as a LangChain tool
"""

import requests
from langchain.tools import BaseTool
from langchain.agents import create_react_agent, AgentExecutor
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class ParseratorTool(BaseTool):
    """LangChain tool for Parserator API"""
    
    name: str = "parserator"
    description: str = """
    Parse unstructured text into structured JSON data.
    Input should be a JSON string with 'text' and 'schema' fields.
    Example: {"text": "John Doe, Engineer", "schema": {"name": "string", "role": "string"}}
    """
    
    api_key: Optional[str] = Field(default=None)
    base_url: str = Field(default="https://app-5108296280.us-central1.run.app/v1")
    
    def _run(self, query: str) -> str:
        """Execute the parsing request"""
        try:
            import json
            params = json.loads(query)
            
            response = requests.post(
                f"{self.base_url}/parse",
                json={
                    "text": params["text"],
                    "schema": params["schema"],
                    "context": params.get("context", "general")
                },
                headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
                timeout=30
            )
            
            result = response.json()
            if response.status_code == 200:
                return json.dumps(result["data"], indent=2)
            else:
                return f"Error: {result.get('error', 'Unknown error')}"
                
        except Exception as e:
            return f"Error parsing request: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version (not implemented)"""
        return self._run(query)

class ParseratorAgent:
    """LangChain agent with Parserator integration"""
    
    def __init__(self, api_key: str = None, openai_api_key: str = None):
        self.parserator_tool = ParseratorTool(api_key=api_key)
        self.llm = ChatOpenAI(
            api_key=openai_api_key,
            model="gpt-4",
            temperature=0
        )
        
        # Create agent with Parserator tool
        tools = [self.parserator_tool]
        
        prompt = PromptTemplate.from_template("""
        You are an AI assistant that can parse unstructured data into structured formats.
        
        You have access to a parserator tool that can convert text into JSON based on a schema.
        
        When a user asks you to parse data:
        1. Identify what structure they want
        2. Create an appropriate schema
        3. Use the parserator tool to parse the data
        4. Present the results clearly
        
        Tools available: {tool_names}
        
        Question: {input}
        Thought: {agent_scratchpad}
        """)
        
        self.agent = create_react_agent(self.llm, tools, prompt)
        self.executor = AgentExecutor(agent=self.agent, tools=tools, verbose=True)
    
    def parse(self, text: str, schema: Dict[str, str]) -> Dict[str, Any]:
        """Direct parsing method"""
        query = {
            "text": text,
            "schema": schema
        }
        result = self.parserator_tool._run(str(query).replace("'", '"'))
        return eval(result)  # Note: In production, use json.loads
    
    def chat(self, message: str) -> str:
        """Chat interface for natural language parsing"""
        return self.executor.invoke({"input": message})["output"]

# Usage Examples
if __name__ == "__main__":
    # Initialize agent
    agent = ParseratorAgent()
    
    # Example 1: Direct parsing
    print("=== Direct Parsing ===")
    contact_text = "Sarah Johnson, Senior Developer at Tech Corp, sarah.j@techcorp.com, +1-555-0123"
    contact_schema = {
        "name": "string",
        "title": "string", 
        "company": "string",
        "email": "string",
        "phone": "string"
    }
    
    result = agent.parse(contact_text, contact_schema)
    print(f"Parsed contact: {result}")
    
    # Example 2: Natural language interface
    print("\n=== Natural Language Interface ===")
    response = agent.chat(
        "Parse this email into sender, subject, and priority: "
        "From: urgent@client.com, Subject: CRITICAL: Server Down - Need Immediate Help"
    )
    print(f"Agent response: {response}")
    
    # Example 3: Complex document parsing
    print("\n=== Document Parsing ===")
    invoice_text = """
    INVOICE #INV-2024-001
    Bill To: Acme Corp
    Date: 2024-06-14
    Items:
    - Software License: $1,200.00
    - Support Package: $300.00
    Total: $1,500.00
    """
    
    invoice_response = agent.chat(
        f"Parse this invoice into a structured format: {invoice_text}"
    )
    print(f"Invoice parsing: {invoice_response}")

# Integration with LangChain Chains
from langchain.chains import LLMChain

def create_parsing_chain():
    """Create a specialized parsing chain"""
    
    parserator = ParseratorTool()
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    prompt = PromptTemplate(
        input_variables=["text", "desired_format"],
        template="""
        Parse the following text into the desired format using the parserator tool.
        
        Text: {text}
        Desired Format: {desired_format}
        
        First, create an appropriate JSON schema, then use the parserator tool.
        """
    )
    
    return LLMChain(llm=llm, prompt=prompt)

# Advanced: Custom Parser Chain
class SmartParsingChain:
    """Intelligent parsing chain that adapts to content"""
    
    def __init__(self):
        self.parserator = ParseratorTool()
        self.llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    def auto_parse(self, text: str) -> Dict[str, Any]:
        """Automatically determine schema and parse"""
        
        # Step 1: Analyze content to determine appropriate schema
        analysis_prompt = f"""
        Analyze this text and suggest the best JSON schema structure:
        
        Text: {text}
        
        Respond with only a JSON schema object.
        """
        
        schema_response = self.llm.predict(analysis_prompt)
        
        try:
            import json
            schema = json.loads(schema_response)
            
            # Step 2: Parse with the generated schema
            query = json.dumps({"text": text, "schema": schema})
            result = self.parserator._run(query)
            
            return json.loads(result)
            
        except Exception as e:
            return {"error": f"Auto-parsing failed: {str(e)}"}

# Production deployment example
def deploy_as_api():
    """Example of deploying as FastAPI service"""
    
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel
    
    app = FastAPI(title="LangChain + Parserator API")
    
    class ParseRequest(BaseModel):
        text: str
        schema: Optional[Dict[str, str]] = None
        use_auto_schema: bool = False
    
    agent = ParseratorAgent()
    smart_chain = SmartParsingChain()
    
    @app.post("/parse")
    async def parse_endpoint(request: ParseRequest):
        try:
            if request.use_auto_schema:
                result = smart_chain.auto_parse(request.text)
            elif request.schema:
                result = agent.parse(request.text, request.schema)
            else:
                raise HTTPException(400, "Either provide schema or set use_auto_schema=true")
            
            return {"success": True, "data": result}
            
        except Exception as e:
            raise HTTPException(500, f"Parsing failed: {str(e)}")
    
    return app

# Run with: uvicorn script_name:deploy_as_api --reload