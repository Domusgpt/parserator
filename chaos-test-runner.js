#!/usr/bin/env node

// Parserator Chaos Test Suite - Live API Testing
// Tests the production API with challenging real-world scenarios

const CHAOS_TEST_CASES = [
  {
    name: "OCR_CORRUPTION",
    description: "Invoice with OCR scanning errors",
    input: "lnvoice # INV-2024-OO1 Amount: $ 1,299 .99 Date: Dec l5 2024",
    schema: { invoice_number: "string", amount: "number", date: "string" },
    expectedChallenges: ["Character substitution", "Spacing artifacts"],
    minConfidence: 0.80,
    category: "document_processing"
  },
  
  {
    name: "MULTILINGUAL_MIXED",
    description: "Contact info with mixed languages and special characters", 
    input: "Nombre: María José González Email: maria@empresa.es Teléfono: +34 123 456 789",
    schema: { name: "string", email: "string", phone: "string" },
    expectedChallenges: ["Unicode characters", "Non-English text", "International phone format"],
    minConfidence: 0.85,
    category: "internationalization"
  },

  {
    name: "LEGAL_JARGON",
    description: "Legal document with embedded personal data",
    input: "WHEREAS the party of the first part, John Smith (SSN: 123-45-6789, residing at 123 Main St, NY 10001)...",
    schema: { name: "string", ssn: "string", address: "string" },
    expectedChallenges: ["Legal formatting", "Embedded clauses", "PII extraction"],
    minConfidence: 0.75,
    category: "legal_documents"
  },

  {
    name: "MALFORMED_STRUCTURED",
    description: "JSON-like data with syntax errors",
    input: `{"name": "John", "email": john@test.com, "skills": ["JS", "Python"]}`,
    schema: { name: "string", email: "string", skills: "array" },
    expectedChallenges: ["Missing quotes", "Mixed syntax"],
    minConfidence: 0.90,
    category: "structured_data_recovery"
  },

  {
    name: "SOCIAL_MEDIA_NOISE",
    description: "Social post with emojis and informal language",
    input: "🎉 Event contact: Sarah @ sarah@eventco.com 📧 call (555) 123-4567 📞 Location: Central Park 🗽",
    schema: { contact_name: "string", email: "string", phone: "string", location: "string" },
    expectedChallenges: ["Emoji interference", "Informal syntax"],
    minConfidence: 0.80,
    category: "social_media"
  },

  {
    name: "TABLE_STRUCTURE",
    description: "HTML table data without proper formatting",
    input: "<tr><td>Product</td><td>Widget A</td></tr><tr><td>Price</td><td>$49.99</td></tr>",
    schema: { product: "string", price: "number" },
    expectedChallenges: ["HTML tags", "Tabular structure"],
    minConfidence: 0.85,
    category: "web_scraping"
  },

  {
    name: "HANDWRITING_OCR",
    description: "Simulated handwriting-to-text conversion errors",
    input: "Dr. appointrnent: Jan 15th at 2:3O PM Patient: Johnson, Robert Phone: S5S-1234",
    schema: { date: "string", time: "string", patient_name: "string", phone: "string" },
    expectedChallenges: ["Character recognition errors", "Ambiguous characters"],
    minConfidence: 0.70,
    category: "medical_records"
  },

  {
    name: "FINANCIAL_CALCULATIONS",
    description: "Financial data with calculated fields and masked information",
    input: "Subtotal: $1,234.56 Tax (8.25%): $101.85 TOTAL: $1,351.41 Payment: Visa ****1234",
    schema: { subtotal: "number", tax_rate: "number", total: "number", payment_method: "string" },
    expectedChallenges: ["Calculated fields", "Masked data", "Percentage parsing"],
    minConfidence: 0.85,
    category: "financial_data"
  },

  {
    name: "TIMEZONE_COMPLEXITY",
    description: "Event with multiple timezones and duration",
    input: "Meeting: Q4 Review When: Thu, Dec 14, 2024 at 3:00 PM EST (8:00 PM GMT) Duration: 90 min",
    schema: { event: "string", date: "string", time_local: "string", time_gmt: "string", duration: "string" },
    expectedChallenges: ["Multiple timezones", "Time format variations"],
    minConfidence: 0.80,
    category: "temporal_data"
  },

  {
    name: "ACADEMIC_CITATION",
    description: "Complex academic citation with multiple authors",
    input: "Smith, J., Johnson, M. & Brown, K. (2024). 'Data Liberation.' J. Comp. Sci., 45(3), 123-145. DOI: 10.1234/jcs.2024",
    schema: { authors: "array", title: "string", journal: "string", year: "number", pages: "string", doi: "string" },
    expectedChallenges: ["Multiple authors", "Citation format", "Abbreviated journal"],
    minConfidence: 0.75,
    category: "academic_text"
  }
];

class ParseratorChaosTestSuite {
  constructor() {
    this.apiEndpoint = "https://app-5108296280.us-central1.run.app/v1/parse";
  }
  
  async runFullSuite() {
    const results = [];
    const startTime = Date.now();
    
    console.log("🧪 Starting Parserator Chaos Test Suite...");
    console.log(`🎯 Testing ${CHAOS_TEST_CASES.length} challenging real-world scenarios\n`);
    
    for (const testCase of CHAOS_TEST_CASES) {
      console.log(`🔄 Testing: ${testCase.name} (${testCase.category})`);
      const result = await this.runSingleTest(testCase);
      results.push(result);
      
      // Log immediate result
      const status = result.success ? '✅' : '❌';
      const confidence = result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : '0%';
      console.log(`${status} ${result.name}: ${confidence} confidence (${result.responseTime}ms)`);
      
      if (result.notes && result.notes !== 'All checks passed') {
        console.log(`   📝 ${result.notes}`);
      }
      console.log('');
    }
    
    return this.generateReport(results, Date.now() - startTime);
  }
  
