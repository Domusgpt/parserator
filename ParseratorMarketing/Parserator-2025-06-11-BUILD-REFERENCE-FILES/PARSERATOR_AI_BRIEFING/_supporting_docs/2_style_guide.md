# **Parserator: Code & Style Guide v2.0**

This document outlines the coding standards for the Parserator project. The AI development agent MUST follow these guidelines for consistent, production-ready code.

## **1. GENERAL PRINCIPLES**

### **Production-First Mindset**
- **No shortcuts**: Every line of code must be production-ready
- **No placeholders**: No TODOs, no temporary solutions, no demo code
- **Revenue-ready**: Code must handle real customers and real money
- **Token optimization**: Always consider LLM token costs in design

### **Code Quality Standards**
- **Strongly Typed**: 100% TypeScript with strict mode
- **Clear over clever**: Readable code that new developers can understand
- **Modular design**: Single responsibility principle for all functions
- **Error-first**: Comprehensive error handling at every level

## **2. TYPESCRIPT CONVENTIONS**

### **File Naming**
- Use `kebab-case.ts` for all files
- Service files: `service-name.service.ts`
- Interface files: `interface-name.interface.ts`
- Utility files: `utility-name.utils.ts`

### **Naming Conventions**
```typescript
// Variables and functions - camelCase
const apiKey = 'pk_live_xxx';
const parseData = async () => {};

// Classes - PascalCase
class ArchitectService {}
class ParseResult {}

// Interfaces - PascalCase with 'I' prefix
interface ISearchPlan {}
interface IParseRequest {}

// Enums - PascalCase with descriptive suffixes
enum ValidationTypeEnum {}
enum ErrorCodeEnum {}

// Constants - UPPER_SNAKE_CASE
const MAX_TOKEN_LIMIT = 100000;
const DEFAULT_TIMEOUT_MS = 30000;
```

### **Interface Design**
```typescript
/**
 * Always include comprehensive JSDoc comments
 * Describe the purpose, parameters, and return values
 */
interface ISearchStep {
  /** The key for the output JSON object */
  targetKey: string;
  
  /** Human-readable description of what this data represents */
  description: string;
  
  /** Direct instruction for the Extractor LLM */
  searchInstruction: string;
  
  /** Expected data type for validation */
  validationType: ValidationTypeEnum;
  
  /** Whether this field is required */
  isRequired: boolean;
}
```

## **3. ERROR HANDLING PATTERNS**

### **Custom Error Classes**
```typescript
// Base error class for all Parserator errors
class ParseatorError extends Error {
  constructor(
    message: string,
    public code: string,
    public stage: 'architect' | 'extractor' | 'validation',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ParseatorError';
  }
}

// Specific error types
class ArchitectError extends ParseatorError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ARCHITECT_FAILED', 'architect', details);
  }
}

class ExtractorError extends ParseatorError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'EXTRACTOR_FAILED', 'extractor', details);
  }
}
```

### **Error Handling Pattern**
```typescript
async function criticalOperation(): Promise<Result> {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    // Log the error with context
    logger.error('Operation failed', {
      operation: 'criticalOperation',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Throw appropriate custom error
    throw new ArchitectError(
      'Failed to create search plan. Please check your output schema.',
      { 
        originalError: error.message,
        operation: 'criticalOperation'
      }
    );
  }
}
```

## **4. LLM INTEGRATION STANDARDS**

### **Token Optimization**
```typescript
class TokenOptimizer {
  /**
   * Extract intelligent sample from input data
   * Prioritize structured content and avoid cutting mid-sentence
   */
  extractSample(inputData: string, maxLength: number = 1000): string {
    if (inputData.length <= maxLength) return inputData;
    
    // Try to break at natural boundaries
    const sentences = inputData.match(/[^.!?]+[.!?]+/g) || [];
    let sample = '';
    
    for (const sentence of sentences) {
      if ((sample + sentence).length > maxLength) break;
      sample += sentence;
    }
    
    return sample || inputData.substring(0, maxLength);
  }
}
```

### **LLM Response Handling**
```typescript
interface ILLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
  finishReason: string;
}

class LLMService {
  async callWithRetry(prompt: string, maxRetries: number = 3): Promise<ILLMResponse> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const response = await this.callGemini(prompt);
        
        // Validate response
        if (!response.content || response.content.trim().length === 0) {
          throw new Error('Empty response from LLM');
        }
        
        return response;
      } catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          throw new LLMError(`LLM call failed after ${maxRetries} attempts`, {
            originalError: error.message,
            prompt: prompt.substring(0, 200) + '...'
          });
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }
}
```

## **5. VALIDATION PATTERNS**

