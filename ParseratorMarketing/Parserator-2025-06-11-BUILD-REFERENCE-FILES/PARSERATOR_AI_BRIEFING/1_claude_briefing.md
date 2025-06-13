# **MASTER BRIEFING: Build Parserator (Hybrid SaaS API + SDK/Tools)**

## **CRITICAL: What Parserator Actually Is**

**Parserator is a HYBRID business model for intelligent data parsing:**

1. **Primary Product: SaaS API** (Revenue-generating service)
   - RESTful API at `https://api.parserator.com/v1/parse`
   - Subscription-based pricing (Free/Startup/Pro/Enterprise tiers)
   - Uses advanced 2-stage LLM processing (Architect-Extractor pattern)
   - Handles all infrastructure, LLM costs, and optimization

2. **Secondary Products: SDK/Tools** (Developer adoption drivers)
   - Node.js SDK (`@parserator/sdk`) - FREE, drives API usage
   - Python SDK (`parserator-python`) - FREE, drives API usage  
   - MCP Service for AI agents - FREE, drives API usage
   - CLI tools for development - FREE, drives API usage
   - Platform extensions (Zapier, Make) - FREE, drives API usage

**Business Model**: Like Stripe, OpenAI, Twilio - Core paid API + free tools that drive usage

---

## **Instructions for AI Development Agent**

1. Review the `_supporting_docs` directory - they are the source of truth
2. For each task below, create a new AI conversation
3. Use the `<master_prompt_template>` - paste supporting docs into `<context>` and specific task into `<instructions>`
4. Build PRODUCTION-READY code only - no demos, no shortcuts
5. Focus on getting to market FAST with the core SaaS API

---

## **`<master_prompt_template>`**

```xml
<role>
You are a senior software engineer building Parserator - a hybrid SaaS API + SDK business for intelligent data parsing. You specialize in TypeScript, Google Cloud Platform, LLM integration, and building production SaaS APIs. You write production-ready code that can handle real customers and real revenue immediately.
</role>
<context>
<!-- **PASTE THE ENTIRE CONTENTS OF _supporting_docs/1_project_definition.md HERE** -->
<!-- **PASTE THE ENTIRE CONTENTS OF _supporting_docs/2_style_guide.md HERE** -->
</context>
<instructions>
<!-- **PASTE THE SPECIFIC <prompt_instructions> FOR THE CURRENT TASK HERE** -->
</instructions>
<output_format>
Provide complete, production-ready code for each requested file. Enclose each file's content within a markdown code block, specifying the language and full file path as a comment.
</output_format>
```

---

## **DEVELOPMENT TASK QUEUE (Priority Order for Market Launch)**

### **PHASE 1: CORE SAAS API (Revenue Foundation)**

#### **Task 1.1: Define SearchPlan Interface**
<prompt_instructions>
Create the file `packages/api/src/interfaces/search-plan.interface.ts`.

Define TypeScript interfaces for the Architect-Extractor pattern:
- `ISearchStep` with properties: targetKey, description, searchInstruction, validationType, isRequired
- `ISearchPlan` with properties: steps, totalSteps, estimatedComplexity, architectConfidence
- `IArchitectResult` and `IExtractorResult` for stage outputs
- `IParseResult` for the final API response
- Include comprehensive JSDoc comments
- Export all interfaces
</prompt_instructions>

#### **Task 1.2: Gemini LLM Service**
<prompt_instructions>
Create the file `packages/api/src/services/llm.service.ts`.

Build a production service for calling Gemini 1.5 Flash:
- Class `GeminiService` with API key authentication
- Method `callGemini(prompt: string, options?: LLMOptions): Promise<LLMResponse>`
- Robust error handling with retry logic (exponential backoff)
- Token usage tracking and logging
- Response validation and JSON parsing
- Rate limiting and timeout handling
- Support for different model variants
- Comprehensive logging for debugging
</prompt_instructions>

#### **Task 1.3: Architect Service (Stage 1)**
<prompt_instructions>
Create the file `packages/api/src/services/architect.service.ts`.

Build the service for the first LLM call (The Architect):
- Class `ArchitectService` that uses `GeminiService`
- Method `generateSearchPlan(outputSchema: object, dataSample: string, userInstructions?: string): Promise<IArchitectResult>`
- Create optimized prompts that instruct Gemini to analyze the schema and data sample
- Return a structured `SearchPlan` JSON object
- Include confidence scoring and complexity estimation
- Handle prompt engineering for maximum accuracy
- Validate the generated SearchPlan before returning
- Log token usage and performance metrics
</prompt_instructions>

#### **Task 1.4: Extractor Service (Stage 2)**
<prompt_instructions>
Create the file `packages/api/src/services/extractor.service.ts`.

