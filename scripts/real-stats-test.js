#!/usr/bin/env node

// REAL PARSERATOR STATS TEST - No bullshit, just math
const { default: fetch } = require('node-fetch');

const STATS_TESTS = [
  {
    name: "SIMPLE_INVOICE",
    input: "Invoice #123 Amount: $99.99 Date: 2024-01-01",
    schema: { invoice: "string", amount: "number", date: "string" }
  },
  {
    name: "CONTACT_CARD", 
    input: "John Smith Email: john@test.com Phone: 555-1234",
    schema: { name: "string", email: "string", phone: "string" }
  },
  {
    name: "MEDICAL_RECORD",
    input: "Patient: Johnson, Robert DOB: 03/15/1975 Diagnosis: Hypertension BP: 140/90",
    schema: { patient: "string", dob: "string", diagnosis: "string", bp: "string" }
  },
  {
    name: "CORRUPTED_TEXT",
    input: "lnv0ice: l23 Am0unt: $99.99 D4te: 2024-0l-0l",
    schema: { invoice: "string", amount: "number", date: "string" }
  },
  {
    name: "COMPLEX_DOCUMENT",
    input: "INVOICE #INV-2024-001 Customer: Acme Corp Address: 123 Main St Amount: $1,234.56 Tax: $98.77 Total: $1,333.33 Terms: Net 30",
    schema: { invoice: "string", customer: "string", address: "string", amount: "number", tax: "number", total: "number", terms: "string" }
  },
  {
    name: "EMPTY_DATA",
    input: "Just some random text with no relevant data",
    schema: { name: "string", email: "string", phone: "string" }
  },
  {
    name: "UNICODE_TEXT",
    input: "Nombre: José García Email: jose@ejemplo.com Teléfono: +34-123-456-789",
    schema: { name: "string", email: "string", phone: "string" }
  }
];

class RealStatsTest {
  constructor() {
    this.endpoint = "https://app-5108296280.us-central1.run.app/v1/parse";
    this.results = [];
  }
  
  async runStatsTest() {
    console.log("📊 REAL PARSERATOR STATISTICS TEST");
    console.log("Testing 7 scenarios for mathematical accuracy");
    console.log("=".repeat(60));
    
    for (let i = 0; i < STATS_TESTS.length; i++) {
      const test = STATS_TESTS[i];
      console.log(`\n${i+1}/7 Testing: ${test.name}`);
      console.log(`Input: ${test.input.substring(0, 60)}${test.input.length > 60 ? '...' : ''}`);
      console.log(`Expected fields: ${Object.keys(test.schema).length}`);
      
      const result = await this.testSingle(test);
      this.results.push(result);
      
      // Show immediate result
      if (result.success) {
        console.log(`✅ SUCCESS: ${result.responseTime}ms, ${result.tokensUsed} tokens, ${(result.confidence * 100).toFixed(1)}% confidence`);
        console.log(`Fields found: ${result.fieldsExtracted}/${result.totalFields} (${(result.accuracy * 100).toFixed(1)}%)`);
      } else {
        console.log(`❌ FAILED: ${result.error}`);
      }
    }
    
    this.calculateRealStats();
  }
  
