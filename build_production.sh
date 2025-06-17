#!/bin/bash
echo "🔮 Building for production..."
flutter clean
flutter pub get
flutter build web --release \
  --dart-define=PRODUCTION=true \
  --dart-define=GEMINI_API_KEY="AIzaSyC__1EHCjv9pCRJzQoRQiKVxTfaPMXFXAs" \
  --dart-define=FIREBASE_PROJECT_ID="crystalgrimoire-v3-production"
echo "✅ Build complete!"
