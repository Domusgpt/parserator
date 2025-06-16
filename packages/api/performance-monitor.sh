#!/bin/bash

# 📊 Parserator Performance Monitoring System

PERFORMANCE_LOG="/tmp/parserator-performance-$(date +%Y%m%d).log"
ALERT_LOG="/tmp/parserator-alerts-$(date +%Y%m%d).log"
API_URL="https://app-5108296280.us-central1.run.app"

echo "📊 Parserator Performance Monitoring Started: $(date)" | tee -a "$PERFORMANCE_LOG"

# Performance thresholds (milliseconds)
RESPONSE_TIME_WARNING=2000
RESPONSE_TIME_CRITICAL=5000
ERROR_RATE_WARNING=5      # 5% error rate
ERROR_RATE_CRITICAL=10    # 10% error rate

# Function to measure response time
measure_response_time() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="${3:-}"
    
    local start_time=$(date +%s%3N)
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        local response=$(curl -s -w "%{http_code}" -X POST "$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        local response=$(curl -s -w "%{http_code}" "$endpoint" 2>/dev/null)
    fi
    
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    local status_code="${response: -3}"
    local body="${response%???}"
    
    echo "$response_time,$status_code,$endpoint"
}

# Function to check API health with detailed metrics
health_check() {
    echo "🔍 Health Check - $(date)" | tee -a "$PERFORMANCE_LOG"
    
    local health_result=$(measure_response_time "$API_URL/health")
    local response_time=$(echo "$health_result" | cut -d',' -f1)
    local status_code=$(echo "$health_result" | cut -d',' -f2)
    
    echo "Health endpoint: ${response_time}ms (Status: $status_code)" | tee -a "$PERFORMANCE_LOG"
    
    # Check thresholds
    if [ "$response_time" -gt "$RESPONSE_TIME_CRITICAL" ]; then
        echo "🚨 CRITICAL: Health response time ${response_time}ms > ${RESPONSE_TIME_CRITICAL}ms" | tee -a "$ALERT_LOG"
    elif [ "$response_time" -gt "$RESPONSE_TIME_WARNING" ]; then
        echo "⚠️  WARNING: Health response time ${response_time}ms > ${RESPONSE_TIME_WARNING}ms" | tee -a "$ALERT_LOG"
    fi
    
    if [ "$status_code" != "200" ]; then
        echo "🚨 CRITICAL: Health check failed with status $status_code" | tee -a "$ALERT_LOG"
    fi
}

# Function to test API parsing performance
parsing_performance_test() {
    echo "🧪 Parsing Performance Test - $(date)" | tee -a "$PERFORMANCE_LOG"
    
    local test_data='{"inputData": "John Smith CEO john@test.com", "outputSchema": {"name": "string", "title": "string", "email": "string"}}'
    local parse_result=$(measure_response_time "$API_URL/v1/parse" "POST" "$test_data")
    local response_time=$(echo "$parse_result" | cut -d',' -f1)
    local status_code=$(echo "$parse_result" | cut -d',' -f2)
    
    echo "Parse endpoint: ${response_time}ms (Status: $status_code)" | tee -a "$PERFORMANCE_LOG"
    
    # Parse-specific thresholds (parsing should be slower than health)
    local parse_warning=5000
    local parse_critical=10000
    
    if [ "$response_time" -gt "$parse_critical" ]; then
        echo "🚨 CRITICAL: Parse response time ${response_time}ms > ${parse_critical}ms" | tee -a "$ALERT_LOG"
    elif [ "$response_time" -gt "$parse_warning" ]; then
        echo "⚠️  WARNING: Parse response time ${response_time}ms > ${parse_warning}ms" | tee -a "$ALERT_LOG"
    fi
}

