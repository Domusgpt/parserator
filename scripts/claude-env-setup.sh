#!/bin/bash
# Claude environment setup with secure sudo access
# Sets up environment variables for automated Claude operations

# Export sudo password for this session
export SUDO_PASS="xyla"

# Create helper functions for common operations
sudo_install() {
    echo "$SUDO_PASS" | sudo -S apt install -y "$@"
}

sudo_update() {
    echo "$SUDO_PASS" | sudo -S apt update
}

sudo_cmd() {
    echo "$SUDO_PASS" | sudo -S "$@"
}

# Export functions for use in this session
export -f sudo_install
export -f sudo_update  
export -f sudo_cmd

echo "🔧 Claude environment configured with sudo access"
echo "Available functions:"
echo "  sudo_install [packages]  - Install packages"
echo "  sudo_update             - Update package lists"
echo "  sudo_cmd [command]      - Run any sudo command"
echo ""
echo "Environment variables:"
echo "  SUDO_PASS              - Available for echo \$SUDO_PASS | sudo -S [cmd]"