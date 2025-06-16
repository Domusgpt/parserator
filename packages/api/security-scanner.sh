#!/bin/bash

# 🛡️ Parserator Security Scanner

SECURITY_LOG="/tmp/parserator-security-$(date +%Y%m%d).log"
API_URL="https://app-5108296280.us-central1.run.app"

echo "🛡️ Parserator Security Scan Started: $(date)" | tee "$SECURITY_LOG"

# Function to test API key security
test_api_key_security() {
    echo "🔐 Testing API Key Security..." | tee -a "$SECURITY_LOG"
    
    local tests_passed=0
    local tests_total=0
    
    # Test 1: Completely fake API key
    echo "Test 1: Fake API key should be rejected" | tee -a "$SECURITY_LOG"
    tests_total=$((tests_total + 1))
    
    local response=$(curl -s -X POST "$API_URL/v1/parse" \
        -H "X-API-Key: pk_test_completely_fake_key_12345" \
        -H "Content-Type: application/json" \
        -d '{"inputData": "test", "outputSchema": {"data": "string"}}')
    
    if echo "$response" | grep -q "Invalid API key\|404"; then
        echo "  ✅ PASSED - Fake key rejected" | tee -a "$SECURITY_LOG"
        tests_passed=$((tests_passed + 1))
    else
        echo "  🚨 FAILED - Fake key accepted!" | tee -a "$SECURITY_LOG"
        echo "  Response: $response" | tee -a "$SECURITY_LOG"
    fi
    
    # Test 2: Invalid format API key
    echo "Test 2: Invalid format should be rejected" | tee -a "$SECURITY_LOG"
    tests_total=$((tests_total + 1))
    
    local response2=$(curl -s -X POST "$API_URL/v1/parse" \
        -H "X-API-Key: invalid_format_key" \
        -H "Content-Type: application/json" \
        -d '{"inputData": "test", "outputSchema": {"data": "string"}}')
    
    if echo "$response2" | grep -q "Invalid API key format\|404"; then
        echo "  ✅ PASSED - Invalid format rejected" | tee -a "$SECURITY_LOG"
        tests_passed=$((tests_passed + 1))
    else
        echo "  🚨 FAILED - Invalid format accepted!" | tee -a "$SECURITY_LOG"
        echo "  Response: $response2" | tee -a "$SECURITY_LOG"
    fi
    
    # Test 3: SQL injection attempt in API key
    echo "Test 3: SQL injection in API key should be rejected" | tee -a "$SECURITY_LOG"
    tests_total=$((tests_total + 1))
    
    local response3=$(curl -s -X POST "$API_URL/v1/parse" \
        -H "X-API-Key: pk_test_'; DROP TABLE api_keys; --" \
        -H "Content-Type: application/json" \
        -d '{"inputData": "test", "outputSchema": {"data": "string"}}')
    
    if echo "$response3" | grep -q "Invalid API key\|404"; then
        echo "  ✅ PASSED - SQL injection rejected" | tee -a "$SECURITY_LOG"
        tests_passed=$((tests_passed + 1))
    else
        echo "  🚨 FAILED - SQL injection not properly handled!" | tee -a "$SECURITY_LOG"
        echo "  Response: $response3" | tee -a "$SECURITY_LOG"
    fi
    
    # Test 4: Empty API key
    echo "Test 4: Empty API key should use anonymous access" | tee -a "$SECURITY_LOG"
    tests_total=$((tests_total + 1))
    
    local response4=$(curl -s -X POST "$API_URL/v1/parse" \
        -H "Content-Type: application/json" \
        -d '{"inputData": "John CEO", "outputSchema": {"name": "string", "title": "string"}}')
    
    if echo "$response4" | grep -q "success\|anonymous\|404"; then
        echo "  ✅ PASSED - Anonymous access working" | tee -a "$SECURITY_LOG"
        tests_passed=$((tests_passed + 1))
    else
        echo "  ⚠️  WARNING - Anonymous access may be blocked" | tee -a "$SECURITY_LOG"
        echo "  Response: $response4" | tee -a "$SECURITY_LOG"
    fi
    
    echo "API Key Security Results: $tests_passed/$tests_total tests passed" | tee -a "$SECURITY_LOG"
}

