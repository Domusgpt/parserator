# 🗑️ EXACT CUTS PROPOSED - EVERY LINE TO DELETE

## ARCHITECT PROMPT CUTS

### **CUT 1: Verbose Instruction Sections (Lines 644-701) - 58 LINES**
```typescript
## CRITICAL INSTRUCTIONS

1. **Each searchInstruction must be DIRECT and ACTIONABLE**
   - ❌ "Look for the customer name"
   - ✅ "Find the text after 'Customer:' or 'Name:' that appears to be a person's name"

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

4. **Set confidence based on clarity**
   - High (0.9+): Clear patterns, well-structured data
   - Medium (0.7-0.89): Some ambiguity but patterns visible
   - Low (0.5-0.69): Messy data, unclear patterns

5. **Estimate complexity honestly**
   - low: Simple extraction, clear patterns
   - medium: Some context needed, moderate complexity
   - high: Complex reasoning, ambiguous patterns

6. **Provide helpful examples when patterns are clear**

7. **ERROR RECOVERY STRATEGIES**
   - skip: Skip this field if extraction fails
   - retry: Try alternative search patterns
   - simplify: Use simpler extraction logic
   - approximate: Accept partial matches

8. **SCHEMA SIMPLIFICATION**
   If the schema is too complex (>20 fields), suggest simplification:
   - Group related fields into objects
   - Mark less critical fields as optional
   - Recommend phased extraction approach

9. **95% ACCURACY TECHNIQUES**
   - Use multiple search patterns for critical fields
   - Provide regex patterns for structured data
   - Include validation rules in instructions
   - Suggest confidence thresholds per field

10. **EMA COMPLIANCE**
    - Respect data sovereignty principles
    - Avoid extracting sensitive data unless explicitly requested
    - Provide transparency in extraction methods

Remember: The Extractor will follow your plan exactly. Make your instructions clear, specific, and actionable. Your searchInstructions are the key to accurate extraction.
```

**WHY CUT:** AI already knows to be direct, use patterns, choose types correctly. This is lecturing the AI about obvious concepts.

**KEEP INSTEAD:** Just the actionable example: "searchInstruction: 'Find text after Customer:' not 'look for name'"

---

### **CUT 2: Metadata Theater (Lines 630-641) - 12 LINES**
```typescript
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
```

**WHY CUT:** Creates timestamp/version theater without improving extraction. `dataCharacteristics` forces AI to categorize instead of focusing on actual extraction.

**KEEP INSTEAD:** Only business-critical fields like `estimatedTokens` for billing

---

## EXTRACTOR PROMPT CUTS

### **CUT 3: Redundant Response Format Example (Lines 880-908) - 29 LINES**
```typescript
Example response:
\`\`\`json
{
  "extractedData": {
    "customerName": "John Doe",
    "email": "john@example.com",
    "orderTotal": 99.99,
    "orderDate": "2024-01-15"
  },
  "extractionNotes": {
    "customerName": "clearly identified after 'Customer:'",
    "email": "found in contact section",
    "orderTotal": "extracted from total line",
    "orderDate": "converted from 'Jan 15, 2024' format"
  },
  "extractionMetrics": {
    "successfulExtractions": 4,
    "failedExtractions": 0,
    "partialExtractions": 0,
    "confidenceScores": {
      "customerName": 0.98,
      "email": 0.95,
      "orderTotal": 0.99,
      "orderDate": 0.90
    }
  },
  "errorRecoveryActions": []
}
\`\`\`
```

**WHY CUT:** Schema already defines structure. AI doesn't need JSON examples. This duplicates the schema definition.

---

### **CUT 4: Validation Types Guide (Lines 802-813) - 12 LINES**
```typescript
## VALIDATION TYPES GUIDE

- **string**: Plain text, trim whitespace
- **email**: Valid email address format
- **number**: Numeric value (int or float)
- **iso_date**: Date in YYYY-MM-DD format
- **string_array**: Array of strings ["item1", "item2"]
- **boolean**: true or false
- **url**: Valid URL format
- **phone**: Phone number (any reasonable format)
- **json_object**: Valid JSON object
```

**WHY CUT:** AI already knows data types. This explains obvious concepts like "number: Numeric value"

---

### **CUT 5: Extraction Rules Lecturing (Lines 814-823) - 10 LINES**
```typescript
## EXTRACTION RULES

1. **BE PRECISE**: Extract exactly what the searchInstruction asks for
2. **FOLLOW TYPES**: Convert values to the correct validationType
3. **HANDLE MISSING**: If data isn't found:
   - Required fields: Use defaultValue or apply errorRecoveryStrategy
   - Optional fields: Use null or omit
4. **QUALITY NOTES**: Add brief confidence/quality notes for each field
5. **NO HALLUCINATION**: Only extract data that actually exists in the input
```

**WHY CUT:** "BE PRECISE" and "NO HALLUCINATION" are obvious. AI knows to follow instructions and not make things up.

---

### **CUT 6: 95% Accuracy Techniques Verbose Section (Lines 847-864) - 18 LINES**
```typescript
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
```

**WHY CUT:** "Use regex patterns first" and "verify data matches type" are obvious. This over-explains basic extraction logic.

---

### **CUT 7: Contextual Error Messages Theater (Lines 865-872) - 8 LINES**
```typescript
## CONTEXTUAL ERROR MESSAGES

When extraction fails or confidence is low, provide helpful context:
- What was searched for
- Where it was expected
- What was found instead
- Suggested fixes for the user
```

**WHY CUT:** This is handled by the actual error recovery system. Asking AI to provide "suggested fixes for the user" in the extraction response is wrong - that's the job of the contextual error generation function.

---

### **CUT 8: Critical Response Format Redundancy (Lines 873-879) - 7 LINES**
```typescript
## CRITICAL: RESPONSE FORMAT
- Respond with ONLY the JSON object
- No explanations, no markdown formatting
- Ensure valid JSON syntax
- Include all target keys from the SearchPlan
- Provide comprehensive extraction metrics
```

**WHY CUT:** Says "respond with JSON only" twice in the same prompt. "Ensure valid JSON syntax" is obvious.

---

## 🔍 WHAT I'M **KEEPING** (Essential Architecture)

### **KEEP: Core Schema Structure**
```typescript
{
  "steps": [...], // Essential for extraction plan
  "totalSteps": ${fieldCount}, // Business logic
  "architectConfidence": 0.95, // Quality control
  "estimatedExtractorTokens": 1500, // Billing
  "extractorInstructions": "...", // Dynamic guidance
  "fallbackStrategies": [...] // Error recovery
}
```

### **KEEP: Error Recovery Procedures (Lines 824-846)**
```typescript
## ERROR RECOVERY PROCEDURES

1. **FIELD NOT FOUND**
   - Check alternative locations mentioned in searchInstruction
   - Look for similar patterns nearby
   - Use defaultValue if provided
   - Note the issue in errorRecoveryActions

2. **AMBIGUOUS DATA**
   - Choose the most likely match based on context
   - Note ambiguity in extractionNotes
   - Apply confidence score appropriately

3. **WRONG FORMAT**
   - Attempt to convert/clean the data
   - Use approximate matching if allowed
   - Document the transformation applied

4. **COMPLEX EXTRACTION FAILURE**
   - If multiple fields fail, check if input format is different than expected
   - Apply fallbackStrategies from the SearchPlan
   - Provide detailed error information
```

**WHY KEEP:** This is actionable guidance for handling real extraction problems. Not obvious, provides specific steps.

### **KEEP: Extraction Instructions (Lines 791-801)**
```typescript
## EXTRACTION INSTRUCTIONS

For each step in the SearchPlan:
1. Use the \`searchInstruction\` as your primary guide
2. Look for data matching the \`description\`
3. Format the result according to \`validationType\`
4. If \`isRequired\` is true, try harder to find something
5. Use \`examples\` and \`pattern\` if provided for guidance
6. Apply \`errorRecoveryStrategy\` if extraction fails
7. Respect \`confidenceThreshold\` for quality control
```

**WHY KEEP:** These connect the schema fields to actual behavior. Not obvious how to use `confidenceThreshold` and `errorRecoveryStrategy`.

---

## 📊 TOTAL CUTS PROPOSED

| Section | Lines Cut | Reason |
|---------|-----------|--------|
| Verbose Instructions | 58 lines | Lecturing AI about obvious concepts |
| Metadata Theater | 12 lines | Timestamp/version tracking without extraction benefit |
| Response Format Example | 29 lines | Duplicates schema definition |
| Validation Types Guide | 12 lines | Explains obvious data types |
| Extraction Rules | 10 lines | "BE PRECISE" and "NO HALLUCINATION" are obvious |
| 95% Accuracy Techniques | 18 lines | Over-explains basic extraction logic |
| Contextual Error Messages | 8 lines | Wrong place for this logic |
| Response Format Redundancy | 7 lines | Says same thing twice |

**TOTAL: 154 lines cut (60% reduction)**

**KEEPING: 104 lines of essential architecture**
- Schema structure with business fields
- Error recovery procedures  
- Extraction instructions that connect schema to behavior
- Fallback strategies
- Response format definition (once)

## ⚠️ BEFORE I CUT - YOUR APPROVAL?

These cuts would:
- ✅ Keep all business-critical architecture
- ✅ Keep error recovery and contextual handling
- ✅ Remove lecturing AI about obvious things
- ✅ Remove redundant examples and explanations
- ✅ Maintain 95% accuracy capability
- ✅ Reduce token usage by 60%

**Do you approve these specific cuts, or want me to modify/keep any of them?**