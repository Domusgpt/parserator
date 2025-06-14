#!/bin/bash

# Build script for Parserator Chrome Extension

echo "Building Parserator Chrome Extension..."

# Create dist directory
mkdir -p dist

# Copy source files
echo "Copying source files..."
cp -r src dist/

# Copy assets
echo "Copying assets..."
cp -r assets dist/

# Copy manifest
echo "Copying manifest..."
cp manifest.json dist/

# Icons are already copied with assets - no need for placeholders
echo "Icons already available in assets directory"

echo "Build complete! Extension files are in the 'dist' directory."
echo ""
echo "To install:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked' and select the 'dist' directory"
echo ""
echo "To package:"
echo "cd dist && zip -r ../parserator-chrome-extension.zip ."