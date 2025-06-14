# Parserator Python SDK

[![PyPI version](https://badge.fury.io/py/parserator-sdk.svg)](https://badge.fury.io/py/parserator-sdk)
[![Python Support](https://img.shields.io/pypi/pyversions/parserator-sdk)](https://pypi.org/project/parserator-sdk/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](https://github.com/domusgpt/parserator/blob/main/LICENSE)

Official Python SDK for [Parserator](https://parserator.com) - Intelligent data parsing using the Architect-Extractor pattern.

> ⚠️ **Alpha Software**: This SDK is currently in alpha development. APIs may change between versions.

## 🚀 Quick Start

```python
from parserator import ParseatorClient

# Initialize the client
client = ParseatorClient(api_key="your_api_key")

# Parse unstructured data into structured JSON
result = client.parse(
    input_data="John Smith, Senior Engineer at TechCorp, john@techcorp.com, +1-555-0123",
    output_schema={
        "name": "string",
        "title": "string",
        "company": "string",
        "email": "string",
        "phone": "string"
    }
)

print(result.parsed_data)
# Output: {"name": "John Smith", "title": "Senior Engineer", "company": "TechCorp", "email": "john@techcorp.com", "phone": "+1-555-0123"}
```

## 📦 Installation

### Basic Installation
```bash
pip install parserator-sdk
```

### With Framework Integrations
```bash
# All integrations
pip install parserator-sdk[integrations]

# Specific frameworks
pip install parserator-sdk[crewai]      # CrewAI support
pip install parserator-sdk[langchain]   # LangChain support
pip install parserator-sdk[google-adk]  # Google ADK support
```

### With Data Science Libraries
```bash
pip install parserator-sdk[data-science]  # Includes pandas, numpy, polars
```

### Development Installation
```bash
pip install parserator-sdk[dev]  # Testing and development tools
```

## 🔌 Framework Integrations

### LangChain Integration
```python
from parserator.integrations.langchain import ParseatorTool

# Create a LangChain tool
tool = ParseatorTool(api_key="your_api_key")

# Use in a LangChain agent
result = tool.run(
    "Extract contact info from: John Smith, CTO at DataCorp, john@datacorp.com"
)
```

### CrewAI Integration (Alpha)
```python
from parserator.integrations.crewai import ParseatorTool
from crewai import Agent, Task, Crew

# Create parsing tool
parser = ParseatorTool(api_key="your_api_key")

# Create agent with parsing capability
agent = Agent(
    role='Data Analyst',
    goal='Extract structured data from unstructured text',
    tools=[parser]
)

# Use in CrewAI workflows
crew = Crew(agents=[agent], tasks=[task])
result = crew.kickoff()
```

### Google ADK Integration (Alpha)
```python
from parserator.integrations.google_adk import ParseatorTool
from google.adk import Agent

# Create ADK tool
parser_tool = ParseatorTool(api_key="your_api_key")

# Create agent with parsing capability
agent = Agent(
    name="DataParser",
    description="Extracts structured data",
    tools=[parser_tool]
)
```

### AutoGPT Blocks (Alpha)
```python
# Use in AutoGPT Platform workflows
from parserator.integrations.autogpt_block import ParseTextBlock

# Blocks are registered in AutoGPT Platform
# See AutoGPT documentation for block usage
```

## 📊 Core Features

### Advanced Parsing Options
```python
# Parse with custom instructions
result = client.parse(
    input_data="Invoice #12345, Due: Jan 15, 2024, Amount: $2,500",
    output_schema={
        "invoice_number": "string",
        "due_date": "date",
        "amount": "number"
    },
    instructions="Extract financial information, format dates as YYYY-MM-DD"
)

# Parse with context
result = client.parse(
    input_data=email_content,
    output_schema=email_schema,
    context="customer_support_email"
)
```

### Schema Types
```python
# Supported schema field types
schema = {
    "text_field": "string",
    "number_field": "number",
    "boolean_field": "boolean",
    "date_field": "date",
    "array_field": "array",
    "object_field": "object"
}
```

### Error Handling
```python
try:
    result = client.parse(input_data=data, output_schema=schema)
    
    if result.success:
        print(f"Parsed data: {result.parsed_data}")
        print(f"Confidence: {result.metadata['confidence']}")
        print(f"Tokens used: {result.metadata['tokensUsed']}")
    else:
        print(f"Parsing failed: {result.error_message}")
        
except ParseatorError as e:
    print(f"Error: {e}")
```

### Batch Processing
```python
# Process multiple items
items = ["item1", "item2", "item3"]
results = []

for item in items:
    result = client.parse(
        input_data=item,
        output_schema=schema
    )
    results.append(result)
```

## 🔧 Configuration

### Environment Variables
```bash
# Set API key via environment
export PARSERATOR_API_KEY="your_api_key"

# Optional: Custom API endpoint
export PARSERATOR_BASE_URL="https://custom-endpoint.com"
```

### Client Configuration
```python
from parserator import ParseatorClient

# Initialize with custom settings
client = ParseatorClient(
    api_key="your_api_key",
    base_url="https://custom-endpoint.com",  # Optional
    timeout=30,  # Request timeout in seconds
    max_retries=3  # Retry failed requests
)
```

## 📚 Examples

### Email Parsing
```python
email_content = """
From: customer@example.com
Subject: Order Issue - Urgent
Date: 2024-12-06

Hi Support,

I'm having issues with order #ORD-2024-1234. The delivery was supposed to 
arrive yesterday but tracking shows it's still in transit. Please help!

Best,
Sarah Johnson
Customer ID: CUST-5678
"""

result = client.parse(
    input_data=email_content,
    output_schema={
        "sender_email": "string",
        "subject": "string",
        "order_number": "string",
        "customer_name": "string",
        "customer_id": "string",
        "issue_type": "string",
        "urgency": "string"
    }
)
```

### Invoice Processing
```python
invoice_text = """
INVOICE
Invoice #: INV-2024-001
Date: December 6, 2024
Due Date: January 6, 2025

Bill To:
Acme Corporation
123 Business St
San Francisco, CA 94105

Items:
1. Consulting Services (40 hours @ $150/hr): $6,000
2. Software License (1 year): $2,400
3. Support Package: $1,600

Subtotal: $10,000
Tax (8.5%): $850
Total Due: $10,850
"""

result = client.parse(
    input_data=invoice_text,
    output_schema={
        "invoice_number": "string",
        "invoice_date": "date",
        "due_date": "date",
        "customer": {
            "name": "string",
            "address": "string"
        },
        "line_items": "array",
        "subtotal": "number",
        "tax_rate": "number",
        "tax_amount": "number",
        "total": "number"
    }
)
```

### Contact Information Extraction
```python
business_card = """
Dr. Sarah Chen, PhD
Chief Technology Officer
InnovateTech Solutions

📧 sarah.chen@innovatetech.com
📱 +1 (555) 987-6543
🏢 1234 Innovation Drive, Suite 567
   San Jose, CA 95110
🌐 linkedin.com/in/sarahchen
💼 innovatetech.com
"""

result = client.parse(
    input_data=business_card,
    output_schema={
        "name": "string",
        "title": "string",
        "company": "string",
        "email": "string",
        "phone": "string",
        "address": "string",
        "linkedin": "string",
        "website": "string"
    }
)
```

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=parserator

# Run specific test file
pytest tests/test_client.py

# Run integration tests (requires API key)
PARSERATOR_API_KEY=your_key pytest -m integration
```

## 📖 API Reference

### ParseatorClient

#### `__init__(api_key: str, base_url: str = None, timeout: int = 30, max_retries: int = 3)`
Initialize a new Parserator client.

#### `parse(input_data: str, output_schema: dict, instructions: str = None, context: str = None) -> ParseResult`
Parse unstructured data into structured format.

**Parameters:**
- `input_data`: The unstructured text to parse
- `output_schema`: Dictionary defining the expected output structure
- `instructions`: Optional parsing instructions
- `context`: Optional context for parsing optimization

**Returns:**
- `ParseResult` object with:
  - `success`: Boolean indicating parsing success
  - `parsed_data`: Structured data matching output_schema
  - `metadata`: Dictionary with confidence, processing time, tokens used
  - `error_message`: Error details if parsing failed

### Integration Classes

#### LangChain: `ParseatorTool`
- Inherits from `BaseTool`
- Compatible with LangChain agents and chains

#### CrewAI: `ParseatorTool`, `EmailParserTool`, `DocumentParserTool`
- Compatible with CrewAI v0.47+
- Specialized tools for different data types

#### Google ADK: `ParseatorTool`, `create_parsing_agent()`
- Compatible with Google ADK v1.3.0+
- Helper functions for agent creation

#### AutoGPT: `ParseTextBlock`, `ParseEmailBlock`, `ParseDocumentBlock`
- Compatible with AutoGPT Platform
- Block-based architecture for workflows

## 🔒 Security

- API keys are never logged or exposed
- HTTPS encryption for all API calls
- Rate limiting to prevent abuse
- Input validation and sanitization

## 🆘 Support

### Documentation
- [API Documentation](https://github.com/domusgpt/parserator/tree/main/docs)
- [Integration Examples](https://github.com/domusgpt/parserator/tree/main/examples)
- [GitHub Issues](https://github.com/domusgpt/parserator/issues)

### Community
- Email: phillips.paul.email@gmail.com
- GitHub: [https://github.com/domusgpt/parserator](https://github.com/domusgpt/parserator)
- Website: [https://parserator.com](https://parserator.com)

## 📝 License

This project is licensed under a Proprietary License - see the [LICENSE](https://github.com/domusgpt/parserator/blob/main/LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/domusgpt/parserator/blob/main/CONTRIBUTING.md) for details.

## 🔄 Changelog

### Version 1.1.0-alpha (Current)
- Added CrewAI integration support
- Added Google ADK integration support  
- Added AutoGPT blocks support
- Enhanced error handling
- Improved documentation

### Version 1.0.0
- Initial release
- Core parsing functionality
- LangChain integration
- Basic documentation

---

**⚠️ Alpha Notice**: This SDK is in active development. Features may change, and bugs may exist. Please report issues on [GitHub](https://github.com/domusgpt/parserator/issues).

Built with ❤️ by the Parserator team following [Exoditical Moral Architecture](https://parserator.com/ema) principles.