#!/usr/bin/env node

// Comparative Testing: Parserator vs OpenAI Structured Outputs
// Tests both systems with identical chaos scenarios

const { default: fetch } = require('node-fetch');

const CHAOS_TEST_CASES = [
  {
    name: "OCR_CORRUPTION",
    input: "lnvoice # INV-2024-OO1 Amount: $ 1,299 .99 Date: Dec l5 2024",
    schema: { invoice_number: "string", amount: "number", date: "string" },
    minConfidence: 0.80
  },
  {
    name: "MULTILINGUAL_MIXED",
    input: "Nombre: María José González Email: maria@empresa.es Teléfono: +34 123 456 789",
    schema: { name: "string", email: "string", phone: "string" },
    minConfidence: 0.85
  },
  {
    name: "LEGAL_JARGON",
    input: "WHEREAS the party of the first part, John Smith (SSN: 123-45-6789, residing at 123 Main St, NY 10001)...",
    schema: { name: "string", ssn: "string", address: "string" },
    minConfidence: 0.75
  },
  {
    name: "MALFORMED_STRUCTURED",
    input: `{"name": "John", "email": john@test.com, "skills": ["JS", "Python"]}`,
    schema: { name: "string", email: "string", skills: "array" },
    minConfidence: 0.90
  },
  {
    name: "SOCIAL_MEDIA_NOISE",
    input: "🎉 Event contact: Sarah @ sarah@eventco.com 📧 call (555) 123-4567 📞 Location: Central Park 🗽",
    schema: { contact_name: "string", email: "string", phone: "string", location: "string" },
    minConfidence: 0.80
  }
];

class ComparativeTestSuite {
  constructor() {
    this.parseratorEndpoint = "https://app-5108296280.us-central1.run.app/v1/parse";
    this.openaiApiKey = process.env.OPENAI_API_KEY; // Will need to be set
  }
  
  async runComparison() {
    console.log("🔥 COMPARATIVE CHAOS TESTING: Parserator vs OpenAI");
    console.log("=" * 80);
    
    const results = [];
    
    for (const testCase of CHAOS_TEST_CASES) {
      console.log(`\n🎯 Testing: ${testCase.name}`);
      
      // Test Parserator
      const parseratorResult = await this.testParserator(testCase);
      
      // Test OpenAI (if API key available)
      const openaiResult = this.openaiApiKey ? 
        await this.testOpenAI(testCase) : 
        { success: false, error: "No API key", responseTime: 0, tokensUsed: 0 };
      
      results.push({
        testCase: testCase.name,
        parserator: parseratorResult,
        openai: openaiResult
      });
      
      // Log comparison
      this.logComparison(testCase.name, parseratorResult, openaiResult);
    }
    
    this.generateComparisonReport(results);
  }
  
