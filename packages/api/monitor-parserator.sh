#\!/bin/bash

# Parserator Project Monitoring Dashboard
echo "📊 Parserator Development Dashboard"
echo "==================================="
echo "Started: $(date)"
echo ""

# Function to check API health
check_api_health() {
    local response=$(curl -s -w "%{http_code}" "https://app-5108296280.us-central1.run.app/health")
    local body="${response%???}"
    local status_code="${response:${#response}-3:3}"
    
    if [ "$status_code" = "200" ]; then
        echo "✅ API Status: HEALTHY ($status_code)"
        echo "   Response: $body"  < /dev/null |  head -100
    else
        echo "❌ API Status: UNHEALTHY ($status_code)"
    fi
}

# Function to check Firebase project status
check_firebase_status() {
    echo "🔥 Firebase Status:"
    local project=$(firebase use 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "   Project: $project"
        local functions=$(firebase functions:list 2>/dev/null | wc -l)
        echo "   Functions: $functions deployed"
    else
        echo "   ❌ Not authenticated or no project set"
    fi
}

# Function to check recent deployments
check_recent_activity() {
    echo "📈 Recent Activity:"
    if command -v firebase >/dev/null; then
        echo "   Last deployment logs:"
        firebase functions:log --limit 5 2>/dev/null | head -10 || echo "   No recent logs available"
    else
        echo "   Firebase CLI not available"
    fi
}

# Function to check project health
check_project_health() {
    echo "🛠️ Project Health:"
    
    # Check if we're in project directory
    if [ -f "package.json" ]; then
        echo "   ✅ In project directory"
        
        # Check if built
        if [ -d "lib" ]; then
            echo "   ✅ Project built (lib/ exists)"
            local files=$(ls lib/*.js 2>/dev/null | wc -l)
            echo "   📦 Built files: $files"
        else
            echo "   ❌ Project not built (missing lib/)"
        fi
        
        # Check dependencies
        if [ -d "node_modules" ]; then
            echo "   ✅ Dependencies installed"
        else
            echo "   ❌ Dependencies not installed"
        fi
    else
        echo "   ❌ Not in project directory"
    fi
}

# Main dashboard loop
while true; do
    clear
    echo "📊 Parserator Development Dashboard - $(date)"
    echo "=============================================="
    echo ""
    
    check_api_health
    echo ""
    
    check_firebase_status
    echo ""
    
    check_project_health
    echo ""
    
    check_recent_activity
    echo ""
    
    echo "🔄 Auto-refresh in 30 seconds (Ctrl+C to exit)"
    echo "⚡ Quick commands: ./firebase-deploy-enhanced.sh | ./test-parserator-complete.sh"
    
    # Wait 30 seconds or until interrupted
    sleep 30
done

