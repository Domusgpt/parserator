#!/usr/bin/env node

// REAL COMPARISON: Parserator vs Manual Regex Parsing
// Shows actual token usage and response times

const { default: fetch } = require('node-fetch');

const TEST_CASES = [
  {
    name: "INVOICE_DATA",
    input: "Invoice #INV-2024-001 Amount: $1,234.56 Customer: Acme Corporation Date: 2024-01-15 Status: Paid",
    schema: { 
      invoice_number: "string", 
      amount: "number", 
      customer: "string", 
      date: "string", 
      status: "string" 
    },
    manualPatterns: {
      invoice_number: /Invoice #([A-Z0-9-]+)/,
      amount: /Amount: \$([0-9,]+\.?[0-9]*)/,
      customer: /Customer: ([^Date]+?)(?=\s+Date:)/,
      date: /Date: ([0-9-]+)/,
      status: /Status: (\w+)/
    }
  },
  {
    name: "CONTACT_CARD",
    input: "Dr. Sarah Johnson, PhD | Senior Engineer at TechCorp Inc. | sarah.j@techcorp.com | Phone: +1-555-123-4567 | Address: 123 Tech Street, San Francisco, CA 94105",
    schema: {
      title: "string",
      name: "string", 
      degree: "string",
      position: "string",
      company: "string",
      email: "string",
      phone: "string",
      address: "string"
    },
    manualPatterns: {
      title: /^(Dr\.|Mr\.|Ms\.|Mrs\.)/,
      name: /(Dr\.\s+)?([A-Z][a-z]+\s+[A-Z][a-z]+)/,
      degree: /(PhD|MD|MS|BS)/,
      position: /(\w+\s+\w+)\s+at/,
      company: /at\s+([^|]+?)\s+\|/,
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
      phone: /Phone:\s+([\+0-9-()]+)/,
      address: /Address:\s+(.+)/
    }
  }
];

class ManualVsParseratorTest {
  constructor() {
    this.parseratorEndpoint = "https://app-5108296280.us-central1.run.app/v1/parse";
  }
  
  async runComparison() {
    console.log("⚔️  REAL BATTLE: Parserator vs Manual Regex");
    console.log("Testing actual performance, accuracy, and complexity");
    console.log("=".repeat(60));
    
    for (const test of TEST_CASES) {
      console.log(`\n🎯 Testing: ${test.name}`);
      console.log(`   Input: ${test.input.substring(0, 80)}...`);
      console.log(`   Fields to extract: ${Object.keys(test.schema).length}`);
      
      // Test Parserator
      const parseratorResult = await this.testParserator(test);
      
      // Test Manual Regex
      const manualResult = this.testManualRegex(test);
      
      // Compare results
      this.compareResults(test, parseratorResult, manualResult);
    }
  }
  
