#!/usr/bin/env node

// SIMPLE WORKING TEST - Actually tests and shows results
const { default: fetch } = require('node-fetch');

const SIMPLE_TESTS = [
  {
    name: "BASIC_INVOICE",
    input: "Invoice #123 Amount: $99.99 Date: 2024-01-01",
    schema: { invoice: "string", amount: "number", date: "string" }
  },
  {
    name: "CORRUPTED_OCR", 
    input: "lnv0ice #l23 Am0unt: $99.99 D4te: 2024-0l-0l",
    schema: { invoice: "string", amount: "number", date: "string" }
  },
  {
    name: "IMPOSSIBLE_REQUEST",
    input: "Just random text with no data",
    schema: { credit_card: "string", password: "string", secret: "string" }
  },
  {
    name: "MASSIVE_TEXT",
    input: "Name: " + "X".repeat(1000) + " Email: test@example.com",
    schema: { name: "string", email: "string" }
  },
  {
    name: "UNICODE_CHAOS",
    input: "Name: José María Ñoño Email: josé@méxico.com Phone: +1-555-1234",
    schema: { name: "string", email: "string", phone: "string" }
  }
];

async function testParserator(testCase) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   Input: ${testCase.input.substring(0, 50)}${testCase.input.length > 50 ? '...' : ''}`);
    
    const response = await fetch("https://app-5108296280.us-central1.run.app/v1/parse", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputData: testCase.input,
        outputSchema: testCase.schema
      })
    });
    
    const result = await response.json();
    const responseTime = Date.now() - startTime;
    const confidence = result.metadata?.confidence || 0;
    
    console.log(`   ✅ Status: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   🎯 Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`   ⏱️  Time: ${responseTime}ms`);
    console.log(`   🔤 Tokens: ${result.metadata?.tokensUsed || 0}`);
    console.log(`   📊 Result: ${JSON.stringify(result.parsedData)}`);
    
    if (result.metadata?.architectPlan) {
      console.log(`   🏗️  Plan Steps: ${result.metadata.architectPlan.steps?.length || 0}`);
      if (result.metadata.architectPlan.steps?.[0]) {
        console.log(`   📋 First Step: ${result.metadata.architectPlan.steps[0].instruction}`);
      }
    }
    
    return {
      name: testCase.name,
      success: response.ok,
      confidence: confidence,
      responseTime: responseTime,
      tokensUsed: result.metadata?.tokensUsed || 0,
      result: result.parsedData,
      planSteps: result.metadata?.architectPlan?.steps?.length || 0
    };
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return {
      name: testCase.name,
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function runAllTests() {
  console.log("🔬 PARSERATOR REAL WORKING TESTS");
  console.log("=" + "=".repeat(50));
  
  const results = [];
  
  for (const test of SIMPLE_TESTS) {
    const result = await testParserator(test);
    results.push(result);
  }
  
  // Summary
  console.log("\n📊 SUMMARY:");
  const successful = results.filter(r => r.success).length;
  console.log(`   Successful: ${successful}/${results.length}`);
  
  const avgTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;
  const totalTokens = results.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
  console.log(`   Avg Time: ${avgTime.toFixed(0)}ms`);
  console.log(`   Total Tokens: ${totalTokens}`);
  
  console.log("\n🏗️  ARCHITECT PATTERN ANALYSIS:");
  results.forEach(r => {
    if (r.planSteps) {
      console.log(`   ${r.name}: ${r.planSteps} planning steps`);
    }
  });
}

runAllTests().catch(console.error);