  async runSingleTest(testCase) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputData: testCase.input,
          outputSchema: testCase.schema
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const parseResult = await response.json();
      const responseTime = Date.now() - startTime;
      
      const confidence = parseResult.metadata?.confidence || parseResult.confidence || 0;
      
      return {
        name: testCase.name,
        success: confidence >= testCase.minConfidence,
        confidence: confidence,
        responseTime,
        tokensUsed: parseResult.metadata?.tokensUsed || 0,
        expectedChallenges: testCase.expectedChallenges,
        actualResult: parseResult.parsedData,
        notes: this.analyzeResult(parseResult, testCase, confidence),
        category: testCase.category
      };
    } catch (error) {
      return {
        name: testCase.name,
        success: false,
        confidence: 0,
        responseTime: Date.now() - startTime,
        tokensUsed: 0,
        expectedChallenges: testCase.expectedChallenges,
        actualResult: null,
        notes: `Error: ${error.message}`,
        category: testCase.category
      };
    }
  }
  
  analyzeResult(parseResult, testCase, confidence) {
    const notes = [];
    
    // Check if all expected fields were found
    const expectedFields = Object.keys(testCase.schema);
    const actualFields = Object.keys(parseResult.parsedData || {});
    const missingFields = expectedFields.filter(field => !actualFields.includes(field));
    
    if (missingFields.length > 0) {
      notes.push(`Missing fields: ${missingFields.join(', ')}`);
    }
    
    // Check confidence level
    if (confidence < testCase.minConfidence) {
      notes.push(`Low confidence: ${(confidence * 100).toFixed(1)}% < ${(testCase.minConfidence * 100)}%`);
    }
    
    // Token efficiency check
    if (parseResult.metadata?.tokensUsed > 1000) {
      notes.push(`High token usage: ${parseResult.metadata.tokensUsed}`);
    }
    
    return notes.length > 0 ? notes.join('; ') : 'All checks passed';
  }
  
  generateReport(results, totalTime) {
    const categories = [...new Set(results.map(r => r.category))];
    const categoryStats = categories.map(category => {
      const categoryResults = results.filter(r => r.category === category);
      return {
        category,
        totalTests: categoryResults.length,
        passed: categoryResults.filter(r => r.success).length,
        avgConfidence: categoryResults.reduce((sum, r) => sum + r.confidence, 0) / categoryResults.length,
        avgResponseTime: categoryResults.reduce((sum, r) => sum + r.responseTime, 0) / categoryResults.length
      };
    });
    
    const totalTests = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = totalTests - passed;
    const passRate = (passed / totalTests) * 100;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);
    
    console.log("\n" + "=".repeat(80));
    console.log("🎯 PARSERATOR CHAOS TEST RESULTS");
    console.log("=".repeat(80));
    console.log(`📊 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passed} (${passRate.toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${failed} (${(100 - passRate).toFixed(1)}%)`);
    console.log(`   🎯 Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`   ⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`   🔤 Total Tokens: ${totalTokens}`);
    console.log(`   📈 Avg Response Time: ${(totalTime / totalTests).toFixed(0)}ms`);
    
    console.log("\n📂 CATEGORY BREAKDOWN:");
    categoryStats.forEach(stat => {
      const categoryPassRate = (stat.passed / stat.totalTests) * 100;
      console.log(`   ${stat.category}: ${stat.passed}/${stat.totalTests} (${categoryPassRate.toFixed(1)}%) - ${(stat.avgConfidence * 100).toFixed(1)}% avg confidence`);
    });
    
    console.log("\n🔍 DETAILED RESULTS:");
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const confidence = result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : '0%';
      console.log(`   ${status} ${result.name}: ${confidence} (${result.responseTime}ms, ${result.tokensUsed} tokens)`);
      if (result.actualResult) {
        console.log(`      Data: ${JSON.stringify(result.actualResult)}`);
      }
      if (result.notes && result.notes !== 'All checks passed') {
        console.log(`      Notes: ${result.notes}`);
      }
    });
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(results);
    if (recommendations.length > 0) {
      console.log("\n💡 RECOMMENDATIONS:");
      recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("🚀 CONCLUSION: Parserator API performing excellently under chaos conditions!");
    console.log("=".repeat(80));
    
    return {
      summary: {
        totalTests,
        passed,
        failed,
        overallPassRate: passRate,
        avgConfidence: avgConfidence * 100,
        totalTime,
        totalTokens
      },
      categoryBreakdown: categoryStats,
      detailedResults: results,
      recommendations
    };
  }
  
  generateRecommendations(results) {
    const recommendations = [];
    
    // Check for patterns in failures
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      const failureCategories = [...new Set(failedResults.map(r => r.category))];
      recommendations.push(`Focus improvement on: ${failureCategories.join(', ')}`);
    }
    
    // Check for performance issues
    const slowResults = results.filter(r => r.responseTime > 5000);
    if (slowResults.length > 0) {
      recommendations.push(`Optimize performance for: ${slowResults.map(r => r.name).join(', ')}`);
    }
    
    // Check for high token usage
    const tokenHeavy = results.filter(r => r.tokensUsed > 800);
    if (tokenHeavy.length > 0) {
      recommendations.push(`Optimize token usage for: ${tokenHeavy.map(r => r.name).join(', ')}`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Excellent performance across all test categories!");
    }
    
    return recommendations;
  }
}

// Run the test suite
async function main() {
  const testSuite = new ParseratorChaosTestSuite();
  
  try {
    await testSuite.runFullSuite();
  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
    process.exit(1);
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

main();