  async testParserator(test) {
    const startTime = Date.now();
    
    try {
      console.log("\n🤖 Parserator (AI-Powered):");
      
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
      
      console.log(`   ✅ Success: ${response.ok}`);
      console.log(`   ⏱️  Time: ${responseTime}ms`);
      console.log(`   🔤 Tokens: ${result.metadata?.tokensUsed || 0}`);
      console.log(`   🎯 Confidence: ${((result.metadata?.confidence || 0) * 100).toFixed(1)}%`);
      console.log(`   📊 Result: ${JSON.stringify(result.parsedData, null, 2)}`);
      
      if (result.metadata?.architectPlan) {
        console.log(`   🏗️  Planning Steps: ${result.metadata.architectPlan.steps?.length || 0}`);
      }
      
      return {
        success: response.ok,
        responseTime: responseTime,
        tokensUsed: result.metadata?.tokensUsed || 0,
        confidence: result.metadata?.confidence || 0,
        data: result.parsedData,
        planSteps: result.metadata?.architectPlan?.steps?.length || 0
      };
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
  
  testManualRegex(test) {
    const startTime = Date.now();
    
    console.log("\n🔧 Manual Regex (Traditional):");
    
    try {
      const extractedData = {};
      let fieldsFound = 0;
      
      // Apply each regex pattern
      Object.keys(test.manualPatterns).forEach(field => {
        const pattern = test.manualPatterns[field];
        const match = test.input.match(pattern);
        
        if (match) {
          let value = match[1] || match[0];
          
          // Type conversion
          if (test.schema[field] === "number") {
            value = parseFloat(value.replace(/,/g, ''));
          }
          
          extractedData[field] = value;
          fieldsFound++;
        } else {
          extractedData[field] = null;
        }
      });
      
      const responseTime = Date.now() - startTime;
      const accuracy = fieldsFound / Object.keys(test.schema).length;
      
      console.log(`   ✅ Success: ${fieldsFound > 0}`);
      console.log(`   ⏱️  Time: ${responseTime}ms`);
      console.log(`   🔤 Tokens: 0 (no API calls)`);
      console.log(`   🎯 Accuracy: ${(accuracy * 100).toFixed(1)}% (${fieldsFound}/${Object.keys(test.schema).length} fields)`);
      console.log(`   📊 Result: ${JSON.stringify(extractedData, null, 2)}`);
      console.log(`   🔧 Patterns Used: ${Object.keys(test.manualPatterns).length}`);
      
      return {
        success: fieldsFound > 0,
        responseTime: responseTime,
        tokensUsed: 0,
        accuracy: accuracy,
        data: extractedData,
        fieldsFound: fieldsFound,
        patternsUsed: Object.keys(test.manualPatterns).length
      };
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
  
  compareResults(test, parserator, manual) {
    console.log(`\n📊 HEAD-TO-HEAD COMPARISON:`);
    console.log(`   Test: ${test.name}`);
    
    if (parserator.success && manual.success) {
      console.log(`\n   ⚡ SPEED:`);
      console.log(`     Parserator: ${parserator.responseTime}ms`);
      console.log(`     Manual: ${manual.responseTime}ms`);
      const speedWinner = parserator.responseTime < manual.responseTime ? 'Parserator' : 'Manual';
      console.log(`     Winner: ${speedWinner}`);
      
      console.log(`\n   💰 COST:`);
      console.log(`     Parserator: ${parserator.tokensUsed} tokens`);
      console.log(`     Manual: ${manual.tokensUsed} tokens (free)`);
      console.log(`     Winner: Manual (no API costs)`);
      
      console.log(`\n   🎯 ACCURACY:`);
      console.log(`     Parserator: ${(parserator.confidence * 100).toFixed(1)}% confidence`);
      console.log(`     Manual: ${(manual.accuracy * 100).toFixed(1)}% field accuracy`);
      const accuracyWinner = parserator.confidence > manual.accuracy ? 'Parserator' : 'Manual';
      console.log(`     Winner: ${accuracyWinner}`);
      
      console.log(`\n   🔧 COMPLEXITY:`);
      console.log(`     Parserator: ${parserator.planSteps} auto-generated steps`);
      console.log(`     Manual: ${manual.patternsUsed} hand-written regex patterns`);
      
      console.log(`\n   📈 DATA QUALITY:`);
      this.compareDataQuality(parserator.data, manual.data, test.schema);
      
    } else {
      console.log(`     Parserator: ${parserator.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`     Manual: ${manual.success ? 'SUCCESS' : 'FAILED'}`);
    }
  }
  
  compareDataQuality(parseratorData, manualData, schema) {
    const fields = Object.keys(schema);
    let parseratorScore = 0;
    let manualScore = 0;
    
    fields.forEach(field => {
      const pValue = parseratorData?.[field];
      const mValue = manualData?.[field];
      
      // Score based on whether field was extracted and looks correct
      if (pValue && pValue !== null) parseratorScore++;
      if (mValue && mValue !== null) manualScore++;
      
      console.log(`     ${field}: Parserator="${pValue}" vs Manual="${mValue}"`);
    });
    
    console.log(`\n   🏆 DATA EXTRACTION SCORE:`);
    console.log(`     Parserator: ${parseratorScore}/${fields.length} fields`);
    console.log(`     Manual: ${manualScore}/${fields.length} fields`);
    
    if (parseratorScore > manualScore) {
      console.log(`     🥇 Winner: Parserator (better extraction)`);
    } else if (manualScore > parseratorScore) {
      console.log(`     🥇 Winner: Manual (better extraction)`);
    } else {
      console.log(`     🤝 Tie (equal extraction quality)`);
    }
  }
}

// Run the real comparison
async function main() {
  const test = new ManualVsParseratorTest();
  await test.runComparison();
}

main().catch(console.error);