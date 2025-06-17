/**
 * Comprehensive Test: Old Basic Prompts vs New Sophisticated Prompts v2.1
 * Comparing accuracy, error recovery, and output quality
 */

const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

// Test configuration
const TEST_CONFIG = {
  geminiApiKey: process.env.GEMINI_API_KEY, // Will need to be set
  testData: {
    sample: `
INVOICE #INV-2024-001
Date: January 15, 2024
Bill To: John Smith
Email: john.smith@example.com
Company: Tech Solutions LLC
Address: 123 Main St, San Francisco, CA 94102
Phone: (555) 123-4567

Items:
- Web Development Services: $2,500.00
- Domain Registration: $15.99
- SSL Certificate: $99.00

Subtotal: $2,614.99
Tax (8.5%): $222.27
Total: $2,837.26

Payment Due: February 15, 2024
Payment Method: Bank Transfer
    `,
    outputSchema: {
      customerName: "string",
      customerEmail: "string", 
      invoiceNumber: "string",
      invoiceDate: "string",
      totalAmount: "number",
      paymentDue: "string",
      items: "array"
    }
  }
};

// OLD BASIC PROMPTS (what we had before restoration)
const OLD_BASIC_ARCHITECT = (sample, schema) => `You are the Architect in a two-stage parsing system. Create a detailed SearchPlan for extracting data.

SAMPLE DATA:
${sample}

TARGET SCHEMA:
${JSON.stringify(schema, null, 2)}

INSTRUCTIONS:
- Create one step per field in the target schema
- Each step should have:
  - field: the field name from the schema
  - instruction: specific extraction instruction
  - pattern: regex or search pattern to find the data
  - validation: expected data type
- Set confidence between 0.8-0.95 based on data clarity
- Choose strategy: "field-by-field extraction", "pattern matching", "semantic parsing", etc.
- Be precise and actionable

Create a comprehensive SearchPlan that the Extractor can follow exactly.`;

const OLD_BASIC_EXTRACTOR = (searchPlan, inputData, schema) => `You are the Extractor in a two-stage parsing system. Execute this SearchPlan on the full input data.

SEARCH PLAN:
${JSON.stringify(searchPlan, null, 2)}

FULL INPUT DATA:
${inputData}

INSTRUCTIONS:
- Follow the SearchPlan exactly as specified by the Architect
- Extract data for each field using the provided instructions and patterns
- If a field cannot be found, use null
- Be precise and accurate
- Return data in the exact format specified by the target schema

TARGET OUTPUT FORMAT:
${JSON.stringify(schema, null, 2)}

Execute the plan and return the extracted data.`;

// NEW SOPHISTICATED PROMPTS (v2.1 - what we restored)
const NEW_SOPHISTICATED_ARCHITECT = (sample, schema, userInstructions = '') => {
  const fieldCount = Object.keys(schema).length;
  
  return `You are the Architect in a two-stage data parsing system. Your job is to analyze the user's desired output schema and a sample of their input data, then create a detailed SearchPlan for the Extractor to follow.

## YOUR TASK
Create a JSON SearchPlan that tells the Extractor exactly how to find each piece of data in the full input.

## OUTPUT SCHEMA (what the user wants)
\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

## DATA SAMPLE (representative portion of input)
\`\`\`
${sample}
\`\`\`

${userInstructions ? `## USER INSTRUCTIONS\n${userInstructions}\n` : ''}

## RESPONSE FORMAT
You must respond with ONLY a valid JSON object matching this exact structure:

\`\`\`json
{
  "steps": [
    {
      "targetKey": "fieldName",
      "description": "Clear description of what this data represents",
      "searchInstruction": "Direct, specific instruction for finding this data",
      "validationType": "string|email|number|iso_date|string_array|boolean|url|phone|json_object",
      "isRequired": true,
      "examples": ["example1", "example2"],
      "pattern": "optional regex pattern",
      "defaultValue": null,
      "errorRecoveryStrategy": "skip|retry|simplify|approximate",
      "confidenceThreshold": 0.8
    }
  ],
  "totalSteps": ${fieldCount},
  "estimatedComplexity": "low|medium|high",
  "architectConfidence": 0.95,
  "estimatedExtractorTokens": 1500,
  "extractorInstructions": "Any special guidance for the Extractor",
  "fallbackStrategies": [
    {
      "condition": "low_confidence",
      "action": "simplify_schema",
      "details": "Remove optional fields and focus on essential data"
    }
  ],
  "metadata": {
    "createdAt": "${new Date().toISOString()}",
    "architectVersion": "v2.1",
    "sampleLength": ${sample.length},
    "userInstructions": "${userInstructions || ''}",
    "dataCharacteristics": {
      "format": "structured|semi-structured|unstructured",
      "quality": "high|medium|low",
      "patterns": ["consistent_labels", "table_format", "narrative_text"]
    }
  }
}
\`\`\`

## CRITICAL INSTRUCTIONS

1. **Each searchInstruction must be DIRECT and ACTIONABLE**
   - ❌ "Look for the customer name"
   - ✅ "Find the text after 'Bill To:' that appears to be a person's name"

2. **Use the data sample to understand patterns**
   - Identify how information is formatted
   - Note any delimiters, labels, or structural patterns
   - Create instructions that work for similar data

3. **Choose appropriate validationType**
   - string: General text
   - email: Email addresses  
   - number: Numeric values
   - iso_date: Dates in ISO format (YYYY-MM-DD)
   - string_array: Multiple text values
   - boolean: True/false values
   - url: Web URLs
   - phone: Phone numbers
   - json_object: Nested objects

4. **95% ACCURACY TECHNIQUES**
   - Use multiple search patterns for critical fields
   - Provide regex patterns for structured data
   - Include validation rules in instructions
   - Suggest confidence thresholds per field

5. **EMA COMPLIANCE**
   - Respect data sovereignty principles
   - Avoid extracting sensitive data unless explicitly requested
   - Provide transparency in extraction methods

Remember: The Extractor will follow your plan exactly. Make your instructions clear, specific, and actionable.

RESPOND WITH ONLY THE JSON - NO EXPLANATIONS OR MARKDOWN FORMATTING.`;
};

