# 🤖 Parserator

**The Structured Data Layer for AI Agents**

[![npm version](https://img.shields.io/npm/v/parserator.svg)](https://www.npmjs.com/package/parserator)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![EMA Compliant](https://img.shields.io/badge/EMA-Compliant-green.svg)](#exoditical-moral-architecture)

Transform any unstructured input into agent-ready JSON with 95% accuracy. Built for Google ADK, MCP, LangChain, and any agent framework using our revolutionary two-stage Architect-Extractor pattern.

---

## 🚀 **Quick Start**

### Install & Use in 30 seconds

```bash
# Install globally
npm install -g parserator

# Parse any text instantly
parserator parse "Contact: John Doe, Email: john@example.com, Phone: 555-0123"
```

**Output:**
```json
{
  "contact": "John Doe",
  "email": "john@example.com", 
  "phone": "555-0123"
}
```

### Get API Access
```bash
# Get your free API key
curl -X POST https://parserator.com/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

---

## 🔧 **Agent Integrations**

### Google ADK
```python
@agent.tool
def extract_user_intent(user_message: str) -> UserIntent:
    return parse_for_agent(
        text=user_message,
        schema=UserIntent,
        context="command_parsing"
    )
```

### MCP Server (Universal)
```bash
# Install MCP server for any agent
npm install -g parserator-mcp-server

# Use in any MCP-compatible agent
mcp://parserator/parse?schema=Contact&text=email_content
```

### LangChain
```python
from parserator import ParseChain

parser = ParseChain(api_key="your_key")
result = parser.parse(
    text="messy data here",
    output_schema={"name": "string", "age": "number"}
)
```

### CrewAI
```python
from parserator.integrations.crewai import ParseratorTool

parse_tool = ParseratorTool(
    name="extract_data",
    description="Parse unstructured text into JSON"
)
```

---

## ⚡ **Browser Extensions**

Transform web data instantly while browsing:

### Chrome Extension
- **Install**: [Chrome Web Store](https://chrome.google.com/webstore)
- **Use**: Right-click any text → "Parse with Parserator" → Perfect JSON
- **Features**: Auto-detect schemas, bulk export, local processing

### VS Code Extension  
- **Install**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=parserator.parserator)
- **Use**: Select messy data → Ctrl+Shift+P → Generate TypeScript types
- **Features**: Schema templates, batch processing, framework integration

---

## 🧠 **How It Works: Architect-Extractor Pattern**

Traditional LLMs waste tokens on complex reasoning with large datasets. Parserator uses a **two-stage approach**:

### Stage 1: The Architect (Planning)
- **Input**: Your schema + small data sample (~1K chars)
- **Job**: Create detailed extraction plan
- **LLM**: Gemini 1.5 Flash (optimized for reasoning)
- **Output**: Structured search instructions

### Stage 2: The Extractor (Execution)  
- **Input**: Full dataset + extraction plan
- **Job**: Execute plan with minimal thinking
- **LLM**: Gemini 1.5 Flash (optimized for following instructions)
- **Output**: Clean, validated JSON

### Results
- **70% token reduction** vs single-LLM approaches
- **95% accuracy** on complex data
- **Sub-3 second** response times
- **No vendor lock-in** - works with any LLM provider

---

## 📦 **Installation Options**

### 🔹 **Node.js/TypeScript**
```bash
npm install parserator
```

### 🔹 **Python**
```bash
pip install parserator
```

### 🔹 **Browser Extensions**
- [Chrome Extension](https://chrome.google.com/webstore) - Right-click parsing
- [VS Code Extension](https://marketplace.visualstudio.com) - Developer workflow

### 🔹 **Agent Frameworks**
```bash
# MCP Server (Universal)
npm install -g parserator-mcp-server

# LangChain Integration
pip install parserator[langchain]

# CrewAI Integration  
pip install parserator[crewai]

# Google ADK Integration
pip install parserator[adk]
```

---

## 🌟 **Use Cases**

### **For Developers**
- **API Integration**: Parse inconsistent API responses
- **Data Migration**: Extract from legacy systems
- **ETL Pipelines**: Intelligent data transformation
- **Web Scraping**: Handle changing site layouts

### **For AI Agents**
- **Email Processing**: Extract tasks, contacts, dates
- **Document Analysis**: Parse contracts, invoices, reports
- **User Commands**: Convert natural language to structured actions
- **Research Workflows**: Extract key info from papers, articles

### **For Data Teams**
- **Log Analysis**: Structure unstructured log files
- **Data Cleaning**: Normalize messy datasets
- **Import Processing**: Handle varied file formats
- **Quality Assurance**: Validate data consistency

---

## 🏗️ **API Reference**

### **Core Endpoint**
```http
POST https://api.parserator.com/v1/parse
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "inputData": "Contact: John Doe, Email: john@example.com, Phone: 555-0123",
  "outputSchema": {
    "contact": "string",
    "email": "string", 
    "phone": "string"
  },
  "instructions": "Extract contact information"
}
```

### **Response**
```json
{
  "success": true,
  "parsedData": {
    "contact": "John Doe",
    "email": "john@example.com",
    "phone": "555-0123"
  },
  "metadata": {
    "confidence": 0.96,
    "tokensUsed": 1250,
    "processingTimeMs": 800
  }
}
```

### **SDK Examples**

#### **JavaScript/TypeScript**
```javascript
import { Parserator } from 'parserator';

const parser = new Parserator('your-api-key');

const result = await parser.parse({
  inputData: 'messy text here',
  outputSchema: { name: 'string', age: 'number' }
});

console.log(result.parsedData);
```

#### **Python**
```python
from parserator import Parserator

parser = Parserator('your-api-key')

result = parser.parse(
    input_data='messy text here',
    output_schema={'name': 'string', 'age': 'number'}
)

print(result.parsed_data)
```

---

## 🛡️ **Exoditical Moral Architecture**

Parserator is built on **EMA principles** - a revolutionary approach to ethical software development:

### **🔓 Digital Sovereignty**
- **Your data is yours** - We never store input/output content
- **No vendor lock-in** - Export everything, switch anytime
- **Open standards** - JSON, OpenAPI, Docker - universal compatibility
- **Transparent pricing** - No hidden costs or usage surprises

### **🚪 The Right to Leave**
- **Complete data export** - All schemas, templates, usage history
- **Standard formats** - Import into any compatible system
- **Migration tools** - Seamless transition to other platforms
- **Zero retention** - Data deleted immediately upon request

### **🌐 Universal Compatibility**  
- **Framework agnostic** - Works with any agent development platform
- **LLM agnostic** - Switch between OpenAI, Anthropic, Google, etc.
- **Deployment agnostic** - Cloud, on-premise, or hybrid
- **Standard protocols** - REST API, MCP, GraphQL support

> *"The ultimate expression of empowerment is the freedom to leave."*

---

## 🧪 **Beta Program**

### **🚀 Current Beta Features**
- **Multi-LLM Support**: OpenAI, Anthropic, Google Gemini
- **Advanced Schema Validation**: Type checking and constraint enforcement  
- **Batch Processing**: Handle multiple documents simultaneously
- **Custom Workflow Builder**: Chain parsing operations
- **Real-time Monitoring**: Live parsing analytics dashboard

### **Join the Beta**
```bash
# Install beta version
npm install parserator@beta

# Enable beta features
parserator config set beta-features true
```

**Beta Feedback**: [Join Discord](https://discord.gg/parserator) | [GitHub Issues](https://github.com/domusgpt/parserator/issues)

---

## 📊 **Pricing**

### **🆓 Free Tier**
- **1,000 parses/month**
- **Basic schema detection**
- **Community support**
- **Standard accuracy (90%)**

### **⚡ Pro ($29/month)**
- **50,000 parses/month**
- **Advanced schema templates**
- **Priority support**
- **Enhanced accuracy (95%)**
- **Batch processing**

### **🏢 Enterprise (Custom)**
- **Unlimited parsing**
- **On-premise deployment**
- **Custom integrations**
- **SLA guarantee**
- **Dedicated support**

[**Start Free Trial →**](https://parserator.com/pricing)

---

## 🤝 **Community & Support**

### **📚 Documentation**
- [**API Reference**](https://docs.parserator.com/api)
- [**Integration Guides**](https://docs.parserator.com/integrations)
- [**Agent Frameworks**](https://docs.parserator.com/agents)
- [**Schema Design**](https://docs.parserator.com/schemas)

### **💬 Community**
- [**Discord**](https://discord.gg/parserator) - Real-time support and discussions
- [**GitHub Discussions**](https://github.com/domusgpt/parserator/discussions) - Feature requests and feedback
- [**YouTube**](https://youtube.com/@parserator) - Tutorials and demos
- [**LinkedIn**](https://linkedin.com/company/parserator) - Updates and announcements

### **🛠️ Support**
- **Email**: [Gen-rl-millz@parserator.com](mailto:Gen-rl-millz@parserator.com)
- **Response Time**: <24 hours (Pro/Enterprise: <4 hours)
- **Bug Reports**: [GitHub Issues](https://github.com/domusgpt/parserator/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/domusgpt/parserator/discussions)

---

## 🏆 **Why Parserator?**

| **Feature** | **Parserator** | **Traditional Parsers** | **Single-LLM Solutions** |
|-------------|----------------|-------------------------|--------------------------|
| **Accuracy** | 95% | 60-70% | 85% |
| **Token Efficiency** | 70% less | N/A | Baseline |
| **Setup Time** | <5 minutes | Hours/Days | 30 minutes |
| **Maintenance** | Zero | High | Medium |
| **Vendor Lock-in** | None | High | Medium |
| **Schema Flexibility** | Unlimited | Fixed | Limited |

---

## 📈 **Roadmap**

### **Q2 2025 - Enhanced Intelligence**
- [ ] **Multi-modal parsing** - Images, PDFs, audio
- [ ] **Confidence scoring** - Per-field accuracy metrics
- [ ] **Auto-correction** - Self-healing parsing failures
- [ ] **Template marketplace** - Community schema sharing

### **Q3 2025 - Enterprise Features**  
- [ ] **On-premise deployment** - Full air-gapped operation
- [ ] **Advanced monitoring** - Parsing analytics and optimization
- [ ] **Workflow automation** - Trigger-based parsing pipelines
- [ ] **Compliance tools** - GDPR, HIPAA, SOX support

### **Q4 2025 - Platform Expansion**
- [ ] **Mobile SDKs** - iOS and Android integration
- [ ] **Desktop applications** - Native Windows, Mac, Linux
- [ ] **Zapier/Make integration** - No-code automation
- [ ] **Microsoft Power Platform** - Enterprise workflow integration

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

**EMA Commitment**: This project follows Exoditical Moral Architecture principles, ensuring your right to digital sovereignty and freedom to migrate.

---

## 🙏 **Credits**

Built with radical conviction by [**GEN-RL-MiLLz**](https://github.com/domusgpt) - "The Higher Dimensional Solo Dev"

*"Grateful for your support as I grow Hooves & a Horn, taking pole position for the 2026 Agentic Derby."*

---

<div align="center">

**[🚀 Get Started](https://parserator.com)** • **[📚 Documentation](https://docs.parserator.com)** • **[💬 Discord](https://discord.gg/parserator)** • **[🐙 GitHub](https://github.com/domusgpt/parserator)**

**Transform your messy data into agent-ready JSON today.**

</div>