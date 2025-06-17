#!/bin/bash
# Quick development helper for Parserator

case "$1" in
    "start"|"dev")
        echo "🚀 Starting Parserator development server..."
        npm run dev
        ;;
    "test")
        echo "🧪 Running tests..."
        npm test
        ;;
    "build")
        echo "🔨 Building project..."
        npm run build
        ;;
    "deploy")
        echo "🚀 Deploying to Firebase..."
        firebase deploy
        ;;
    "logs")
        echo "📋 Viewing logs..."
        firebase functions:log --project parserator-production
        ;;
    "install")
        echo "📦 Installing dependencies..."
        npm install
        ;;
    "clean")
        echo "🧹 Cleaning project..."
        rm -rf node_modules package-lock.json
        npm install
        ;;
    "prompts")
        echo "🔧 Updating to sophisticated prompts..."
        echo "Check SOPHISTICATED_PROMPTS_RECONSTRUCTION.md for implementation"
        ;;
    *)
        echo "Parserator Development Helper"
        echo "Usage: ./dev.sh {start|test|build|deploy|logs|install|clean|prompts}"
        echo ""
        echo "Commands:"
        echo "  start/dev  - Start development server"
        echo "  test       - Run tests"
        echo "  build      - Build project"
        echo "  deploy     - Deploy to Firebase"
        echo "  logs       - View Firebase logs"
        echo "  install    - Install dependencies"
        echo "  clean      - Clean and reinstall dependencies"
        echo "  prompts    - Info about sophisticated prompts"
        ;;
esac
