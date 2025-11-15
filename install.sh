#!/usr/bin/env bash

set -e

# Installation script for obsidian-cli

INSTALL_DIR="${HOME}/bin"
BINARY_NAME="obsidian"
BUILD_FILE="./dist/obsidian-cli"

echo "Installing obsidian-cli..."

# Check if dist/obsidian-cli exists
if [ ! -f "$BUILD_FILE" ]; then
    echo "❌ Error: $BUILD_FILE not found"
    echo "   Please run 'bun run build' first"
    exit 1
fi

# Create install directory if it doesn't exist
if [ ! -d "$INSTALL_DIR" ]; then
    echo "📁 Creating $INSTALL_DIR..."
    mkdir -p "$INSTALL_DIR"
fi

# Copy executable
echo "📦 Installing to $INSTALL_DIR/$BINARY_NAME..."
cp "$BUILD_FILE" "$INSTALL_DIR/$BINARY_NAME"
chmod +x "$INSTALL_DIR/$BINARY_NAME"

# Check if ~/bin is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo ""
    echo "⚠️  Warning: $INSTALL_DIR is not in your PATH"
    echo "   Add this to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    echo ""
    echo "   export PATH=\"\$HOME/bin:\$PATH\""
    echo ""
fi

echo "✅ Installation complete!"
echo ""
echo "Usage:"
echo "  $BINARY_NAME --help"
echo "  $BINARY_NAME config --list"
echo "  $BINARY_NAME search \"query\""
echo ""
echo "Next steps:"
echo "  1. Configure your API key:"
echo "     Edit ~/.config/obsidian-cli/config.json"
echo "  2. Test the installation:"
echo "     $BINARY_NAME config --list"
