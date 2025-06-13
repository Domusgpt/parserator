# 🔌 PARSERATOR INTEGRATION TEMPLATES

## 🤖 LangChain Integration (HIGHEST PRIORITY)

```python
# parserator_langchain.py
from typing import Any, Dict, Optional
from langchain.tools import BaseTool
from langchain.callbacks.manager import CallbackManagerForToolRun
import requests

class ParseratorTool(BaseTool):
    """Parse unstructured data into clean JSON using AI"""
    
    name = "parserator"
    description = """
    Use this tool when you need to extract structured data from messy, unstructured text.
    Perfect for: emails, PDFs, invoices, web pages, CSV data, forms, documents.
    Input: raw text data and desired output schema
    Output: clean, structured JSON matching your schema
    """
    
    api_key: str
    base_url: str = "https://us-central1-parserator-production.cloudfunctions.net/app"
    
    def _run(
        self,
        input_data: str,
        output_schema: Dict[str, Any],
        run_manager: Optional[CallbackManagerForToolRun] = None
    ) -> Dict[str, Any]:
        """Parse data using Parserator API"""
        
        response = requests.post(
            f"{self.base_url}/v1/parse",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "inputData": input_data,
                "outputSchema": output_schema
            }
        )
        
        result = response.json()
        if result.get("success"):
            return result["parsedData"]
        else:
            raise Exception(f"Parsing failed: {result.get('error')}")
    
    async def _arun(self, *args, **kwargs):
        """Async version - implement if needed"""
        raise NotImplementedError("Async not implemented yet")

# Usage Example
from langchain.agents import initialize_agent, AgentType
from langchain.llms import OpenAI

# Create the Parserator tool
parserator = ParseratorTool(api_key="your_api_key")

# Create an agent with Parserator
llm = OpenAI(temperature=0)
tools = [parserator]
agent = initialize_agent(
    tools, 
    llm, 
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

# Now the agent can parse any data!
result = agent.run("""
    Parse this email and extract the contact info:
    
    Hey there,
    
    My name is John Smith and I work at Acme Corp.
    You can reach me at john@acme.com or call 555-1234.
    Our office is at 123 Main St, San Francisco, CA 94105.
    
    Best,
    John
    
    Extract: name, email, phone, company, address
""")
```

## 🔗 OpenAI Function Calling

```json
{
  "name": "parserator",
  "description": "Parse unstructured data into structured JSON format",
  "parameters": {
    "type": "object",
    "properties": {
      "input_data": {
        "type": "string",
        "description": "The raw, unstructured data to parse (text, CSV, email, etc)"
      },
      "output_schema": {
        "type": "object",
        "description": "The desired structure for the output JSON",
        "additionalProperties": {
          "type": "string",
          "enum": ["string", "number", "boolean", "array", "object", "email", "phone", "date", "currency"]
        }
      }
    },
    "required": ["input_data", "output_schema"]
  }
}
```

## ⚡ Zapier Integration Spec

```javascript
// zapier/index.js
const zapier = require('zapier-platform-core');

const ParseDataAction = {
  key: 'parse_data',
  noun: 'Parsed Data',
  display: {
    label: 'Parse Unstructured Data',
    description: 'Transform messy data into clean JSON'
  },
  
  operation: {
    inputFields: [
      {
        key: 'input_data',
        label: 'Input Data',
        type: 'text',
        required: true,
        helpText: 'The messy data you want to parse'
      },
      {
        key: 'output_schema',
        label: 'Output Schema', 
        type: 'string',
        required: true,
        dict: true,
        helpText: 'Define the structure you want'
      }
    ],
    
    perform: async (z, bundle) => {
      const response = await z.request({
        url: 'https://api.parserator.com/v1/parse',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bundle.authData.api_key}`
        },
        body: {
          inputData: bundle.inputData.input_data,
          outputSchema: bundle.inputData.output_schema
        }
      });
      
      return response.json.parsedData;
    }
  }
};
```

## 🚀 Vercel Edge Function

```typescript
// api/parse.ts
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { inputData, outputSchema } = await req.json();
  
  const response = await fetch('https://api.parserator.com/v1/parse', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PARSERATOR_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputData, outputSchema }),
  });
  
  const result = await response.json();
  
  return NextResponse.json(result);
}
```

## 🎯 React Hook

```typescript
// use-parserator.ts
import { useState, useCallback } from 'react';

interface ParseOptions {
  inputData: string;
  outputSchema: Record<string, string>;
}

export function useParserator(apiKey: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);
  
  const parse = useCallback(async (options: ParseOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://api.parserator.com/v1/parse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.parsedData);
        return result.parsedData;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiKey]);
  
  return { parse, data, loading, error };
}

