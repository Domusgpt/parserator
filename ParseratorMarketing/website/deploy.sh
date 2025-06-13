#!/bin/bash

# Parserator Marketing Website Deployment Script
# This deploys your marketing website to Firebase Hosting

echo "🚀 Deploying Parserator Marketing Website..."

# Create a simple Firebase hosting config if not exists
if [ ! -f "firebase.json" ]; then
  cat > firebase.json << EOF
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
EOF
fi

# Create .firebaserc if not exists
if [ ! -f ".firebaserc" ]; then
  cat > .firebaserc << EOF
{
  "projects": {
    "default": "parserator-production"
  }
}
EOF
fi

echo "📦 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Marketing website deployed!"
echo "🌐 Visit your site at: https://parserator-production.web.app"