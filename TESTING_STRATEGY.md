# Parserator Testing Strategy - Chaos Testing Suite

## Overview
Comprehensive testing strategy for validating Parserator's two-stage Architect-Extractor pattern against real-world data chaos.

## Current System Performance ✅
- **API Endpoint**: https://app-5108296280.us-central1.run.app/v1/parse
- **Verified Performance**: 95% confidence, ~500 tokens, ~2.4s response time
- **Status**: Production-ready and operational

## Chaos Testing Philosophy
Test against **real-world messiness** rather than clean, idealized data. Focus on scenarios where traditional parsers fail.

## Test Suite Design

### 1. **Chaos Test Cases** (10 Challenging Scenarios)

```typescript
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
    schema: { name: "string", email: "email", phone: "string" },
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
    schema: { name: "string", email: "email", skills: "array" },
    expectedChallenges: ["Missing quotes", "Mixed syntax"],
    minConfidence: 0.90,
    category: "structured_data_recovery"
  },

  {
    name: "SOCIAL_MEDIA_NOISE",
    description: "Social post with emojis and informal language",
    input: "🎉 Event contact: Sarah @ sarah@eventco.com 📧 call (555) 123-4567 📞 Location: Central Park 🗽",
    schema: { contact_name: "string", email: "email", phone: "string", location: "string" },
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
```

### 2. **Test Framework Implementation**

```typescript
interface TestResult {
  name: string;
  success: boolean;
  confidence: number;
  responseTime: number;
  tokensUsed: number;
  expectedChallenges: string[];
  actualResult: any;
  notes: string;
  category: string;
}

class ParseratorChaosTestSuite {
  private apiEndpoint = "https://app-5108296280.us-central1.run.app/v1/parse";
  
  async runFullSuite(): Promise<TestReport> {
    const results: TestResult[] = [];
    const startTime = Date.now();
    
    console.log("🧪 Starting Parserator Chaos Test Suite...");
    
    for (const testCase of CHAOS_TEST_CASES) {
      console.log(`\n🎯 Testing: ${testCase.name}`);
      const result = await this.runSingleTest(testCase);
      results.push(result);
      
      // Log immediate result
      console.log(`${result.success ? '✅' : '❌'} ${result.name}: ${result.confidence}% confidence`);
    }
    
    return this.generateReport(results, Date.now() - startTime);
  }
  
  async runSingleTest(testCase: ChaosTestCase): Promise<TestResult> {
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
      
      const parseResult = await response.json();
      const responseTime = Date.now() - startTime;
      
      return {
        name: testCase.name,
        success: parseResult.confidence >= testCase.minConfidence,
        confidence: parseResult.confidence,
        responseTime,
        tokensUsed: parseResult.metadata?.tokensUsed || 0,
        expectedChallenges: testCase.expectedChallenges,
        actualResult: parseResult.parsedData,
        notes: this.analyzeResult(parseResult, testCase),
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
  
  private analyzeResult(parseResult: any, testCase: ChaosTestCase): string {
    const notes = [];
    
    // Check if all expected fields were found
    const expectedFields = Object.keys(testCase.schema);
    const actualFields = Object.keys(parseResult.parsedData || {});
    const missingFields = expectedFields.filter(field => !actualFields.includes(field));
    
    if (missingFields.length > 0) {
      notes.push(`Missing fields: ${missingFields.join(', ')}`);
    }
    
    // Check confidence level
    if (parseResult.confidence < testCase.minConfidence) {
      notes.push(`Low confidence: ${parseResult.confidence} < ${testCase.minConfidence}`);
    }
    
    // Token efficiency check
    if (parseResult.metadata?.tokensUsed > 1000) {
      notes.push(`High token usage: ${parseResult.metadata.tokensUsed}`);
    }
    
    return notes.length > 0 ? notes.join('; ') : 'All checks passed';
  }
  
  private generateReport(results: TestResult[], totalTime: number): TestReport {
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
    
    return {
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        overallPassRate: (results.filter(r => r.success).length / results.length) * 100,
        avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
        totalTime,
        totalTokens: results.reduce((sum, r) => sum + r.tokensUsed, 0)
      },
      categoryBreakdown: categoryStats,
      detailedResults: results,
      recommendations: this.generateRecommendations(results)
    };
  }
  
  private generateRecommendations(results: TestResult[]): string[] {
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
    
    return recommendations;
  }
}
```

### 3. **Usage Examples**

```bash
# Run full chaos test suite
npm run test:chaos

# Run specific category
npm run test:chaos -- --category=financial_data

# Run with detailed output
npm run test:chaos -- --verbose

# Compare against baseline
npm run test:chaos -- --compare-baseline
```

### 4. **Performance Baselines**

```typescript
const PERFORMANCE_BASELINES = {
  responseTime: {
    target: 3000,    // 3 seconds
    warning: 5000,   // 5 seconds
    critical: 10000  // 10 seconds
  },
  
  confidence: {
    excellent: 0.95,  // 95%+
    good: 0.85,       // 85%+
    acceptable: 0.75, // 75%+
    poor: 0.60        // <60%
  },
  
  tokenEfficiency: {
    excellent: 400,   // <400 tokens
    good: 600,        // <600 tokens
    acceptable: 800,  // <800 tokens
    poor: 1000        // >1000 tokens
  }
};
```

### 5. **Continuous Integration Integration**

```yaml
# .github/workflows/chaos-tests.yml
name: Chaos Testing Suite
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM

jobs:
  chaos-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:chaos
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: chaos-test-results
          path: test-results/
```

This comprehensive testing strategy will validate that your production-ready system continues to perform excellently under real-world chaos conditions! 🧪✅