// Usage
function MyComponent() {
  const { parse, data, loading } = useParserator('your-api-key');
  
  const handleParse = async () => {
    await parse({
      inputData: 'John Doe, john@example.com, 555-1234',
      outputSchema: {
        name: 'string',
        email: 'email',
        phone: 'phone'
      }
    });
  };
  
  return (
    <div>
      <button onClick={handleParse} disabled={loading}>
        Parse Data
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

## 🤖 AutoGPT Plugin

```yaml
# parserator_plugin.yaml
name: Parserator
description: Parse any unstructured data into clean JSON
version: 1.0.0
author: Parserator Team

commands:
  - name: parse_data
    description: Extract structured data from messy text
    parameters:
      input_data:
        type: string
        description: The raw data to parse
        required: true
      output_schema:
        type: object
        description: Desired output structure
        required: true
    
    execute: |
      import requests
      
      response = requests.post(
        'https://api.parserator.com/v1/parse',
        headers={'Authorization': f'Bearer {env.PARSERATOR_API_KEY}'},
        json={
          'inputData': params['input_data'],
          'outputSchema': params['output_schema']
        }
      )
      
      result = response.json()
      return result['parsedData'] if result['success'] else None
```

## 📊 Common Testing Scenarios

```javascript
// test-scenarios.js

const testCases = [
  {
    name: "Email Parsing",
    input: `
      From: sarah@company.com
      To: team@ourcompany.com
      Subject: Q4 Planning Meeting
      
      Hi team,
      
      Let's meet next Tuesday at 2pm in Conference Room A.
      Please review the attached quarterly report before the meeting.
      
      Agenda:
      - Budget review
      - Team expansion plans
      - Product roadmap
      
      Thanks,
      Sarah Johnson
      VP of Engineering
      (415) 555-0123
    `,
    schema: {
      from: "email",
      to: "email", 
      subject: "string",
      meeting_time: "string",
      location: "string",
      agenda_items: "string_array",
      sender_name: "string",
      sender_title: "string",
      sender_phone: "phone"
    }
  },
  
  {
    name: "Invoice Processing",
    input: `
      INVOICE #2024-1234
      Date: March 15, 2024
      
      Bill To:
      Acme Corporation
      123 Business Ave
      San Francisco, CA 94105
      
      Items:
      - Professional Services: $5,000
      - Software License (Annual): $12,000
      - Support Package: $3,000
      
      Subtotal: $20,000
      Tax (8.5%): $1,700
      Total Due: $21,700
      
      Payment Terms: Net 30
    `,
    schema: {
      invoice_number: "string",
      date: "date",
      company_name: "string",
      address: "string",
      line_items: "array",
      subtotal: "currency",
      tax: "currency",
      total: "currency",
      payment_terms: "string"
    }
  },
  
  {
    name: "Product Catalog",
    input: `
      SKU: LAPTOP-001
      Name: ProBook Elite 15"
      Price: $1,299.99
      In Stock: Yes (47 units)
      
      Specs:
      • Intel Core i7-12700H
      • 16GB DDR5 RAM  
      • 512GB NVMe SSD
      • 15.6" 4K Display
      • Windows 11 Pro
      
      SKU: MOUSE-042
      Name: Wireless Ergonomic Mouse
      Price: $79.99
      In Stock: No (Restocking soon)
    `,
    schema: {
      products: [{
        sku: "string",
        name: "string",
        price: "currency",
        in_stock: "boolean",
        stock_quantity: "number",
        specifications: "string_array"
      }]
    }
  }
];

// Run all tests
async function runTests(apiKey) {
  for (const test of testCases) {
    console.log(`\n🧪 Testing: ${test.name}`);
    
    const result = await fetch('https://api.parserator.com/v1/parse', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputData: test.input,
        outputSchema: test.schema
      })
    }).then(r => r.json());
    
    console.log('✅ Result:', JSON.stringify(result.parsedData, null, 2));
  }
}
```

## 🚀 Quick Start Examples

```bash
# 1. Parse CSV to JSON
curl -X POST https://api.parserator.com/v1/parse \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "name,email,age\nJohn,john@example.com,30\nSarah,sarah@test.com,25",
    "outputSchema": {
      "users": [{
        "name": "string",
        "email": "email",
        "age": "number"
      }]
    }
  }'

# 2. Extract from messy text
curl -X POST https://api.parserator.com/v1/parse \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "inputData": "Call me at 555-1234 or email john@example.com",
    "outputSchema": {
      "phone": "phone",
      "email": "email"
    }
  }'

# 3. Parse web content
curl -X POST https://api.parserator.com/v1/parse \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "inputData": "<h1>Product Name</h1><p>Price: $99.99</p><p>In stock</p>",
    "outputSchema": {
      "title": "string",
      "price": "currency",
      "available": "boolean"
    }
  }'
```

## 🎯 NEXT STEPS

1. **Test the API** (once deployment completes)
2. **Implement LangChain integration** (highest impact)
3. **Create 10 example use cases**
4. **Build Zapier integration**
5. **Launch on all platforms**