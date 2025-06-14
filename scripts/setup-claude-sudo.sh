#!/bin/bash
# Setup secure sudo access for Claude operations
# This creates environment-based authentication for automated tasks

echo "Setting up secure Claude sudo access..."

# Create sudo password file (secure permissions)
SUDO_PASS_FILE="$HOME/.claude-sudo"
echo "xyla" > "$SUDO_PASS_FILE"
chmod 600 "$SUDO_PASS_FILE"  # Only user can read/write

# Create sudo helper script
SUDO_HELPER="$HOME/.local/bin/claude-sudo"
mkdir -p "$HOME/.local/bin"

cat > "$SUDO_HELPER" << 'EOF'
#!/bin/bash
# Claude sudo helper - reads password from secure file
PASS_FILE="$HOME/.claude-sudo"
if [[ -f "$PASS_FILE" ]]; then
    cat "$PASS_FILE" | sudo -S "$@"
else
    echo "Error: Claude sudo password file not found"
    exit 1
fi
EOF

chmod 700 "$SUDO_HELPER"  # Only user can execute

# Add to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    echo "Added $HOME/.local/bin to PATH in ~/.bashrc"
fi

echo "✅ Claude sudo access configured"
echo "Usage: claude-sudo [command]"
echo "Example: claude-sudo apt update"
echo ""
echo "🔒 Security notes:"
echo "- Password stored in $SUDO_PASS_FILE (600 permissions)"
echo "- Helper script at $SUDO_HELPER (700 permissions)"
echo "- Only your user account can access these files"