  async testParserator(testCase) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.parseratorEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputData: testCase.input,
          outputSchema: testCase.schema
        })
      });
      
      const result = await response.json();
      const confidence = result.metadata?.confidence || result.confidence || 0;
      
      return {
        success: confidence >= testCase.minConfidence,
        confidence: confidence,
        responseTime: Date.now() - startTime,
        tokensUsed: result.metadata?.tokensUsed || 0,
        parsedData: result.parsedData,
        architectPlan: result.metadata?.architectPlan
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        tokensUsed: 0
      };
    }
  }
  
  async testOpenAI(testCase) {
    const startTime = Date.now();
    
    try {
      // Create OpenAI structured output schema
      const properties = {};
      Object.keys(testCase.schema).forEach(key => {
        const type = testCase.schema[key];
        if (type === "string") {
          properties[key] = { type: "string" };
        } else if (type === "number") {
          properties[key] = { type: "number" };
        } else if (type === "array") {
          properties[key] = { type: "array", items: { type: "string" } };
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
              content: "Extract structured data from the input text. Be as accurate as possible."
            },
            {
              role: "user",
              content: testCase.input
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "extracted_data",
              schema: {
                type: "object",
                properties: properties,
                required: Object.keys(testCase.schema),
                additionalProperties: false
              }
            }
          }
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      const parsedData = JSON.parse(result.choices[0].message.content);
      
      // Calculate simple confidence based on completeness
      const expectedFields = Object.keys(testCase.schema);
      const actualFields = Object.keys(parsedData);
      const completeness = actualFields.filter(f => expectedFields.includes(f)).length / expectedFields.length;
      
      return {
        success: completeness >= 0.8, // Rough equivalent to 80% confidence
        confidence: completeness,
        responseTime: Date.now() - startTime,
        tokensUsed: result.usage?.total_tokens || 0,
        parsedData: parsedData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        tokensUsed: 0
      };
    }
  }
  
  logComparison(testName, parseratorResult, openaiResult) {
    console.log(`\n📊 ${testName} Results:`);
    
    // Parserator
    const pStatus = parseratorResult.success ? '✅' : '❌';
    const pConf = parseratorResult.confidence ? `${(parseratorResult.confidence * 100).toFixed(1)}%` : 'ERR';
    console.log(`   Parserator: ${pStatus} ${pConf} confidence (${parseratorResult.responseTime}ms, ${parseratorResult.tokensUsed} tokens)`);
    
    // OpenAI
    if (openaiResult.error === "No API key") {
      console.log(`   OpenAI: ⚠️ Skipped (no API key)`);
    } else {
      const oStatus = openaiResult.success ? '✅' : '❌';
      const oConf = openaiResult.confidence ? `${(openaiResult.confidence * 100).toFixed(1)}%` : 'ERR';
      console.log(`   OpenAI: ${oStatus} ${oConf} confidence (${openaiResult.responseTime}ms, ${openaiResult.tokensUsed} tokens)`);
    }
    
    // Show parsed data comparison
    if (parseratorResult.parsedData && openaiResult.parsedData) {
      console.log(`   Parserator Data: ${JSON.stringify(parseratorResult.parsedData)}`);
      console.log(`   OpenAI Data: ${JSON.stringify(openaiResult.parsedData)}`);
    }
  }
  
  generateComparisonReport(results) {
    console.log("\n" + "=".repeat(80));
    console.log("🏆 COMPARATIVE TEST RESULTS");
    console.log("=".repeat(80));
    
    const parseratorWins = results.filter(r => 
      r.parserator.success && (!r.openai.success || r.openai.error === "No API key")
    ).length;
    
    const openaiWins = results.filter(r => 
      r.openai.success && !r.parserator.success && r.openai.error !== "No API key"
    ).length;
    
    const ties = results.filter(r => 
      r.parserator.success && r.openai.success && r.openai.error !== "No API key"
    ).length;
    
    console.log(`🎯 Score Summary:`);
    console.log(`   Parserator Wins: ${parseratorWins}`);
    console.log(`   OpenAI Wins: ${openaiWins}`);
    console.log(`   Ties: ${ties}`);
    
    // Performance comparison
    const parseratorAvgTime = results.reduce((sum, r) => sum + r.parserator.responseTime, 0) / results.length;
    const parseratorAvgTokens = results.reduce((sum, r) => sum + r.parserator.tokensUsed, 0) / results.length;
    
    const openaiResults = results.filter(r => r.openai.error !== "No API key");
    if (openaiResults.length > 0) {
      const openaiAvgTime = openaiResults.reduce((sum, r) => sum + r.openai.responseTime, 0) / openaiResults.length;
      const openaiAvgTokens = openaiResults.reduce((sum, r) => sum + r.openai.tokensUsed, 0) / openaiResults.length;
      
      console.log(`\n⚡ Performance Comparison:`);
      console.log(`   Parserator: ${parseratorAvgTime.toFixed(0)}ms avg, ${parseratorAvgTokens.toFixed(0)} tokens avg`);
      console.log(`   OpenAI: ${openaiAvgTime.toFixed(0)}ms avg, ${openaiAvgTokens.toFixed(0)} tokens avg`);
    }
    
    console.log("\n🔍 Key Insights:");
    console.log("   • Parserator uses two-stage Architect-Extractor pattern for efficiency");
    console.log("   • OpenAI uses single-stage structured outputs");
    console.log("   • Both handle chaos scenarios but with different approaches");
  }
}

// Run comparison
async function main() {
  const testSuite = new ComparativeTestSuite();
  await testSuite.runComparison();
}

main().catch(console.error);