  async testSingle(test) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputData: test.input,
          outputSchema: test.schema
        })
      });
      
      const result = await response.json();
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          name: test.name,
          success: false,
          error: `HTTP ${response.status}`,
          responseTime: responseTime
        };
      }
      
      // Calculate actual field extraction accuracy
      const expectedFields = Object.keys(test.schema);
      const extractedData = result.parsedData || {};
      const nonNullFields = expectedFields.filter(field => {
        const value = extractedData[field];
        return value !== null && value !== undefined && value !== "";
      });
      
      return {
        name: test.name,
        success: true,
        responseTime: responseTime,
        tokensUsed: result.metadata?.tokensUsed || 0,
        confidence: result.metadata?.confidence || 0,
        totalFields: expectedFields.length,
        fieldsExtracted: nonNullFields.length,
        accuracy: nonNullFields.length / expectedFields.length,
        data: extractedData,
        planSteps: result.metadata?.architectPlan?.steps?.length || 0
      };
    } catch (error) {
      return {
        name: test.name,
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
  
  calculateRealStats() {
    console.log("\n" + "=".repeat(80));
    console.log("📈 REAL MATHEMATICAL STATISTICS");
    console.log("=".repeat(80));
    
    const successfulResults = this.results.filter(r => r.success);
    const failedResults = this.results.filter(r => !r.success);
    
    console.log(`\n📊 SUCCESS RATE:`);
    console.log(`   Successful: ${successfulResults.length}/${this.results.length} (${(successfulResults.length / this.results.length * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${failedResults.length}/${this.results.length} (${(failedResults.length / this.results.length * 100).toFixed(1)}%)`);
    
    if (successfulResults.length === 0) {
      console.log("❌ No successful results to analyze");
      return;
    }
    
    // Calculate averages from successful results only
    const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
    const avgTokens = successfulResults.reduce((sum, r) => sum + r.tokensUsed, 0) / successfulResults.length;
    const avgConfidence = successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length;
    const avgAccuracy = successfulResults.reduce((sum, r) => sum + r.accuracy, 0) / successfulResults.length;
    const avgPlanSteps = successfulResults.reduce((sum, r) => sum + r.planSteps, 0) / successfulResults.length;
    
    // Calculate ranges
    const responseTimes = successfulResults.map(r => r.responseTime);
    const tokens = successfulResults.map(r => r.tokensUsed);
    const confidences = successfulResults.map(r => r.confidence);
    
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const minTokens = Math.min(...tokens);
    const maxTokens = Math.max(...tokens);
    const minConfidence = Math.min(...confidences);
    const maxConfidence = Math.max(...confidences);
    
    console.log(`\n⏱️  RESPONSE TIME STATISTICS:`);
    console.log(`   Average: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   Range: ${minResponseTime}ms - ${maxResponseTime}ms`);
    console.log(`   Standard deviation: ${this.calculateStdDev(responseTimes, avgResponseTime).toFixed(0)}ms`);
    
    console.log(`\n🔤 TOKEN USAGE STATISTICS:`);
    console.log(`   Average: ${avgTokens.toFixed(0)} tokens`);
    console.log(`   Range: ${minTokens} - ${maxTokens} tokens`);
    console.log(`   Standard deviation: ${this.calculateStdDev(tokens, avgTokens).toFixed(0)} tokens`);
    
    console.log(`\n🎯 CONFIDENCE STATISTICS:`);
    console.log(`   Average: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`   Range: ${(minConfidence * 100).toFixed(1)}% - ${(maxConfidence * 100).toFixed(1)}%`);
    console.log(`   Standard deviation: ${(this.calculateStdDev(confidences, avgConfidence) * 100).toFixed(1)}%`);
    
    console.log(`\n📊 FIELD EXTRACTION ACCURACY:`);
    console.log(`   Average accuracy: ${(avgAccuracy * 100).toFixed(1)}%`);
    console.log(`   Perfect extractions: ${successfulResults.filter(r => r.accuracy === 1).length}/${successfulResults.length}`);
    
    console.log(`\n🏗️  ARCHITECT PLANNING:`);
    console.log(`   Average steps per plan: ${avgPlanSteps.toFixed(1)}`);
    
    // Cost calculations
    const costPerToken = 0.00002; // $0.02 per 1K tokens
    const avgCostPerRequest = avgTokens * costPerToken;
    
    console.log(`\n💰 COST ANALYSIS:`);
    console.log(`   Average cost per request: $${avgCostPerRequest.toFixed(4)}`);
    console.log(`   Cost for 1,000 requests: $${(avgCostPerRequest * 1000).toFixed(2)}`);
    console.log(`   Cost for 10,000 requests: $${(avgCostPerRequest * 10000).toFixed(2)}`);
    
    // Detailed breakdown
    console.log(`\n📋 DETAILED RESULTS:`);
    successfulResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.name}:`);
      console.log(`      Time: ${result.responseTime}ms | Tokens: ${result.tokensUsed} | Confidence: ${(result.confidence * 100).toFixed(1)}% | Accuracy: ${(result.accuracy * 100).toFixed(1)}%`);
    });
    
    if (failedResults.length > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      failedResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name}: ${result.error} (${result.responseTime}ms)`);
      });
    }
    
    console.log(`\n🎯 MATHEMATICAL SUMMARY:`);
    console.log(`   Sample size: ${successfulResults.length} successful tests`);
    console.log(`   Average response time: ${avgResponseTime.toFixed(0)}ms ± ${this.calculateStdDev(responseTimes, avgResponseTime).toFixed(0)}ms`);
    console.log(`   Average token usage: ${avgTokens.toFixed(0)} ± ${this.calculateStdDev(tokens, avgTokens).toFixed(0)} tokens`);
    console.log(`   Average confidence: ${(avgConfidence * 100).toFixed(1)}% ± ${(this.calculateStdDev(confidences, avgConfidence) * 100).toFixed(1)}%`);
    console.log(`   Field extraction accuracy: ${(avgAccuracy * 100).toFixed(1)}%`);
  }
  
  calculateStdDev(values, mean) {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
}

// Run the real stats test
async function main() {
  const test = new RealStatsTest();
  await test.runStatsTest();
}

main().catch(console.error);