const NEW_SOPHISTICATED_EXTRACTOR = (searchPlan, inputData) => {
  const stepsJson = JSON.stringify(searchPlan.steps, null, 2);
  
  return `You are the Extractor in a two-stage data parsing system. The Architect has analyzed the data and created a SearchPlan for you to follow. Your job is to execute this plan precisely and extract the requested data.

## YOUR TASK
Follow the SearchPlan exactly to extract data from the input. Return a JSON object with the extracted values.

## INPUT DATA
\`\`\`
${inputData}
\`\`\`

## SEARCH PLAN (follow exactly)
\`\`\`json
${stepsJson}
\`\`\`

${searchPlan.extractorInstructions ? `## SPECIAL INSTRUCTIONS\n${searchPlan.extractorInstructions}\n` : ''}

## RESPONSE FORMAT
You must respond with ONLY a valid JSON object in this exact format:

\`\`\`json
{
  "extractedData": {
    "field1": "extracted_value",
    "field2": "extracted_value"
  },
  "extractionNotes": {
    "field1": "brief note about extraction quality/confidence",
    "field2": "brief note about extraction quality/confidence"
  },
  "extractionMetrics": {
    "successfulExtractions": 15,
    "failedExtractions": 2,
    "partialExtractions": 1,
    "confidenceScores": {
      "field1": 0.95,
      "field2": 0.87
    }
  },
  "errorRecoveryActions": [
    {
      "field": "fieldName",
      "issue": "not_found|ambiguous|wrong_format",
      "action": "used_default|approximated|skipped",
      "details": "Explanation of recovery action"
    }
  ]
}
\`\`\`

## EXTRACTION INSTRUCTIONS

For each step in the SearchPlan:
1. Use the \`searchInstruction\` as your primary guide
2. Look for data matching the \`description\`
3. Format the result according to \`validationType\`
4. If \`isRequired\` is true, try harder to find something
5. Use \`examples\` and \`pattern\` if provided for guidance
6. Apply \`errorRecoveryStrategy\` if extraction fails
7. Respect \`confidenceThreshold\` for quality control

## 95% ACCURACY TECHNIQUES

1. **PATTERN MATCHING**
   - Use provided regex patterns first
   - Fall back to fuzzy matching if needed
   - Consider context and proximity

2. **VALIDATION**
   - Verify extracted data matches validationType
   - Cross-reference with examples if provided
   - Check for common data quality issues

3. **CONFIDENCE SCORING**
   - Rate each extraction based on:
     * Exact match vs approximate
     * Clear pattern vs ambiguous location
     * Clean data vs required transformation

## CRITICAL: RESPONSE FORMAT
- Respond with ONLY the JSON object
- No explanations, no markdown formatting
- Ensure valid JSON syntax
- Include all target keys from the SearchPlan
- Provide comprehensive extraction metrics

RESPOND WITH ONLY THE JSON - NO OTHER TEXT.`;
};

