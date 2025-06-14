#!/usr/bin/env node

// Debug single test to see API response  
const { default: fetch } = require('node-fetch');

async function debugTest() {
  const apiEndpoint = "https://app-5108296280.us-central1.run.app/v1/parse";
  
  const testCase = {
    name: "OCR_CORRUPTION",
    input: "lnvoice # INV-2024-OO1 Amount: $ 1,299 .99 Date: Dec l5 2024",
    schema: { invoice_number: "string", amount: "number", date: "string" },
    minConfidence: 0.80
  };
  
  console.log("🔍 Debug Test - Raw API Response");
  console.log("Input:", testCase.input);
  console.log("Schema:", testCase.schema);
  
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputData: testCase.input,
        outputSchema: testCase.schema
      })
    });
    
    const parseResult = await response.json();
    
    console.log("\n📄 Raw API Response:");
    console.log(JSON.stringify(parseResult, null, 2));
    
    console.log("\n🎯 Analysis:");
    console.log("Confidence:", parseResult.confidence);
    console.log("Type of confidence:", typeof parseResult.confidence);
    console.log("Min confidence:", testCase.minConfidence);
    console.log("Pass test?", parseResult.confidence >= testCase.minConfidence);
    console.log("Parsed Data:", parseResult.parsedData);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

debugTest();