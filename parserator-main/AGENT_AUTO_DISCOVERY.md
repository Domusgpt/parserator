{
  "service": "parserator",
  "version": "1.0.0",
  "name": "Parserator - Structured Data Layer for AI Agents",
  "description": "Universal data parsing with 95% accuracy for any AI agent framework",
  "ema_compliant": true,
  "protocols": {
    "rest_api": {
      "endpoint": "https://app-5108296280.us-central1.run.app",
      "version": "v1",
      "authentication": "api_key",
      "currently_open": true,
      "documentation": "https://parserator-production.web.app/index-production-ready.html"
    },
    "mcp": {
      "server": "parserator-mcp-server",
      "install": "npm install -g parserator-mcp-server",
      "usage": "parserator-mcp-server YOUR_API_KEY",
      "documentation": "https://github.com/Domusgpt/parserator/tree/main/packages/mcp-server"
    },
    "websocket": {
      "endpoint": "wss://parserator-ws.herokuapp.com",
      "status": "coming_soon"
    }
  },
  "frameworks": {
    "google_adk": {
      "supported": true,
      "integration": "native",
      "example": "https://github.com/Domusgpt/parserator/blob/main/examples/agent-workflows/adk-integration.py"
    },
    "langchain": {
      "supported": true,
      "integration": "output_parser",
      "example": "https://github.com/Domusgpt/parserator/blob/main/examples/agent-workflows/langchain-integration.py"
    },
    "crewai": {
      "supported": true,
      "integration": "tool",
      "example": "https://github.com/Domusgpt/parserator/blob/main/examples/agent-workflows/crewai-integration.py"
    },
    "autogpt": {
      "supported": true,
      "integration": "plugin",
      "example": "https://github.com/Domusgpt/parserator/blob/main/examples/agent-workflows/autogpt-integration.py"
    },
    "custom": {
      "supported": true,
      "integration": "rest_api",
      "example": "https://github.com/Domusgpt/parserator/blob/main/examples/agent-workflows/custom-integration.py"
    }
  },
  "quick_start": {
    "test_endpoint": "https://app-5108296280.us-central1.run.app/v1/parse",
    "test_payload": {
      "inputData": "Hello world test message",
      "outputSchema": {
        "message": "string",
        "sentiment": "string"
      }
    },
    "expected_response": {
      "data": {
        "message": "Hello world test message",
        "sentiment": "positive"
      },
      "confidence": 0.95,
      "processing_time_ms": 1200
    }
  },
  "ema_principles": {
    "digital_sovereignty": {
      "data_ownership": "user",
      "export_capability": "complete",
      "data_retention": "user_controlled"
    },
    "portability_first": {
      "migration_tools": "provided",
      "standard_formats": ["json", "csv", "yaml", "xml"],
      "competitor_integrations": "supported"
    },
    "standards_agnostic": {
      "api_specification": "openapi_3.0",
      "data_formats": "universal",
      "protocols": ["http", "websocket", "mcp"]
    },
    "transparent_competition": {
      "competitor_comparison": "https://parserator-production.web.app/migration-guides/competitor-migration.html",
      "migration_assistance": "free",
      "wall_of_openness": "public"
    }
  },
  "integration_examples": {
    "one_liner": "curl -X POST https://app-5108296280.us-central1.run.app/v1/parse -d '{\"inputData\":\"test\",\"outputSchema\":{\"result\":\"string\"}}'",
    "python": "import requests; requests.post('https://app-5108296280.us-central1.run.app/v1/parse', json={'inputData': 'test', 'outputSchema': {'result': 'string'}})",
    "javascript": "fetch('https://app-5108296280.us-central1.run.app/v1/parse', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({inputData: 'test', outputSchema: {result: 'string'}})})",
    "node": "const axios = require('axios'); await axios.post('https://app-5108296280.us-central1.run.app/v1/parse', {inputData: 'test', outputSchema: {result: 'string'}})"
  },
  "discovery": {
    "last_updated": "2025-06-07T00:00:00Z",
    "discovery_url": "https://parserator-production.web.app/.well-known/parserator-discovery.json",
    "health_check": "https://app-5108296280.us-central1.run.app/health",
    "status_page": "https://status.parserator.com"
  },
  "support": {
    "documentation": "https://docs.parserator.com",
    "github": "https://github.com/Domusgpt/parserator",
    "discord": "https://discord.gg/parserator",
    "email": "support@parserator.com",
    "migration_help": "migration@parserator.com"
  }
}