### **Input Validation with Zod**
```typescript
import { z } from 'zod';

const ParseRequestSchema = z.object({
  inputData: z.string()
    .min(1, 'Input data cannot be empty')
    .max(100000, 'Input data too large (max 100KB)'),
  
  outputSchema: z.object({})
    .refine(obj => Object.keys(obj).length > 0, 'Output schema cannot be empty'),
  
  instructions: z.string().optional()
});

type ParseRequest = z.infer<typeof ParseRequestSchema>;

// Usage in endpoint
app.post('/v1/parse', async (req, res) => {
  try {
    const validated = ParseRequestSchema.parse(req.body);
    // Process validated request...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request format',
          details: error.errors
        }
      });
    }
  }
});
```

## **6. LOGGING STANDARDS**

### **Structured Logging**
```typescript
interface ILogContext {
  userId?: string;
  requestId: string;
  operation: string;
  stage?: 'architect' | 'extractor' | 'validation';
  tokensUsed?: number;
  processingTimeMs?: number;
}

class Logger {
  info(message: string, context: ILogContext): void {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
  
  error(message: string, context: ILogContext & { error?: string }): void {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
}

// Usage
logger.info('Parse request started', {
  requestId: 'req_123',
  operation: 'parse',
  userId: 'user_456'
});
```

## **7. TESTING STANDARDS**

### **Test File Structure**
```typescript
// architect.service.test.ts
describe('ArchitectService', () => {
  let service: ArchitectService;
  let mockLLMService: jest.Mocked<LLMService>;
  
  beforeEach(() => {
    mockLLMService = createMockLLMService();
    service = new ArchitectService(mockLLMService);
  });
  
  describe('generateSearchPlan', () => {
    it('should create valid search plan for simple schema', async () => {
      // Arrange
      const schema = { name: 'string', email: 'string' };
      const sample = 'John Doe john@example.com';
      
      mockLLMService.callGemini.mockResolvedValue({
        content: JSON.stringify({
          steps: [
            {
              targetKey: 'name',
              description: 'Person name',
              searchInstruction: 'Find the person name',
              validationType: 'string',
              isRequired: true
            }
          ],
          totalSteps: 1,
          estimatedComplexity: 'low',
          architectConfidence: 0.9
        }),
        tokensUsed: 150,
        model: 'gemini-1.5-flash'
      });
      
      // Act
      const result = await service.generateSearchPlan(schema, sample);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.searchPlan.steps).toHaveLength(1);
      expect(result.tokensUsed).toBe(150);
    });
    
    it('should handle LLM failures gracefully', async () => {
      // Test error scenarios...
    });
  });
});
```

## **8. PERFORMANCE STANDARDS**

### **Monitoring Points**
```typescript
class PerformanceMonitor {
  startTimer(operation: string): () => number {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.recordMetric(operation, duration);
      return duration;
    };
  }
  
  recordTokenUsage(stage: string, tokens: number): void {
    // Record for billing and optimization
  }
  
  recordCacheHit(key: string): void {
    // Track cache performance
  }
}

// Usage
const timer = monitor.startTimer('architect_stage');
const result = await architectService.generatePlan(schema, sample);
const duration = timer();

monitor.recordTokenUsage('architect', result.tokensUsed);
```

## **9. SECURITY REQUIREMENTS**

### **API Key Validation**
```typescript
class AuthService {
  async validateApiKey(key: string): Promise<IApiKeyData> {
    // Never log full API keys
    const keyPrefix = key.substring(0, 12) + '...';
    
    try {
      // Hash the key for lookup
      const hashedKey = this.hashApiKey(key);
      const keyData = await this.findKeyByHash(hashedKey);
      
      if (!keyData) {
        throw new AuthError('Invalid API key', { keyPrefix });
      }
      
      if (!keyData.isActive) {
        throw new AuthError('API key is disabled', { keyPrefix });
      }
      
      return keyData;
    } catch (error) {
      logger.error('API key validation failed', {
        operation: 'validateApiKey',
        keyPrefix,
        error: error.message
      });
      throw error;
    }
  }
}
```

## **10. PRODUCTION DEPLOYMENT CHECKLIST**

Before any code is considered production-ready:

- [ ] **Error Handling**: All failure modes covered with appropriate errors
- [ ] **Logging**: Structured logs for monitoring and debugging  
- [ ] **Testing**: Unit tests + integration tests with >90% coverage
- [ ] **Performance**: Token usage optimized and monitored
- [ ] **Security**: Input validation, API key protection, rate limiting
- [ ] **Documentation**: JSDoc comments on all public functions
- [ ] **Monitoring**: Health checks and alerting configured
- [ ] **Scalability**: Can handle expected load with graceful degradation

## **11. GIT COMMIT STANDARDS**

### **Commit Message Format**
```
type(scope): description

feat(architect): add confidence scoring to search plans
fix(extractor): handle malformed JSON responses 
perf(llm): reduce token usage by 30% through prompt optimization
docs(api): add examples for complex schemas
test(integration): add real-world data parsing tests
```

### **Types**
- `feat`: New features
- `fix`: Bug fixes  
- `perf`: Performance improvements
- `docs`: Documentation updates
- `test`: Test additions/improvements
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

Remember: This is a production SaaS business. Every line of code must be ready to handle real customers, real money, and real scale from day one.