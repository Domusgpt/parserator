#!/bin/bash
echo "🔮 Starting Crystal Grimoire Development..."
# Start Firebase emulators
firebase emulators:start --only functions,firestore,hosting
