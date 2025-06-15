#!/usr/bin/env node

// Adversarial Testing Suite - Designed to Break Parserator
// Tests edge cases, malicious inputs, and system limits

const { default: fetch } = require('node-fetch');

const ADVERSARIAL_TEST_CASES = [
  {
    name: "MASSIVE_TEXT_BOMB",
    description: "Extremely long text to test token limits",
    input: "Invoice: " + "A".repeat(10000) + " Amount: $999.99 Date: 2024",
    schema: { invoice: "string", amount: "number", date: "string" },
    expectedFailure: "token_limit_exceeded",
    category: "resource_exhaustion"
  },
  
  {
    name: "UNICODE_NIGHTMARE",
    description: "Complex Unicode, RTL text, and invisible characters",
    input: "‮Name: רתיתק רתיתק‬ Email: test@‮moc.elpmaxe‬ Phone: ‍‌‍‌‍555-1234‍‌‍‌‍",
    schema: { name: "string", email: "string", phone: "string" },
    expectedFailure: "unicode_confusion",
    category: "encoding_attacks"
  },
  
  {
    name: "INFINITE_NESTING",
    description: "Deeply nested structure to break parsing",
    input: "{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{Name: John}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}",
    schema: { name: "string" },
    expectedFailure: "structure_complexity",
    category: "structure_attacks"
  },
  
  {
    name: "NULL_BYTE_INJECTION",
    description: "Null bytes and control characters",
    input: "Name: John\x00\x01\x02 Email: test\x00@example.com Phone: \x1f555-1234\x7f",
    schema: { name: "string", email: "string", phone: "string" },
    expectedFailure: "control_character_handling",
    category: "encoding_attacks"
  },
  
  {
    name: "REGEX_BOMB",
    description: "Text designed to cause catastrophic backtracking",
    input: "a".repeat(30) + "X" + " Email: " + "a".repeat(30) + "@example.com",
    schema: { name: "string", email: "string" },
    expectedFailure: "regex_complexity",
    category: "algorithmic_attacks"
  },
  
  {
    name: "HOMOGRAPH_ATTACK",
    description: "Visually identical but different Unicode characters",
    input: "Αame: John Email: јohn@еxample.com Phone: 555-1234", // Greek/Cyrillic lookalikes
    schema: { name: "string", email: "string", phone: "string" },
    expectedFailure: "character_confusion",
    category: "security_attacks"
  },
  
  {
    name: "MIXED_ENCODING_CHAOS",
    description: "Different encodings mixed together",
    input: "Name: Jöhn Smîth Email: test@éxample.com Phöne: 555-1234 Ñote: Special",
    schema: { name: "string", email: "string", phone: "string", note: "string" },
    expectedFailure: "encoding_mismatch",
    category: "encoding_attacks"
  },
  
  {
    name: "CONTRADICTORY_SCHEMAS",
    description: "Schema asking for impossible combinations",
    input: "Age: 25 years old Born: December 32nd, 2025",
    schema: { 
      age: "number", 
      birth_date: "string",
      impossible_field: "boolean",
      nonexistent_data: "array"
    },
    expectedFailure: "schema_mismatch",
    category: "logical_attacks"
  },
  
  {
    name: "MALFORMED_EVERYTHING",
    description: "Every possible syntax error combined",
    input: "\"Name\": 'John' \"Email\": test@[example.com} \"Phone\": (555-1234) \"Data\": {[broken}]",
    schema: { name: "string", email: "string", phone: "string", data: "object" },
    expectedFailure: "syntax_chaos",
    category: "structure_attacks"
  },
  
  {
    name: "ZERO_WIDTH_CHAOS",
    description: "Zero-width characters breaking field boundaries",
    input: "Na‌me: Jo‍hn Em‌ail: te‍st@exa‌mple.com Pho‍ne: 55‌5-123‍4",
    schema: { name: "string", email: "string", phone: "string" },
    expectedFailure: "invisible_character_interference",
    category: "encoding_attacks"
  },
  
  {
    name: "RECURSIVE_REFERENCES",
    description: "Self-referential data causing loops",
    input: "Person: John, Refers to: Person: John, Refers to: Person: John...",
    schema: { person: "string", refers_to: "string" },
    expectedFailure: "infinite_recursion",
    category: "algorithmic_attacks"
  },
  
  {
    name: "IMPOSSIBLE_SCHEMA_DEMAND",
    description: "Schema requiring extraction of non-existent data",
    input: "Just some random text with no structured data at all.",
    schema: { 
      credit_card: "string",
      social_security: "string", 
      password: "string",
      secret_key: "string",
      database_connection: "string"
    },
    expectedFailure: "data_hallucination",
    category: "logical_attacks"
  }
];

