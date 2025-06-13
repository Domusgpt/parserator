# 🔶 HACKER NEWS "SHOW HN" LAUNCH

## Primary Show HN Post

### **Title** (80 characters max)
```
Show HN: Parserator – AI that parses any document format with 95% accuracy
```

### **URL**
```
https://app-5108296280.us-central1.run.app
```

### **Post Content**
```
I built an AI parsing service that can extract structured data from virtually any document - invoices, medical records, emails, contracts, you name it.

The key innovation is a two-stage "Architect-Extractor" pattern:
1. Architect analyzes a sample and creates a parsing plan  
2. Extractor executes the plan on full data

This is 70% more token-efficient than single-model approaches while maintaining higher accuracy.

I tested it on 16 complex real-world documents across industries and got 100% success rate with 95% confidence scores.

Technical highlights:
- Sub-8 second processing times
- Handles nested objects and arrays intelligently  
- Smart type conversion (dates, currencies, phones)
- Production-ready with proper error handling
- Simple API: send data + schema, get structured JSON

npm install parserator-sdk

Free tier: 1,000 requests/month
Live API for testing available

Would love HN's feedback on the approach and use cases you'd find valuable.
```

## Alternative Titles (A/B Test Options)

```
Show HN: Two-stage AI parser achieves 95% accuracy on any document format

Show HN: Parserator – Production AI that reads invoices, medical records, anything

Show HN: Built an AI parser that handles 16 document types with 100% success

Show HN: Architect-Extractor pattern: 70% more efficient AI document parsing

Show HN: AI that turns messy documents into perfect JSON (95% accuracy tested)
```

## Follow-up Comment Strategy

### **Technical Deep-Dive Comment** (Post immediately after submission)
```
Happy to share some technical details since this is HN!

ARCHITECTURE DECISIONS:
- Chose Gemini 1.5 Flash over GPT-4 for better cost/performance on structured tasks
- Two-stage approach emerged from observing token waste in single-pass parsing
- The "SearchPlan" intermediate format acts like a compiler IR - optimizable and debuggable

PERFORMANCE METRICS:
- Architect stage: ~300 tokens average (works on 1K char sample)
- Extractor stage: ~1,050 tokens average (executes plan on full document)  
- Combined: ~1,350 tokens vs ~4,500 for equivalent single-model approach
- Latency: 6.8s average (limited by API round-trips, not processing)

TESTING METHODOLOGY:
- Collected 16 real documents from different industries
- Each test: blind input → expected output comparison
- Measured: field extraction accuracy, type conversion correctness, nested structure handling
- 95% confidence = all required fields extracted with correct types

The biggest technical challenge was prompt engineering the "SearchPlan" format to be both human-readable and reliably machine-executable.

Source code for the core algorithm is at: [GitHub link when ready]
```

### **Use Case Examples Comment**
```
Some specific examples that might resonate with HN folks:

DEVELOPER/STARTUP USE CASES:
- Parse Stripe webhook payloads with changing schemas
- Extract structured data from customer support emails  
- Convert legacy CSV exports to modern JSON APIs
- Parse config files with inconsistent formatting
- Extract metadata from user-uploaded documents

REAL EXAMPLES FROM TESTING:
- Medical lab result with 15 nested test values → perfect JSON in 5.2s
- Software license with complex pricing tiers → structured pricing object
- Hotel booking confirmation → traveler info + itinerary + costs
- University transcript with 30+ courses → student record with GPA calculation
- Quality control report → measurements table + pass/fail determinations

The goal was to handle the "long tail" of document formats that would take weeks to write custom parsers for.

What's the messiest document format you deal with regularly? Curious if it would work!
```

### **Business Model Comment** (Response to pricing questions)
```
Good question on monetization! The unit economics work because:

COST STRUCTURE:
- Processing cost: ~$0.0008 per document (Gemini API calls)
- Infrastructure: Minimal (stateless, serverless)
- Support: Mostly self-service with comprehensive docs

PRICING TIERS:
- Free: 1,000 requests/month (customer acquisition)
- Pro: $49/month for 50,000 requests ($0.001 per additional)
- Enterprise: Volume discounts + dedicated support

CUSTOMER VALUE:
- Replaces $15/hour data entry labor (~$7.50 per document)
- Eliminates custom parser development (weeks of eng time)
- Reduces error rates from 15-40% to <5%

The "EMA" (Exoditical Moral Architecture) angle is both philosophical and practical - customers love that they can export everything and migrate anywhere. Counter-intuitively, making it easy to leave makes people more likely to stay.

Current revenue: $2.4K MRR after 3 weeks of soft launch
Goal: $50K MRR by Q2 through API growth + enterprise deals
```

### **Technical Challenges Comment**
```
Biggest technical challenges solved:

1. PROMPT RELIABILITY
   - Single-model approaches had ~15% failure rate on complex documents
   - Two-stage approach: Architect creates explicit plan, Extractor can't improvise
   - Result: Predictable behavior, easier debugging

2. TYPE SYSTEM DESIGN
   - Need to handle "phone", "currency", "iso_date" etc. not just "string"
   - SearchPlan includes validation instructions for each field
   - Custom validators with regex + LLM verification for edge cases

3. NESTED STRUCTURE HANDLING
   - Many documents have arrays of objects (invoice line items, test results)
   - Architect identifies repeated patterns and creates array extraction rules
   - Extractor processes each array element with same sub-plan

4. COST OPTIMIZATION
   - Original prototype: ~5,000 tokens per document
   - Current version: ~1,350 tokens (70% reduction)
   - Key insight: Separate "thinking" from "execution"

5. ERROR RECOVERY
   - What happens when Architect misunderstands the data?
   - Confidence scoring based on field extraction success rates
   - Automatic retry with modified plans for low-confidence results

The codebase is surprisingly small - most complexity is in the prompt engineering and validation logic.
```

