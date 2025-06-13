# 🤖 **PARSERATOR**
*The Structured Data Layer for AI Agents*

[![npm version](https://badge.fury.io/js/parserator-mcp-server.svg)](https://www.npmjs.com/package/parserator-mcp-server)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-00D9FF)](https://modelcontextprotocol.io)
[![EMA Compliant](https://img.shields.io/badge/EMA-Compliant-39FF14)](https://parserator.com/#first-principles)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 **LIVE NOW: MCP SERVER ON NPM**

```bash
# Install globally for any MCP-compatible agent
npm install -g parserator-mcp-server

# Use in Claude Desktop, any agent framework
parserator-mcp YOUR_API_KEY
```

Transform any unstructured input into agent-ready JSON with **95% accuracy**. Built for Google ADK, MCP, LangChain, and any agent framework.

**🌐 [Live API Demo](https://parserator.com) • 📖 [Full Documentation](https://parserator.com/product.html)**

---

## 🎯 **QUICK START EXAMPLES**

### **MCP Server (Universal Agent Compatibility)**
```bash
# Install MCP server
npm install -g parserator-mcp-server

# Configure in Claude Desktop
parserator-mcp pk_live_your_api_key

# Any MCP agent can now use structured parsing
```

### **Google ADK Integration** 
```python
from parserator import parse_for_agent

@agent.tool
def extract_user_intent(user_message: str) -> UserIntent:
    return parse_for_agent(
        text=user_message,
        schema=UserIntent,
        context="command_parsing"
    )
```

### **REST API (Any Framework)**
```python
import requests

response = requests.post('https://api.parserator.com/v1/parse', {
    'input': "Schedule call with Sarah tomorrow 3pm about Q4",
    'schema': {
        'action': 'string',
        'contact': 'string', 
        'datetime': 'ISO8601',
        'topic': 'string'
    },
    'headers': {'Authorization': 'Bearer pk_live_your_key'}
})

# Returns: {"action": "create_meeting", "contact": "Sarah", ...}
```

---

## 🔧 **FRAMEWORK INTEGRATIONS**

| Framework | Status | Installation | Documentation |
|-----------|--------|-------------|---------------|
| **MCP Server** | ✅ **LIVE** | `npm install -g parserator-mcp-server` | [Setup Guide](#mcp-setup) |
| **Google ADK** | 🚧 **BETA** | `pip install parserator-adk` | [Integration Docs](#adk-setup) |
| **LangChain** | ✅ **LIVE** | `pip install parserator` | [LangChain Tools](#langchain) |
| **AutoGPT** | ✅ **LIVE** | REST API | [Plugin Guide](#autogpt) |
| **CrewAI** | ✅ **LIVE** | REST API | [Crew Tools](#crewai) |
| **Custom** | ✅ **LIVE** | REST API | [API Docs](https://parserator.com/product.html) |

---

## 🏗️ **THE ARCHITECT-EXTRACTOR PATTERN**

Parserator's two-stage approach eliminates the 15% failure rate that breaks agent workflows:

```
Input → [Architect] → Schema Design → [Extractor] → Structured JSON
```

**Stage 1 - Architect:** Analyzes input and designs optimal schema
**Stage 2 - Extractor:** Extracts data using the designed schema

**Result:** 95% accuracy with valid JSON every time.

---

## 🛡️ **EXODITICAL MORAL ARCHITECTURE (EMA)**

Built on principles of digital sovereignty and user empowerment:

- **🔓 Zero Vendor Lock-in:** Export everything, migrate anywhere
- **📤 Complete Portability:** Your templates, your data, your freedom  
- **🌉 Universal Standards:** OpenAPI, JSON, Docker - not proprietary formats
- **🔍 Transparent Competition:** We compete on merit, not walls

**[Read the EMA First Principles →](https://parserator.com/#first-principles)**

---

## 📋 **DETAILED SETUP GUIDES**

### **MCP Setup (Claude Desktop & Universal)**

1. **Install MCP Server:**
   ```bash
   npm install -g parserator-mcp-server
   ```

2. **Get API Key:**
   - Visit [parserator.com](https://parserator.com)
   - Sign up for free (1,000 requests/month)
   - Copy your API key

3. **Configure Claude Desktop:**
   ```bash
   parserator-mcp pk_live_your_api_key
   ```

4. **Test Integration:**
   Any MCP-compatible agent can now use structured parsing commands.

### **ADK Setup (Google Agent Development Kit)**

```python
# Install Parserator ADK integration
pip install parserator-adk

# Configure in your agent
from parserator import ADKParserator

parser = ADKParserator(api_key="pk_live_your_key")

@agent.tool
def parse_user_input(text: str, schema: dict) -> dict:
    return parser.extract(text, schema)
```

### **LangChain Integration**

```python
from parserator import ParseratorTool

# Add to your agent's toolkit
tools = [
    ParseratorTool(
        api_key="pk_live_your_key",
        name="structured_parser"
    )
]

agent = initialize_agent(tools, llm)
```

---

## 🎨 **EXAMPLE USE CASES**

### **Smart Assistant Agent**
```python
# Natural language → Calendar action
input: "Schedule call with Sarah tomorrow 3pm about Q4"
output: {
    "action": "create_meeting",
    "contact": "Sarah", 
    "datetime": "2024-03-16T15:00:00",
    "topic": "Q4 budget"
}
```

### **Customer Service Agent**
```python
# Support ticket → Structured analysis
input: "Frustrated with order #12345. Late delivery, damaged item!"
output: {
    "issue_type": "order_problem",
    "order_id": "12345",
    "problems": ["late_delivery", "damaged_item"],
    "sentiment": "frustrated",
    "priority": "high"
}
```

### **Document Understanding Agent**
```python
# PDF/Document → Structured data
input: "Invoice_March_2024.pdf"
output: {
    "invoice_number": "INV-2024-0342",
    "amount": 1250.00,
    "due_date": "2024-04-15",
    "line_items": [...]
}
```

---

## 🔗 **LINKS & RESOURCES**

- **🌐 Website:** [parserator.com](https://parserator.com)
- **📖 Documentation:** [parserator.com/product.html](https://parserator.com/product.html)
- **🚀 Live API:** [parserator.com/try](https://parserator.com/index-production-ready.html)
- **📦 NPM Package:** [parserator-mcp-server](https://www.npmjs.com/package/parserator-mcp-server)
- **🛡️ Privacy Policy:** [parserator.com/privacy-policy.html](https://parserator.com/privacy-policy.html)
- **⚖️ Terms of Service:** [parserator.com/terms-of-service.html](https://parserator.com/terms-of-service.html)

---

## 🤝 **CONTRIBUTING**

We welcome contributions that advance the EMA movement:

1. **Fork this repository**
2. **Create feature branch** (`git checkout -b feature/amazing-integration`)
3. **Commit changes** (`git commit -m 'Add amazing integration'`)
4. **Push to branch** (`git push origin feature/amazing-integration`)
5. **Open Pull Request**

**Contributing Guidelines:** Maintain EMA principles - no vendor lock-in, universal standards, complete exportability.

---

## 📊 **ROADMAP**

### **Current Status**
- ✅ MCP Server (LIVE ON NPM)
- ✅ REST API (Production Ready)
- ✅ Universal Agent Compatibility
- ✅ EMA-Compliant Architecture

### **In Development**
- 🚧 Google ADK Integration
- 🚧 Advanced Template System
- 🚧 Multi-modal Input Support

### **Planned Features**
- 🔜 Enterprise Privacy Controls
- 🔜 Custom Model Support
- 🔜 Advanced Analytics
- 🔜 Community Marketplace

---

## 📄 **LICENSE**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 📧 **CONTACT & SUPPORT**

- **Technical Support:** [support@parserator.com](mailto:support@parserator.com)
- **Business Inquiries:** [business@parserator.com](mailto:business@parserator.com)
- **EMA Movement:** [revolution@parserator.com](mailto:revolution@parserator.com)

**Built by:** Paul Phillips ([@domusgpt](https://github.com/domusgpt)) - Higher Dimensional Solo Dev

---

<div align="center">

**🚀 [Try Parserator Live](https://parserator.com) • 🤖 [Install MCP Server](https://www.npmjs.com/package/parserator-mcp-server) • 🛡️ [Learn EMA Principles](https://parserator.com/#first-principles)**

*Pioneers of the Exoditical Moral Architecture Movement*

</div>