class AdversarialTestSuite {
  constructor() {
    this.apiEndpoint = "https://app-5108296280.us-central1.run.app/v1/parse";
  }
  
  async runAdversarialSuite() {
    console.log("💀 ADVERSARIAL TESTING SUITE - Breaking Parserator");
    console.log("🎯 Testing system limits, edge cases, and malicious inputs");
    console.log("=" * 80);
    
    const results = [];
    let totalTime = 0;
    
    for (const testCase of ADVERSARIAL_TEST_CASES) {
      console.log(`\n🔥 Attack: ${testCase.name} (${testCase.category})`);
      console.log(`   Expected: ${testCase.expectedFailure}`);
      
      const result = await this.runAdversarialTest(testCase);
      results.push(result);
      totalTime += result.responseTime;
      
      // Log result
      this.logAdversarialResult(result);
      
      // Add delay to avoid overwhelming the API
      await this.delay(500);
    }
    
    this.generateAdversarialReport(results, totalTime);
  }
  
  async runAdversarialTest(testCase) {
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
      
      const result = await response.json();
      const responseTime = Date.now() - startTime;
      const confidence = result.metadata?.confidence || result.confidence || 0;
      
      // Analyze the result for adversarial patterns
      const analysis = this.analyzeAdversarialResult(result, testCase);
      
      return {
        name: testCase.name,
        category: testCase.category,
        expectedFailure: testCase.expectedFailure,
        succeeded: response.ok && result.success,
        confidence: confidence,
        responseTime: responseTime,
        tokensUsed: result.metadata?.tokensUsed || 0,
        parsedData: result.parsedData,
        error: result.error || null,
        analysis: analysis,
        architectPlan: result.metadata?.architectPlan
      };
    } catch (error) {
      return {
        name: testCase.name,
        category: testCase.category,
        expectedFailure: testCase.expectedFailure,
        succeeded: false,
        confidence: 0,
        responseTime: Date.now() - startTime,
        tokensUsed: 0,
        error: error.message,
        analysis: { type: "system_error", severity: "high" }
      };
    }
  }
  
  analyzeAdversarialResult(result, testCase) {
    const analysis = {
      type: "unknown",
      severity: "low",
      findings: []
    };
    
    // Check for hallucination (making up data)
    if (result.parsedData && testCase.expectedFailure === "data_hallucination") {
      const hasHallucination = Object.values(result.parsedData).some(value => 
        value && value.toString().length > 0
      );
      if (hasHallucination) {
        analysis.type = "data_hallucination";
        analysis.severity = "high";
        analysis.findings.push("Generated non-existent data");
      }
    }
    
    // Check for resource exhaustion
    if (result.metadata?.tokensUsed > 2000) {
      analysis.findings.push("High token usage detected");
      analysis.severity = "medium";
    }
    
    if (analysis.responseTime > 10000) {
      analysis.findings.push("Excessive response time");
      analysis.severity = "high";
    }
    
    // Check for corrupted output
    if (result.parsedData) {
      const hasCorruption = Object.values(result.parsedData).some(value => {
        if (typeof value === 'string') {
          return value.includes('\x00') || value.includes('\x01') || value.includes('\x7f');
        }
        return false;
      });
      
      if (hasCorruption) {
        analysis.type = "output_corruption";
        analysis.severity = "high";
        analysis.findings.push("Control characters in output");
      }
    }
    
    return analysis;
  }
  
  logAdversarialResult(result) {
    const status = result.succeeded ? '😱' : '🛡️'; // 😱 = system vulnerable, 🛡️ = system protected
    const confidence = result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : '0%';
    
    console.log(`   ${status} ${result.succeeded ? 'PARSED' : 'BLOCKED'}: ${confidence} confidence (${result.responseTime}ms)`);
    
    if (result.error) {
      console.log(`   🔍 Error: ${result.error}`);
    }
    
    if (result.analysis.findings.length > 0) {
      console.log(`   ⚠️  Analysis: ${result.analysis.findings.join(', ')}`);
    }
    
    if (result.parsedData && result.succeeded) {
      const dataStr = JSON.stringify(result.parsedData);
      const truncated = dataStr.length > 100 ? dataStr.substring(0, 100) + '...' : dataStr;
      console.log(`   📊 Data: ${truncated}`);
    }
  }
  
  generateAdversarialReport(results, totalTime) {
    console.log("\n" + "=".repeat(80));
    console.log("💀 ADVERSARIAL TEST RESULTS - System Vulnerability Analysis");
    console.log("=".repeat(80));
    
    const categories = [...new Set(results.map(r => r.category))];
    
    console.log("📊 VULNERABILITY SUMMARY:");
    
    categories.forEach(category => {
      const categoryResults = results.filter(r => r.category === category);
      const vulnerable = categoryResults.filter(r => r.succeeded).length;
      const protectedCount = categoryResults.length - vulnerable;
      
      console.log(`   ${category}:`);
      console.log(`     🛡️  Protected: ${protectedCount}/${categoryResults.length}`);
      console.log(`     😱 Vulnerable: ${vulnerable}/${categoryResults.length}`);
    });
    
    // High-severity findings
    const criticalFindings = results.filter(r => 
      r.analysis.severity === "high" && r.succeeded
    );
    
    if (criticalFindings.length > 0) {
      console.log("\n🚨 CRITICAL VULNERABILITIES:");
      criticalFindings.forEach(finding => {
        console.log(`   • ${finding.name}: ${finding.analysis.type}`);
        console.log(`     Details: ${finding.analysis.findings.join(', ')}`);
      });
    }
    
    // Performance under attack
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const maxResponseTime = Math.max(...results.map(r => r.responseTime));
    const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);
    
    console.log("\n⚡ PERFORMANCE UNDER ATTACK:");
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   Maximum Response Time: ${maxResponseTime}ms`);
    console.log(`   Total Tokens Used: ${totalTokens}`);
    
    // Architect pattern analysis
    const architectPlans = results.filter(r => r.architectPlan).map(r => r.architectPlan);
    if (architectPlans.length > 0) {
      console.log("\n🏗️  ARCHITECT PATTERN UNDER STRESS:");
      console.log(`   Plans Generated: ${architectPlans.length}/${results.length}`);
      
      const avgSteps = architectPlans.reduce((sum, plan) => 
        sum + (plan.steps ? plan.steps.length : 0), 0
      ) / architectPlans.length;
      
      console.log(`   Average Steps per Plan: ${avgSteps.toFixed(1)}`);
    }
    
    console.log("\n🔍 SECURITY RECOMMENDATIONS:");
    console.log("   • Input validation and sanitization needed for Unicode attacks");
    console.log("   • Token limits should be enforced to prevent resource exhaustion");
    console.log("   • Confidence thresholds help prevent hallucination");
    console.log("   • Two-stage architecture provides some protection via planning phase");
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run adversarial tests
async function main() {
  const testSuite = new AdversarialTestSuite();
  await testSuite.runAdversarialSuite();
}

main().catch(console.error);
