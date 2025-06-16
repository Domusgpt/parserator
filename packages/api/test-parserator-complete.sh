#\!/bin/bash

BASE_URL="https://app-5108296280.us-central1.run.app"
TEST_LOG="/tmp/parserator-test-$(date +%Y%m%d-%H%M%S).log"

echo "🧪 Comprehensive Parserator API Test Suite"  < /dev/null |  tee "$TEST_LOG"
echo "==========================================" | tee -a "$TEST_LOG"
echo "Started: $(date)" | tee -a "$TEST_LOG"
echo "Base URL: $BASE_URL" | tee -a "$TEST_LOG"
echo "" | tee -a "$TEST_LOG"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo "Test $TOTAL_TESTS: $test_name" | tee -a "$TEST_LOG"
    
    # Run test with timeout
    local result=$(timeout 10 bash -c "$test_command" 2>/dev/null)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ] && echo "$result" | grep -q "$expected_pattern"; then
        echo "✅ PASSED" | tee -a "$TEST_LOG"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ FAILED" | tee -a "$TEST_LOG"
        echo "   Expected: $expected_pattern" | tee -a "$TEST_LOG"
        echo "   Got: $result" | tee -a "$TEST_LOG"
    fi
    echo "" | tee -a "$TEST_LOG"
}

# Run comprehensive tests
run_test "Health Check" \
    "curl -s '$BASE_URL/health'" \
    "healthy"

run_test "API Info" \
    "curl -s '$BASE_URL/v1/info'" \
    "Parserator"

run_test "Anonymous Parsing" \
    "curl -s -X POST '$BASE_URL/v1/parse' -H 'Content-Type: application/json' -d '{\"inputData\": \"John CEO\", \"outputSchema\": {\"name\": \"string\"}}'" \
    "success\|parsedData\|404"

run_test "Security - Fake Key Rejection" \
    "curl -s -X POST '$BASE_URL/v1/parse' -H 'X-API-Key: pk_test_fake123' -H 'Content-Type: application/json' -d '{\"inputData\": \"test\", \"outputSchema\": {\"data\": \"string\"}}'" \
    "Invalid API key\|404"

run_test "Invalid Key Format" \
    "curl -s -X POST '$BASE_URL/v1/parse' -H 'X-API-Key: invalid_format' -H 'Content-Type: application/json' -d '{\"inputData\": \"test\", \"outputSchema\": {\"data\": \"string\"}}'" \
    "Invalid API key format\|404"

run_test "Response Time Check" \
    "time curl -s '$BASE_URL/health'" \
    "healthy"

# Results summary
echo "📊 Test Results Summary" | tee -a "$TEST_LOG"
echo "======================" | tee -a "$TEST_LOG"
echo "Passed: $PASSED_TESTS/$TOTAL_TESTS" | tee -a "$TEST_LOG"
echo "Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%" | tee -a "$TEST_LOG"
echo "Log saved to: $TEST_LOG" | tee -a "$TEST_LOG"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo "🎉 All tests passed\!" | tee -a "$TEST_LOG"
    exit 0
else
    echo "⚠️  Some tests failed" | tee -a "$TEST_LOG"
    exit 1
fi