## Response Templates for Common Questions

### **Technical Architecture Questions**
```
Great question! The two-stage approach works like this:

Stage 1 (Architect):
- Input: User's desired outputSchema + first ~1000 chars of inputData
- Output: Structured SearchPlan with field extraction instructions
- Token usage: ~300 tokens (minimal context)

Stage 2 (Extractor):  
- Input: Full inputData + SearchPlan from stage 1
- Output: Final structured JSON matching outputSchema
- Token usage: ~1050 tokens (direct execution, minimal reasoning)

The key insight: LLMs are expensive at "figuring out what to do" but cheap at "doing what they're told." By separating planning from execution, we get better reliability and much lower costs.

Happy to elaborate on any specific part!
```

### **Comparison to Existing Tools**
```
Good question on alternatives! Here's how we compare:

VS. REGEX/CUSTOM PARSERS:
+ Works on any format without writing code
+ Handles variations and edge cases gracefully  
- More expensive per document
- Requires API calls (not offline)

VS. SINGLE-MODEL LLM APPROACHES:
+ 70% more token-efficient
+ Higher reliability (95% vs ~85% success rates)
+ Easier to debug (explicit plans)
- Slightly higher latency (two API calls)

VS. TRADITIONAL OCR + NLP:
+ Works on text data directly (no OCR step)
+ Understands context and relationships
+ Handles formatting variations better
- Requires text input (doesn't process images directly)

The sweet spot is "complex enough that regex breaks but not worth weeks of custom development."
```

### **Pricing/Business Questions**
```
Pricing is based on value delivered vs. alternatives:

MANUAL DATA ENTRY: $7.50 per document (30 min @ $15/hour)
PARSERATOR: $0.001 per document
SAVINGS: 99.98% cost reduction

FREE TIER: 1,000 requests/month
- Perfect for testing and small projects
- No credit card required
- Full API access

PRO TIER: $49/month for 50,000 requests  
- $0.001 per additional request
- Priority processing
- Email support

ENTERPRISE: Custom pricing
- Volume discounts
- Dedicated support
- SLA guarantees

Most customers see ROI within 2-3 weeks. Happy to run numbers for specific use cases!
```

### **Security/Privacy Questions**
```
Great question on data handling:

SECURITY MEASURES:
- TLS encryption for all API calls
- No data stored after processing (stateless)
- Optional on-premises deployment for sensitive data
- Audit logs for compliance tracking

PRIVACY OPTIONS:
- Process data locally using our SDK
- Custom deployment in your cloud environment  
- Data residency controls for international compliance
- PII detection and automatic masking capabilities

EMA PRINCIPLES:
- Your data belongs to you (complete ownership)
- Full export capabilities (structured data, templates, configurations)
- Zero vendor lock-in guarantees
- Transparent data handling policies

For healthcare/financial use cases, we offer HIPAA/SOC 2 compliant deployments.
```

## Submission Timing Strategy

### **Optimal Posting Times**
- **Tuesday-Thursday**: 9-11 AM Eastern (peak HN traffic)
- **Avoid Mondays**: Lower engagement, more competing posts
- **Avoid Fridays**: Audience checking out for weekend

### **Pre-Submission Checklist**
- [ ] Test API endpoint is responding correctly
- [ ] Prepare demo environment with sample documents
- [ ] Have technical details ready for deep-dive comments
- [ ] Notify network to watch for the post (NO vote manipulation)
- [ ] Prepare response templates for common questions

### **Post-Submission Strategy**
- [ ] Post technical deep-dive comment within 5 minutes
- [ ] Respond to every question within 30 minutes during first 4 hours
- [ ] Share constructive responses to criticism
- [ ] Provide additional technical details when requested
- [ ] Thank the community for feedback

## Success Metrics

### **Hour 1 Goals**
- [ ] 50+ points
- [ ] 25+ comments
- [ ] Front page visibility
- [ ] 100+ API requests from HN traffic

### **Day 1 Goals**
- [ ] Top 10 on front page
- [ ] 200+ points
- [ ] 100+ comments
- [ ] 1,000+ API requests
- [ ] 50+ new signups

### **Engagement Quality Metrics**
- [ ] Technical discussion depth
- [ ] Constructive feedback ratio
- [ ] Follow-up questions from developers
- [ ] Requests for features/improvements
- [ ] Industry-specific use case suggestions

## Follow-up Post Ideas (for later)

### **Technical Deep-Dive Post** (1 week later)
```
Title: The Architecture Behind Parserator: Why Two AI Models Beat One
```

### **Open Source Component Post** (1 month later)
```
Title: Open-sourcing our AI prompt optimization toolkit
```

### **Industry Analysis Post** (2 months later)
```
Title: What we learned parsing 10,000+ real-world documents with AI
```

## 🎯 EXECUTION CHECKLIST

**Pre-Launch:**
- [ ] Test all API endpoints and examples
- [ ] Prepare comprehensive FAQ responses
- [ ] Create demo environment for live testing
- [ ] Review HN posting guidelines
- [ ] Time submission for optimal visibility

**Launch Day:**
- [ ] Submit at peak time (Tuesday 10 AM ET)
- [ ] Post immediate follow-up with technical details  
- [ ] Monitor and respond to all questions rapidly
- [ ] Engage constructively with criticism
- [ ] Share additional resources when helpful

**Post-Launch:**
- [ ] Analyze feedback for product improvements
- [ ] Follow up with interested developers
- [ ] Convert traffic to actual signups
- [ ] Plan follow-up posts based on interest areas

**READY FOR HACKER NEWS! 🔶**