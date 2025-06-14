#!/usr/bin/env node

// ACTUAL REAL TEST - No simulation, real API calls only
const { default: fetch } = require('node-fetch');

const REAL_TESTS = [
  {
    name: "SIMPLE_INVOICE",
    input: "Invoice #123 Amount: $99.99 Customer: Acme Corp Date: 2024-01-01",
    schema: { invoice: "string", amount: "number", customer: "string", date: "string" }
  },
  {
    name: "CONTACT_INFO", 
    input: "John Smith email: john@example.com phone: 555-1234 company: TechCorp",
    schema: { name: "string", email: "string", phone: "string", company: "string" }
  }
];

class ActualRealTest {
  constructor() {
    this.parseratorEndpoint = "https://app-5108296280.us-central1.run.app/v1/parse";
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }
  
  async runActualTest() {
    console.log("🔬 ACTUAL REAL API COMPARISON TEST");
    console.log("No simulations - only real API calls");
    console.log("=".repeat(50));
    
    if (!this.openaiApiKey) {
      console.log("❌ No OPENAI_API_KEY - cannot run real comparison");
      return;
    }
    
    for (const test of REAL_TESTS) {
      console.log(`\n🎯 Testing: ${test.name}`);
      console.log(`   Input: ${test.input}`);
      
      // Test Parserator - REAL API CALL
      console.log("\n📡 Calling Parserator API...");
      const parseratorResult = await this.callParseratorAPI(test);
      
      // Test OpenAI - REAL API CALL  
      console.log("📡 Calling OpenAI API...");
      const openaiResult = await this.callOpenAIAPI(test);
      
      // Show actual results
      this.showActualResults(test.name, parseratorResult, openaiResult);
    }
  }
  
  async callParseratorAPI(test) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.parseratorEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputData: test.input,
          outputSchema: test.schema
        })
      });
      
      const result = await response.json();
      const responseTime = Date.now() - startTime;
      
      console.log(`   ✅ Parserator: ${response.status} in ${responseTime}ms`);
      console.log(`   📊 Tokens: ${result.metadata?.tokensUsed || 0}`);
      console.log(`   🎯 Confidence: ${((result.metadata?.confidence || 0) * 100).toFixed(1)}%`);
      console.log(`   📄 Data: ${JSON.stringify(result.parsedData)}`);
      
      return {
        success: response.ok,
        responseTime: responseTime,
        tokensUsed: result.metadata?.tokensUsed || 0,
        confidence: result.metadata?.confidence || 0,
        data: result.parsedData,
        error: result.error || null
      };
    } catch (error) {
      console.log(`   ❌ Parserator ERROR: ${error.message}`);
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
  
  async callOpenAIAPI(test) {
    const startTime = Date.now();
    
    try {
      // Create schema for OpenAI structured outputs
      const properties = {};
      Object.keys(test.schema).forEach(key => {
        if (test.schema[key] === "string") {
          properties[key] = { type: "string" };
        } else if (test.schema[key] === "number") {
          properties[key] = { type: "number" };
        }
      });
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system", 
              content: "Extract structured data from text. Return valid JSON."
            },
            {
              role: "user",
              content: test.input
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "extracted_data",
              schema: {
                type: "object",
                properties: properties,
                required: Object.keys(test.schema),
                additionalProperties: false
              }
            }
          }
        })
      });
      
      const result = await response.json();
      const responseTime = Date.now() - startTime;
      
      if (result.error) {
        console.log(`   ❌ OpenAI ERROR: ${result.error.message}`);
        return {
          success: false,
          error: result.error.message,
          responseTime: responseTime
        };
      }
      
      const parsedData = JSON.parse(result.choices[0].message.content);
      
      console.log(`   ✅ OpenAI: ${response.status} in ${responseTime}ms`);
      console.log(`   📊 Tokens: ${result.usage?.total_tokens || 0}`);
      console.log(`   📄 Data: ${JSON.stringify(parsedData)}`);
      
      return {
        success: response.ok,
        responseTime: responseTime,
        tokensUsed: result.usage?.total_tokens || 0,
        data: parsedData,
        confidence: this.calculateDataCompleteness(parsedData, test.schema)
      };
    } catch (error) {
      console.log(`   ❌ OpenAI ERROR: ${error.message}`);
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
  
  calculateDataCompleteness(data, schema) {
    const expectedFields = Object.keys(schema);
    const actualFields = Object.keys(data || {});
    const nonNullFields = actualFields.filter(field => data[field] !== null && data[field] !== "");
    return nonNullFields.length / expectedFields.length;
  }
  
  showActualResults(testName, parserator, openai) {
    console.log(`\n📈 ACTUAL RESULTS FOR ${testName}:`);
    
    if (parserator.success && openai.success) {
      console.log(`   Speed: Parserator ${parserator.responseTime}ms vs OpenAI ${openai.responseTime}ms`);
      console.log(`   Tokens: Parserator ${parserator.tokensUsed} vs OpenAI ${openai.tokensUsed}`);
      console.log(`   Quality: Parserator ${(parserator.confidence * 100).toFixed(1)}% vs OpenAI ${(openai.confidence * 100).toFixed(1)}%`);
      
      // Calculate real token reduction
      if (openai.tokensUsed > 0) {
        const reduction = ((openai.tokensUsed - parserator.tokensUsed) / openai.tokensUsed * 100);
        console.log(`   Token Reduction: ${reduction.toFixed(1)}%`);
      }
      
      // Show data accuracy
      console.log(`   Parserator Data: ${JSON.stringify(parserator.data)}`);
      console.log(`   OpenAI Data: ${JSON.stringify(openai.data)}`);
      
    } else {
      console.log(`   Parserator: ${parserator.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   OpenAI: ${openai.success ? 'SUCCESS' : 'FAILED'}`);
    }
  }
}

// Run actual test
async function main() {
  const test = new ActualRealTest();
  await test.runActualTest();
}

main().catch(console.error);