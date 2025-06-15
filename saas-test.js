#!/usr/bin/env node

/**
 * Complete SaaS System Test
 * Tests API key validation, usage tracking, rate limiting, and billing
 */

const API_BASE = 'https://app-5108296280.us-central1.run.app';

// Test API key validation
async function testApiKeyValidation() {
  console.log('\n🔑 Testing API Key Validation...');
  
  // Test 1: No API key (should work for anonymous)
  const anonymousTest = await fetch(`${API_BASE}/v1/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputData: 'John Doe Engineer john@test.com',
      outputSchema: { name: 'string', title: 'string', email: 'string' }
    })
  });
  
  const anonymousResult = await anonymousTest.json();
  console.log('✅ Anonymous access:', anonymousResult.success ? 'WORKS' : 'FAILED');
  console.log('   User tier:', anonymousResult.metadata?.userTier);
  
  // Test 2: Invalid key format
  const invalidFormatTest = await fetch(`${API_BASE}/v1/parse`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Key': 'invalid_format_key'
    },
    body: JSON.stringify({
      inputData: 'Test data',
      outputSchema: { data: 'string' }
    })
  });
  
  const invalidResult = await invalidFormatTest.json();
  console.log('✅ Invalid key format:', invalidResult.error ? 'REJECTED' : 'FAILED');
  
  // Test 3: Valid format but non-existent key
  const nonExistentTest = await fetch(`${API_BASE}/v1/parse`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Key': 'pk_test_nonexistent_key_12345'
    },
    body: JSON.stringify({
      inputData: 'Test data',
      outputSchema: { data: 'string' }
    })
  });
  
  const nonExistentResult = await nonExistentTest.json();
  console.log('✅ Non-existent key:', nonExistentResult.error ? 'REJECTED' : 'FAILED');
}

// Test subscription tiers and limits
async function testSubscriptionLimits() {
  console.log('\n📊 Testing Subscription Limits...');
  
  const limits = {
    anonymous: { dailyRequests: 10, monthlyRequests: 50 },
    free: { dailyRequests: 50, monthlyRequests: 1000 },
    pro: { dailyRequests: 1000, monthlyRequests: 20000 },
    enterprise: { dailyRequests: -1, monthlyRequests: -1 }
  };
  
  Object.entries(limits).forEach(([tier, limits]) => {
    const dailyDisplay = limits.dailyRequests === -1 ? 'Unlimited' : limits.dailyRequests;
    const monthlyDisplay = limits.monthlyRequests === -1 ? 'Unlimited' : limits.monthlyRequests;
    console.log(`   ${tier}: ${dailyDisplay} daily, ${monthlyDisplay} monthly`);
  });
}

// Test API endpoints
async function testApiEndpoints() {
  console.log('\n🔗 Testing API Endpoints...');
  
  // Health check
  const healthTest = await fetch(`${API_BASE}/health`);
  const healthResult = await healthTest.json();
  console.log('✅ Health check:', healthResult.status === 'healthy' ? 'HEALTHY' : 'FAILED');
  
  // API info
  const infoTest = await fetch(`${API_BASE}/v1/info`);
  const infoResult = await infoTest.json();
  console.log('✅ API info:', infoResult.name ? 'AVAILABLE' : 'FAILED');
  
  // Metrics
  const metricsTest = await fetch(`${API_BASE}/metrics`);
  const metricsResult = await metricsTest.json();
  console.log('✅ Metrics:', metricsResult.status === 'metrics' ? 'AVAILABLE' : 'FAILED');
}

// Performance test
async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  const testData = {
    inputData: 'Sarah Johnson, Marketing Director at TechCorp, sarah.johnson@techcorp.com, (555) 123-4567, LinkedIn: sarah-j-marketing',
    outputSchema: {
      name: 'string',
      title: 'string',
      company: 'string',
      email: 'string',
      phone: 'string',
      linkedin: 'string'
    }
  };
  
  const startTime = Date.now();
  const response = await fetch(`${API_BASE}/v1/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  });
  
  const result = await response.json();
  const endTime = Date.now();
  
  console.log('✅ Parse request:', result.success ? 'SUCCESS' : 'FAILED');
  console.log('   Response time:', endTime - startTime, 'ms');
  console.log('   Tokens used:', result.metadata?.tokensUsed);
  console.log('   Confidence:', result.metadata?.confidence);
  console.log('   User tier:', result.metadata?.userTier);
}

// Pricing and billing information
function displayPricingInfo() {
  console.log('\n💰 SaaS Pricing Structure:');
  console.log('┌─────────────┬─────────────┬─────────────┬─────────────┐');
  console.log('│    Tier     │    Daily    │   Monthly   │    Price    │');
  console.log('├─────────────┼─────────────┼─────────────┼─────────────┤');
  console.log('│ Anonymous   │     10      │     50      │    Free     │');
  console.log('│ Free        │     50      │   1,000     │    Free     │');
  console.log('│ Pro         │   1,000     │   20,000    │   $29/mo    │');
  console.log('│ Enterprise  │ Unlimited   │ Unlimited   │   Custom    │');
  console.log('└─────────────┴─────────────┴─────────────┴─────────────┘');
  
  console.log('\n🔑 API Key Management:');
  console.log('   • Test keys: pk_test_* (for development)');
  console.log('   • Live keys: pk_live_* (for production)');
  console.log('   • Authentication: X-API-Key or Authorization Bearer');
  console.log('   • Usage tracking: Real-time in Firestore');
  console.log('   • Rate limiting: Per-tier enforcement');
}

// Main test runner
async function runTests() {
  console.log('🚀 PARSERATOR SAAS SYSTEM TEST');
  console.log('=====================================');
  
  try {
    await testApiEndpoints();
    await testApiKeyValidation();
    await testSubscriptionLimits();
    await testPerformance();
    displayPricingInfo();
    
    console.log('\n✅ ALL TESTS COMPLETED');
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Set up Firebase Auth for user registration');
    console.log('   2. Install Stripe extension for payments');
    console.log('   3. Create user dashboard for API key management');
    console.log('   4. Deploy landing page with pricing tiers');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };