#!/bin/bash
# Build script for Curtain Chrome Extension
# Creates a .zip file ready for Chrome Web Store upload

set -e

EXTENSION_NAME="curtain-extension"
VERSION=$(grep '"version"' manifest.json | sed 's/.*: "\(.*\)".*/\1/')
OUTPUT="${EXTENSION_NAME}-v${VERSION}.zip"

echo "Building ${OUTPUT}..."

# Remove old build
rm -f "$OUTPUT"

# Create zip with only the necessary files
zip -r "$OUTPUT" \
  manifest.json \
  background.js \
  popup.html \
  popup.css \
  popup.js \
  icons/ \
  -x "icons/.DS_Store" \
  -x ".DS_Store"

echo ""
echo "Build complete: ${OUTPUT}"
echo "Size: $(du -h "$OUTPUT" | cut -f1)"
echo ""
echo "Upload this file to: https://chrome.google.com/webstore/devconsole"