Build the service for the second LLM call (The Extractor):
- Class `ExtractorService` that uses `GeminiService`
- Method `executeSearchPlan(fullInputData: string, searchPlan: ISearchPlan): Promise<IExtractorResult>`
- Create efficient prompts focused on execution, not reasoning
- Use the SearchPlan to guide extraction with minimal token usage
- Return structured JSON data matching the original schema
- Include field-level confidence scoring
- Handle partial extraction failures gracefully
- Validate extracted data against expected types
</prompt_instructions>

#### **Task 1.5: Main Parse Orchestrator**
<prompt_instructions>
Create the file `packages/api/src/services/parse.service.ts`.

Build the main orchestration service that coordinates the two-stage process:
- Class `ParseService` that uses both `ArchitectService` and `ExtractorService`
- Method `parse(inputData: string, outputSchema: object, instructions?: string): Promise<IParseResult>`
- Create intelligent data sampling (first ~1000 chars for Architect)
- Execute Architect → Extractor workflow with error handling
- Combine results and calculate overall confidence scores
- Track total token usage and processing time
- Implement fallback strategies if either stage fails
- Return comprehensive results matching the API specification
</prompt_instructions>

#### **Task 1.6: API Authentication & Rate Limiting**
<prompt_instructions>
Create the file `packages/api/src/middleware/auth.middleware.ts`.

Build production authentication middleware:
- API key validation against Firestore
- Rate limiting based on subscription tiers (Free: 100/month, Startup: 2000/month, etc.)
- Usage tracking and quota enforcement
- Request logging and analytics
- Error responses for invalid/expired keys
- Support for both test keys (pk_test_) and live keys (pk_live_)
- Integration with billing system for usage-based pricing
</prompt_instructions>

#### **Task 1.7: Main API Endpoint**
<prompt_instructions>
Create the file `packages/api/src/index.ts`.

Build the main Cloud Function HTTP endpoint:
- `POST /v1/parse` endpoint using Express
- Request validation using Zod schemas
- Authentication middleware integration
- Call `ParseService.parse()` with request data
- Return standardized JSON responses (success/error)
- Comprehensive error handling with appropriate HTTP status codes
- CORS configuration for web clients
- Request/response logging for monitoring
- Performance metrics tracking
</prompt_instructions>

### **PHASE 2: SDK FOR DEVELOPER ADOPTION**

#### **Task 2.1: Node.js SDK Core**
<prompt_instructions>
Create the file `packages/sdk-node/src/index.ts`.

Build the main Node.js SDK that calls the SaaS API:
- Class `Parserator` with API key authentication
- Method `parse(options: ParseOptions): Promise<ParseResult>`
- HTTP client with retry logic and error handling
- TypeScript support with full type definitions
- Automatic token usage tracking
- Rate limiting awareness and queuing
- Simple developer experience (2-3 lines of code to parse)
- Comprehensive error messages with actionable guidance
</prompt_instructions>

#### **Task 2.2: Python SDK**
<prompt_instructions>
Create the file `packages/sdk-python/parserator/__init__.py`.

Build the Python SDK for data science workflows:
- Class `Parserator` with similar API to Node.js version
- HTTP client using requests library
- Type hints for modern Python development
- Pandas DataFrame integration for data science use cases
- Async support for high-throughput applications
- Error handling with descriptive exceptions
- Documentation examples for Jupyter notebooks
</prompt_instructions>

### **PHASE 3: DEPLOYMENT & LAUNCH**

#### **Task 3.1: Firebase Configuration**
<prompt_instructions>
Create Firebase deployment configuration files:
- `firebase.json` for Cloud Functions deployment
- `firestore.rules` for database security
- `.firebaserc` for project configuration
- Environment setup for API keys and configuration
- Production-ready security rules
- Monitoring and alerting configuration
</prompt_instructions>

#### **Task 3.2: API Documentation**
<prompt_instructions>
Create comprehensive API documentation:
- OpenAPI/Swagger specification
- Interactive examples with real data
- SDK usage examples for Node.js and Python
- Error code reference
- Rate limiting documentation
- Pricing tier explanations
- Migration guides from competitors
</prompt_instructions>

---

## **SUCCESS CRITERIA FOR MARKET LAUNCH**

1. **Core SaaS API works end-to-end** with real Gemini integration
2. **Authentication and billing** tracks usage correctly  
3. **Node.js SDK** provides excellent developer experience
4. **Documentation** enables self-service onboarding
5. **Pricing tiers** are implemented and functional
6. **Error handling** provides actionable feedback
7. **Performance** meets targets (<3s response time, 99.9% uptime)

**Target: Launch in 2-3 weeks with paying customers**