# Function to run load test
load_test() {
    echo "🔥 Load Test - $(date)" | tee -a "$PERFORMANCE_LOG"
    
    local concurrent_requests=10
    local total_requests=0
    local successful_requests=0
    local failed_requests=0
    local total_time=0
    
    echo "Running $concurrent_requests concurrent requests..."
    
    # Create temp file for results
    local temp_results="/tmp/load_test_results_$$"
    
    # Run concurrent requests
    for i in $(seq 1 $concurrent_requests); do
        {
            local result=$(measure_response_time "$API_URL/health")
            echo "$result" >> "$temp_results"
        } &
    done
    
    # Wait for all background jobs to complete
    wait
    
    # Analyze results
    while IFS= read -r line; do
        local response_time=$(echo "$line" | cut -d',' -f1)
        local status_code=$(echo "$line" | cut -d',' -f2)
        
        total_requests=$((total_requests + 1))
        total_time=$((total_time + response_time))
        
        if [ "$status_code" = "200" ]; then
            successful_requests=$((successful_requests + 1))
        else
            failed_requests=$((failed_requests + 1))
        fi
    done < "$temp_results"
    
    # Calculate metrics
    local avg_response_time=$((total_time / total_requests))
    local success_rate=$((successful_requests * 100 / total_requests))
    local error_rate=$((failed_requests * 100 / total_requests))
    
    echo "Load test results:" | tee -a "$PERFORMANCE_LOG"
    echo "  Requests: $total_requests" | tee -a "$PERFORMANCE_LOG"
    echo "  Successful: $successful_requests" | tee -a "$PERFORMANCE_LOG"
    echo "  Failed: $failed_requests" | tee -a "$PERFORMANCE_LOG"
    echo "  Success rate: ${success_rate}%" | tee -a "$PERFORMANCE_LOG"
    echo "  Error rate: ${error_rate}%" | tee -a "$PERFORMANCE_LOG"
    echo "  Average response time: ${avg_response_time}ms" | tee -a "$PERFORMANCE_LOG"
    
    # Check error rate thresholds
    if [ "$error_rate" -gt "$ERROR_RATE_CRITICAL" ]; then
        echo "🚨 CRITICAL: Error rate ${error_rate}% > ${ERROR_RATE_CRITICAL}%" | tee -a "$ALERT_LOG"
    elif [ "$error_rate" -gt "$ERROR_RATE_WARNING" ]; then
        echo "⚠️  WARNING: Error rate ${error_rate}% > ${ERROR_RATE_WARNING}%" | tee -a "$ALERT_LOG"
    fi
    
    # Cleanup
    rm -f "$temp_results"
}

# Function to monitor continuously
continuous_monitor() {
    echo "🔄 Starting continuous monitoring (Ctrl+C to stop)..."
    
    while true; do
        health_check
        echo ""
        
        # Run parsing test every 5th iteration
        if [ $(($(date +%s) % 300)) -lt 60 ]; then
            parsing_performance_test
            echo ""
        fi
        
        # Run load test every 10th iteration
        if [ $(($(date +%s) % 600)) -lt 60 ]; then
            load_test
            echo ""
        fi
        
        echo "Next check in 60 seconds..."
        sleep 60
    done
}

# Function to generate performance report
generate_report() {
    echo "📊 Performance Report - $(date)"
    echo "================================="
    
    if [ -f "$PERFORMANCE_LOG" ]; then
        echo "Recent performance data:"
        tail -20 "$PERFORMANCE_LOG"
        echo ""
    fi
    
    if [ -f "$ALERT_LOG" ]; then
        echo "Recent alerts:"
        tail -10 "$ALERT_LOG"
        echo ""
    fi
    
    echo "Response time trends (last 24 hours):"
    if [ -f "$PERFORMANCE_LOG" ]; then
        grep "Health endpoint:" "$PERFORMANCE_LOG" | tail -24 | while read -r line; do
            echo "  $line"
        done
    fi
}

# Main script logic
case "${1:-monitor}" in
    "health")
        health_check
        ;;
    "parse")
        parsing_performance_test
        ;;
    "load")
        load_test
        ;;
    "report")
        generate_report
        ;;
    "monitor")
        continuous_monitor
        ;;
    *)
        echo "📊 Parserator Performance Monitor"
        echo "Usage: $0 [health|parse|load|report|monitor]"
        echo ""
        echo "Commands:"
        echo "  health  - Single health check"
        echo "  parse   - Single parsing performance test"
        echo "  load    - Single load test"
        echo "  report  - Generate performance report"
        echo "  monitor - Continuous monitoring (default)"
        echo ""
        echo "Logs:"
        echo "  Performance: $PERFORMANCE_LOG"
        echo "  Alerts: $ALERT_LOG"
        ;;
esac