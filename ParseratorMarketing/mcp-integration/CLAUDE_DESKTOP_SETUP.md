# 🖥️ **Claude Desktop Integration - Parserator MCP Server**

## 🚀 **5-Minute Setup Guide**

Get Parserator's intelligent parsing capabilities directly in Claude Desktop using the Model Context Protocol.

---

## 📋 **Prerequisites**

1. **Claude Desktop** installed ([download here](https://claude.ai/download))
2. **Parserator API Key** ([get free key at parserator.com](https://parserator.com))
3. **5 minutes** of setup time

---

## ⚡ **Quick Setup**

### **Step 1: Get Your API Key**
```bash
# Visit https://parserator.com
# Sign up for free account
# Generate API key from dashboard
# Copy your key (starts with pk_live_...)
```

### **Step 2: Install Parserator MCP Server**
```bash
# Install globally
npm install -g parserator-mcp-server

# Verify installation
parserator-mcp --version
```

### **Step 3: Configure Claude Desktop**

**Find your Claude Desktop config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Add Parserator to your config:**
```json
{
  "mcpServers": {
    "parserator": {
      "command": "parserator-mcp",
      "args": ["pk_live_your_actual_api_key_here"],
      "description": "Intelligent data parsing for AI agents"
    }
  }
}
```

### **Step 4: Restart Claude Desktop**
```bash
# Close Claude Desktop completely
# Reopen Claude Desktop
# You should see "Parserator" in available tools
```

---

## 🎯 **Test the Integration**

### **Quick Test**
Ask Claude:
> "Use Parserator to parse this email and extract structured data: 'From: john@company.com Subject: Urgent: Q4 Report Due Hi team, please finish the quarterly report by December 15th. This is high priority.'"

### **Expected Response**
Claude will use Parserator to extract:
```json
{
  "sender": "john@company.com",
  "subject": "Urgent: Q4 Report Due", 
  "deadline": "December 15th",
  "priority": "high",
  "tasks": ["finish quarterly report"]
}
```

---

## 🛠️ **Real-World Examples**

### **📧 Email Processing**
```
Prompt: "Parse this customer support email using Parserator"

Input: Customer complaint about broken widget, wants refund, urgent priority

Output: Structured ticket data ready for CRM
```

### **📄 Document Analysis**
```
Prompt: "Use Parserator to extract key information from this contract"

Input: Legal document text

Output: Parties, dates, obligations, terms in JSON
```

### **🧾 Invoice Processing**
```
Prompt: "Parse this invoice with Parserator"

Input: Invoice text/PDF content

Output: Vendor, amount, items, due date structured
```

### **🕸️ Web Scraping Cleanup**
```
Prompt: "Clean this scraped product data with Parserator"

Input: Messy HTML/text from product pages

Output: Clean product specs, pricing, availability
```

---

## 🔧 **Advanced Configuration**

### **Multiple API Keys (Team Setup)**
```json
{
  "mcpServers": {
    "parserator-dev": {
      "command": "parserator-mcp",
      "args": ["pk_test_dev_key_here"],
      "description": "Parserator (Development)"
    },
    "parserator-prod": {
      "command": "parserator-mcp", 
      "args": ["pk_live_prod_key_here"],
      "description": "Parserator (Production)"
    }
  }
}
```

### **Custom Timeout Settings**
```json
{
  "mcpServers": {
    "parserator": {
      "command": "parserator-mcp",
      "args": ["pk_live_your_key"],
      "env": {
        "PARSERATOR_TIMEOUT": "60000",
        "PARSERATOR_DEBUG": "true"
      }
    }
  }
}
```

---

## 🎨 **Power User Tips**

### **Schema Templates**
Create reusable parsing templates:
```
"Create a Parserator schema for processing resumes"
"Parse this data using the invoice schema we created"
"Suggest a schema for social media posts"
```

### **Batch Processing**
```
"Use Parserator to process all these emails and create a summary report"
"Parse each of these product descriptions using the same schema"
```

### **Chain with Other Tools**
```
"Parse this data with Parserator, then search for similar records"
"Extract structured data, then create a summary document"
```

---

## ⚠️ **Troubleshooting**

### **Common Issues**

**"Parserator tool not available"**
- Check API key is correct (starts with `pk_live_`)
- Verify `parserator-mcp-server` is installed globally
- Restart Claude Desktop completely

**"API key invalid"**
- Confirm key from parserator.com dashboard
- Check no extra spaces in config JSON
- Try regenerating key

**"Connection timeout"**
- Increase timeout in config
- Check internet connection
- Verify Parserator API status

### **Debug Mode**
```json
{
  "mcpServers": {
    "parserator": {
      "command": "parserator-mcp",
      "args": ["pk_live_your_key"],
      "env": {
        "PARSERATOR_DEBUG": "true"
      }
    }
  }
}
```

---

## 🚀 **What Makes This Special?**

### **🏛️ Architect-Extractor Pattern**
- **Two-stage AI processing** for higher accuracy
- **70% fewer tokens** than naive prompting
- **95%+ success rate** on structured data extraction

### **🔓 EMA Compliant**
- **Zero vendor lock-in** - works with any MCP-compatible agent
- **Full data portability** - export everything
- **Open standards** - built on MCP protocol

### **⚡ Production Ready**
- **Real API integration** - not mock or demo
- **Enterprise reliability** - 99.9% uptime
- **Comprehensive error handling** - graceful failures

---

## 📊 **Monitor Usage**

### **Check API Usage**
Ask Claude:
> "Show me my Parserator API usage statistics"

### **Performance Metrics**
- Response times
- Parse success rates  
- Token efficiency
- Monthly quotas

---

## 🌟 **Next Steps**

1. **Explore Templates**: Try different parsing schemas
2. **Batch Processing**: Parse multiple items at once
3. **Integration Workflows**: Combine with other Claude tools
4. **Team Setup**: Share config with colleagues
5. **Advanced Features**: Custom schemas and validation

---

## 🤝 **Community & Support**

- **GitHub**: [parserator/mcp-server](https://github.com/parserator/mcp-server)
- **Documentation**: [docs.parserator.com](https://docs.parserator.com)
- **Discord**: [Join the community](https://discord.gg/parserator)
- **Issues**: [Report bugs](https://github.com/parserator/mcp-server/issues)

---

**🎉 Welcome to effortless AI agent data parsing!**

*Transform any unstructured input into agent-ready JSON - because your agents deserve better than brittle regex and prayer-based parsing.*