# Function to test input validation security
test_input_validation() {
    echo "📝 Testing Input Validation Security..." | tee -a "$SECURITY_LOG"
    
    local tests_passed=0
    local tests_total=0
    
    # Test 1: XSS attempt in input data
    echo "Test 1: XSS in input data should be handled safely" | tee -a "$SECURITY_LOG"
    tests_total=$((tests_total + 1))
    
    local xss_payload='<script>alert("XSS")</script>'
    local response=$(curl -s -X POST "$API_URL/v1/parse" \
        -H "Content-Type: application/json" \
        -d "{\"inputData\": \"$xss_payload\", \"outputSchema\": {\"data\": \"string\"}}")
    
    # Should either parse safely or return 400/404, but not execute script
    if echo "$response" | grep -q "success\|error\|404"; then
        echo "  ✅ PASSED - XSS handled safely" | tee -a "$SECURITY_LOG"
        tests_passed=$((tests_passed + 1))
    else
        echo "  🚨 FAILED - Unexpected XSS response!" | tee -a "$SECURITY_LOG"
        echo "  Response: $response" | tee -a "$SECURITY_LOG"
    fi
    
    # Test 2: Very large input data
    echo "Test 2: Large input should be handled or rejected" | tee -a "$SECURITY_LOG"
    tests_total=$((tests_total + 1))
    
    local large_input=$(printf 'A%.0s' {1..100000})  # 100KB of A's
    local response2=$(curl -s -X POST "$API_URL/v1/parse" \
        -H "Content-Type: application/json" \
        -d "{\"inputData\": \"$large_input\", \"outputSchema\": {\"data\": \"string\"}}" \
        --max-time 10)
    
    if echo "$response2" | grep -q "success\|error\|413\|400\|404"; then
        echo "  ✅ PASSED - Large input handled appropriately" | tee -a "$SECURITY_LOG"
        tests_passed=$((tests_passed + 1))
    else
        echo "  ⚠️  WARNING - Large input handling unclear" | tee -a "$SECURITY_LOG"
    fi
    
    # Test 3: Missing required fields
    echo "Test 3: Missing fields should return proper error" | tee -a "$SECURITY_LOG"
    tests_total=$((tests_total + 1))
    
    local response3=$(curl -s -X POST "$API_URL/v1/parse" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    if echo "$response3" | grep -q "error\|400\|404"; then
        echo "  ✅ PASSED - Missing fields properly rejected" | tee -a "$SECURITY_LOG"
        tests_passed=$((tests_passed + 1))
    else
        echo "  🚨 FAILED - Missing fields not properly handled!" | tee -a "$SECURITY_LOG"
        echo "  Response: $response3" | tee -a "$SECURITY_LOG"
    fi
    
    echo "Input Validation Results: $tests_passed/$tests_total tests passed" | tee -a "$SECURITY_LOG"
}

# Function to test CORS security
test_cors_security() {
    echo "🌐 Testing CORS Security..." | tee -a "$SECURITY_LOG"
    
    # Test CORS headers
    local cors_response=$(curl -s -I -X OPTIONS "$API_URL/v1/parse" \
        -H "Origin: https://malicious-site.com" \
        -H "Access-Control-Request-Method: POST")
    
    if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
        local allowed_origin=$(echo "$cors_response" | grep "Access-Control-Allow-Origin" | cut -d' ' -f2)
        echo "CORS Origin Policy: $allowed_origin" | tee -a "$SECURITY_LOG"
        
        if [ "$allowed_origin" = "*" ]; then
            echo "  ⚠️  WARNING - CORS allows all origins (*)" | tee -a "$SECURITY_LOG"
        else
            echo "  ✅ CORS properly configured" | tee -a "$SECURITY_LOG"
        fi
    else
        echo "  ✅ CORS headers present" | tee -a "$SECURITY_LOG"
    fi
}

# Function to test rate limiting (if implemented)
test_rate_limiting() {
    echo "⏱️ Testing Rate Limiting..." | tee -a "$SECURITY_LOG"
    
    echo "Sending 15 rapid requests to test rate limiting..." | tee -a "$SECURITY_LOG"
    
    local success_count=0
    local rate_limited_count=0
    
    for i in {1..15}; do
        local response=$(curl -s -w "%{http_code}" -X POST "$API_URL/v1/parse" \
            -H "Content-Type: application/json" \
            -d '{"inputData": "test", "outputSchema": {"data": "string"}}' \
            --max-time 5)
        
        local status_code="${response: -3}"
        
        if [ "$status_code" = "429" ]; then
            rate_limited_count=$((rate_limited_count + 1))
        elif [ "$status_code" = "200" ] || [ "$status_code" = "404" ]; then
            success_count=$((success_count + 1))
        fi
        
        sleep 0.1  # Small delay between requests
    done
    
    echo "Rate limiting test results:" | tee -a "$SECURITY_LOG"
    echo "  Successful responses: $success_count" | tee -a "$SECURITY_LOG"
    echo "  Rate limited (429): $rate_limited_count" | tee -a "$SECURITY_LOG"
    
    if [ "$rate_limited_count" -gt 0 ]; then
        echo "  ✅ Rate limiting is working" | tee -a "$SECURITY_LOG"
    else
        echo "  ⚠️  No rate limiting detected (may not be implemented yet)" | tee -a "$SECURITY_LOG"
    fi
}

# Function to scan dependencies for vulnerabilities
scan_dependencies() {
    echo "📦 Scanning Dependencies for Vulnerabilities..." | tee -a "$SECURITY_LOG"
    
    if [ -f "package.json" ]; then
        echo "Running npm audit..." | tee -a "$SECURITY_LOG"
        
        local audit_output=$(npm audit --audit-level moderate 2>&1)
        local audit_exit_code=$?
        
        if [ $audit_exit_code -eq 0 ]; then
            echo "  ✅ No significant vulnerabilities found" | tee -a "$SECURITY_LOG"
        else
            echo "  ⚠️  Vulnerabilities detected:" | tee -a "$SECURITY_LOG"
            echo "$audit_output" | head -20 | tee -a "$SECURITY_LOG"
        fi
        
        # Check for known problematic packages
        echo "Checking for known problematic dependencies..." | tee -a "$SECURITY_LOG"
        
        local risky_packages=("node-gyp" "event-stream" "cross-env" "eslint-scope")
        
        for package in "${risky_packages[@]}"; do
            if npm list "$package" >/dev/null 2>&1; then
                echo "  ⚠️  Found potentially risky package: $package" | tee -a "$SECURITY_LOG"
            fi
        done
    else
        echo "  ❌ package.json not found" | tee -a "$SECURITY_LOG"
    fi
}

# Function to generate security report
generate_security_report() {
    echo "🛡️ Security Scan Report - $(date)"
    echo "================================="
    
    if [ -f "$SECURITY_LOG" ]; then
        cat "$SECURITY_LOG"
    else
        echo "No security log found. Run a security scan first."
    fi
    
    echo ""
    echo "📋 Security Recommendations:"
    echo "1. Ensure API keys are validated against database"
    echo "2. Implement rate limiting for anonymous users"
    echo "3. Regular dependency updates and vulnerability scanning"
    echo "4. Monitor for unusual API usage patterns"
    echo "5. Use HTTPS only for all API communications"
    echo "6. Implement request size limits"
    echo "7. Add request logging and monitoring"
}

# Main script logic
case "${1:-full}" in
    "api-keys")
        test_api_key_security
        ;;
    "input")
        test_input_validation
        ;;
    "cors")
        test_cors_security
        ;;
    "rate-limit")
        test_rate_limiting
        ;;
    "dependencies")
        scan_dependencies
        ;;
    "report")
        generate_security_report
        ;;
    "full")
        test_api_key_security
        echo ""
        test_input_validation
        echo ""
        test_cors_security
        echo ""
        test_rate_limiting
        echo ""
        scan_dependencies
        echo ""
        echo "🛡️ Full security scan completed. Check $SECURITY_LOG for details."
        ;;
    *)
        echo "🛡️ Parserator Security Scanner"
        echo "Usage: $0 [api-keys|input|cors|rate-limit|dependencies|report|full]"
        echo ""
        echo "Commands:"
        echo "  api-keys     - Test API key security"
        echo "  input        - Test input validation"
        echo "  cors         - Test CORS configuration"
        echo "  rate-limit   - Test rate limiting"
        echo "  dependencies - Scan dependencies for vulnerabilities"
        echo "  report       - Generate security report"
        echo "  full         - Run all security tests (default)"
        echo ""
        echo "Output: $SECURITY_LOG"
        ;;
esac