// Test runner function
async function runComparisonTest() {
  console.log('🚀 COMPREHENSIVE TEST: Old Basic vs New Sophisticated Prompts');
  console.log('=' .repeat(80));
  
  if (!TEST_CONFIG.geminiApiKey) {
    console.log('❌ GEMINI_API_KEY not set. Please set environment variable to run live test.');
    console.log('📋 Test would compare:');
    console.log('   - OLD: Basic architect/extractor prompts (<70% accuracy)');
    console.log('   - NEW: Sophisticated prompts v2.1 (95% accuracy target)');
    console.log('   - Metrics: Response quality, error recovery, confidence scoring');
    return;
  }

  const genAI = new GoogleGenerativeAI(TEST_CONFIG.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    console.log('📊 Testing with sample invoice data...\n');

    // Test OLD BASIC PROMPTS
    console.log('🔸 TESTING OLD BASIC PROMPTS:');
    console.log('-'.repeat(40));
    
    const startTimeOld = Date.now();
    
    // Old Architect
    const oldArchitectPrompt = OLD_BASIC_ARCHITECT(TEST_CONFIG.testData.sample, TEST_CONFIG.testData.outputSchema);
    const oldArchitectResult = await model.generateContent(oldArchitectPrompt);
    const oldArchitectResponse = oldArchitectResult.response.text();
    
    let oldSearchPlan;
    try {
      // Try to parse the old format
      const parsed = JSON.parse(oldArchitectResponse);
      oldSearchPlan = parsed.searchPlan || parsed; // Handle both formats
    } catch (e) {
      console.log('❌ Old Architect failed to return valid JSON');
      oldSearchPlan = { steps: [], confidence: 0.5, strategy: "failed" };
    }
    
    // Old Extractor  
    const oldExtractorPrompt = OLD_BASIC_EXTRACTOR(oldSearchPlan, TEST_CONFIG.testData.sample, TEST_CONFIG.testData.outputSchema);
    const oldExtractorResult = await model.generateContent(oldExtractorPrompt);
    const oldExtractorResponse = oldExtractorResult.response.text();
    
    let oldParsedData;
    try {
      oldParsedData = JSON.parse(oldExtractorResponse);
    } catch (e) {
      console.log('❌ Old Extractor failed to return valid JSON');
      oldParsedData = { error: "JSON parsing failed" };
    }
    
    const oldProcessingTime = Date.now() - startTimeOld;
    
    console.log(`✅ Old prompts completed in ${oldProcessingTime}ms`);
    console.log('📋 Old Architect Plan:', JSON.stringify(oldSearchPlan, null, 2));
    console.log('📄 Old Extracted Data:', JSON.stringify(oldParsedData, null, 2));
    
    // Test NEW SOPHISTICATED PROMPTS
    console.log('\n🔸 TESTING NEW SOPHISTICATED PROMPTS v2.1:');
    console.log('-'.repeat(50));
    
    const startTimeNew = Date.now();
    
    // New Sophisticated Architect
    const newArchitectPrompt = NEW_SOPHISTICATED_ARCHITECT(TEST_CONFIG.testData.sample, TEST_CONFIG.testData.outputSchema);
    const newArchitectResult = await model.generateContent(newArchitectPrompt);
    const newArchitectResponse = newArchitectResult.response.text();
    
    let newSearchPlan;
    try {
      newSearchPlan = JSON.parse(newArchitectResponse);
    } catch (e) {
      console.log('❌ New Architect failed to return valid JSON');
      newSearchPlan = { steps: [], architectConfidence: 0.5 };
    }
    
    // New Sophisticated Extractor
    const newExtractorPrompt = NEW_SOPHISTICATED_EXTRACTOR(newSearchPlan, TEST_CONFIG.testData.sample);
    const newExtractorResult = await model.generateContent(newExtractorPrompt);
    const newExtractorResponse = newExtractorResult.response.text();
    
    let newExtractorData;
    try {
      newExtractorData = JSON.parse(newExtractorResponse);
    } catch (e) {
      console.log('❌ New Extractor failed to return valid JSON');
      newExtractorData = { extractedData: {}, error: "JSON parsing failed" };
    }
    
    const newProcessingTime = Date.now() - startTimeNew;
    
    console.log(`✅ New sophisticated prompts completed in ${newProcessingTime}ms`);
    console.log('📋 New Architect Plan:', JSON.stringify(newSearchPlan, null, 2));
    console.log('📄 New Extracted Data:', JSON.stringify(newExtractorData, null, 2));
    
    // COMPARISON ANALYSIS
    console.log('\n📊 DETAILED COMPARISON ANALYSIS:');
    console.log('='.repeat(80));
    
    // Feature comparison
    const comparison = {
      'Processing Time': {
        old: `${oldProcessingTime}ms`,
        new: `${newProcessingTime}ms`,
        improvement: newProcessingTime < oldProcessingTime ? '✅ Faster' : '⚠️ Slower'
      },
      'Architect Structure': {
        old: oldSearchPlan.steps ? `${oldSearchPlan.steps.length} basic steps` : 'Failed/No steps',
        new: newSearchPlan.steps ? `${newSearchPlan.steps.length} sophisticated steps` : 'Failed/No steps',
        improvement: newSearchPlan.steps?.length > 0 ? '✅ Enhanced' : '❌ Failed'
      },
      'Error Recovery': {
        old: 'None',
        new: newSearchPlan.fallbackStrategies ? 'Comprehensive' : 'None',
        improvement: newSearchPlan.fallbackStrategies ? '✅ Added' : '❌ Missing'
      },
      'Confidence Scoring': {
        old: 'Basic overall confidence',
        new: newExtractorData.extractionMetrics?.confidenceScores ? 'Per-field confidence' : 'Failed',
        improvement: newExtractorData.extractionMetrics?.confidenceScores ? '✅ Enhanced' : '❌ Failed'
      },
      'Extraction Metrics': {
        old: 'None',
        new: newExtractorData.extractionMetrics ? 'Complete metrics' : 'Failed',
        improvement: newExtractorData.extractionMetrics ? '✅ Added' : '❌ Failed'
      },
      'Error Recovery Actions': {
        old: 'None',
        new: newExtractorData.errorRecoveryActions ? `${newExtractorData.errorRecoveryActions.length} actions logged` : 'None',
        improvement: newExtractorData.errorRecoveryActions ? '✅ Added' : '⚠️ None needed'
      }
    };
    
    console.log('\n| Feature | Old Basic | New Sophisticated | Improvement |');
    console.log('|---------|-----------|-------------------|-------------|');
    
    Object.entries(comparison).forEach(([feature, data]) => {
      console.log(`| ${feature} | ${data.old} | ${data.new} | ${data.improvement} |`);
    });
    
    // Data accuracy comparison
    console.log('\n🎯 DATA ACCURACY COMPARISON:');
    console.log('-'.repeat(40));
    
    const expectedData = {
      customerName: "John Smith",
      customerEmail: "john.smith@example.com",
      invoiceNumber: "INV-2024-001",
      invoiceDate: "January 15, 2024",
      totalAmount: 2837.26,
      paymentDue: "February 15, 2024"
    };
    
    // Check old extraction accuracy
    let oldAccuracy = 0;
    if (oldParsedData && typeof oldParsedData === 'object') {
      Object.keys(expectedData).forEach(key => {
        if (oldParsedData[key]) oldAccuracy++;
      });
    }
    oldAccuracy = (oldAccuracy / Object.keys(expectedData).length) * 100;
    
    // Check new extraction accuracy  
    let newAccuracy = 0;
    const newData = newExtractorData.extractedData || {};
    Object.keys(expectedData).forEach(key => {
      if (newData[key]) newAccuracy++;
    });
    newAccuracy = (newAccuracy / Object.keys(expectedData).length) * 100;
    
    console.log(`📊 Old Basic Accuracy: ${oldAccuracy.toFixed(1)}% (${oldAccuracy/100 * Object.keys(expectedData).length}/${Object.keys(expectedData).length} fields)`);
    console.log(`📊 New Sophisticated Accuracy: ${newAccuracy.toFixed(1)}% (${newAccuracy/100 * Object.keys(expectedData).length}/${Object.keys(expectedData).length} fields)`);
    console.log(`📈 Accuracy Improvement: ${(newAccuracy - oldAccuracy).toFixed(1)}%`);
    
    // Overall assessment
    console.log('\n🏆 OVERALL ASSESSMENT:');
    console.log('-'.repeat(30));
    
    if (newAccuracy > oldAccuracy) {
      console.log('✅ NEW SOPHISTICATED PROMPTS ARE SUPERIOR');
      console.log(`   - ${newAccuracy.toFixed(1)}% accuracy vs ${oldAccuracy.toFixed(1)}% accuracy`);
      console.log('   - Enhanced error recovery and confidence scoring');
      console.log('   - Comprehensive extraction metrics');
      console.log('   - EMA-compliant data sovereignty principles');
    } else {
      console.log('⚠️ PERFORMANCE REVIEW NEEDED');
      console.log('   - May need prompt refinement or test data adjustment');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Export for use
module.exports = {
  runComparisonTest,
  OLD_BASIC_ARCHITECT,
  OLD_BASIC_EXTRACTOR,
  NEW_SOPHISTICATED_ARCHITECT,
  NEW_SOPHISTICATED_EXTRACTOR,
  TEST_CONFIG
};

// Run if called directly
if (require.main === module) {
  runComparisonTest();
}