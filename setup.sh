#!/bin/bash

# 🚀 PARSERATOR DEVELOPMENT SETUP LAUNCHER
# Choose your preferred setup option

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "🚀 PARSERATOR DEVELOPMENT ENVIRONMENT SETUP"
echo "==========================================="
echo -e "${NC}"

echo -e "${BLUE}Welcome! This script will help you set up the optimal development environment for Parserator.${NC}"
echo ""

echo -e "${YELLOW}📋 Available Setup Options:${NC}"
echo ""

echo -e "${GREEN}1. ⚡ Quick Setup (Recommended)${NC}"
echo -e "   ${BLUE}• Essential tools only (Node.js, TypeScript, Firebase CLI)${NC}"
echo -e "   ${BLUE}• Project dependencies and quick aliases${NC}"
echo -e "   ${BLUE}• Ready to code in 2 minutes${NC}"
echo -e "   ${BLUE}• Perfect for: Immediate development, testing sophisticated prompts${NC}"
echo ""

echo -e "${GREEN}2. 🌟 Full Development Environment${NC}"
echo -e "   ${BLUE}• Everything from Quick Setup, plus:${NC}"
echo -e "   ${BLUE}• Docker, Google Cloud CLI, performance tools${NC}"
echo -e "   ${BLUE}• VS Code extensions, development directory structure${NC}"
echo -e "   ${BLUE}• Advanced Git config, documentation, helper scripts${NC}"
echo -e "   ${BLUE}• Perfect for: Long-term development, team collaboration${NC}"
echo ""

echo -e "${GREEN}3. 🪟 Windows Setup${NC}"
echo -e "   ${BLUE}• Windows-optimized setup with batch files${NC}"
echo -e "   ${BLUE}• PowerShell aliases and Windows-specific tools${NC}"
echo -e "   ${BLUE}• Perfect for: Windows users who prefer native tools${NC}"
echo ""

echo -e "${GREEN}4. 📚 View Documentation${NC}"
echo -e "   ${BLUE}• Read setup guides and implementation instructions${NC}"
echo -e "   ${BLUE}• Perfect for: Understanding before installing${NC}"
echo ""

echo -e "${GREEN}5. 🔧 Sophisticated Prompts Info${NC}"
echo -e "   ${BLUE}• View the prompt regression fix details${NC}"
echo -e "   ${BLUE}• Perfect for: Understanding the advanced implementation${NC}"
echo ""

while true; do
    echo -e "${PURPLE}Please choose an option (1-5, or 'q' to quit): ${NC}"
    read -r choice
    
    case $choice in
        1)
            echo ""
            echo -e "${GREEN}🚀 Starting Quick Setup...${NC}"
            echo -e "${YELLOW}This will install essential development tools and set up the project.${NC}"
            echo -e "${BLUE}Estimated time: 2 minutes${NC}"
            echo ""
            read -p "Continue? (y/n): " -r confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                ./quick-dev-setup.sh
                break
            fi
            ;;
        2)
            echo ""
            echo -e "${GREEN}🌟 Starting Full Development Environment Setup...${NC}"
            echo -e "${YELLOW}This will install comprehensive development tools and create a complete dev environment.${NC}"
            echo -e "${BLUE}Estimated time: 10 minutes${NC}"
            echo ""
            read -p "Continue? (y/n): " -r confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                ./setup-parserator-dev-environment.sh
                break
            fi
            ;;
        3)
            echo ""
            echo -e "${GREEN}🪟 Windows Setup Instructions:${NC}"
            echo -e "${YELLOW}For Windows users, please run this command in Command Prompt as Administrator:${NC}"
            echo -e "${CYAN}setup-dev-windows.bat${NC}"
            echo ""
            echo -e "${BLUE}This will install Windows-optimized development tools.${NC}"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        4)
            echo ""
            echo -e "${GREEN}📚 Available Documentation:${NC}"
            echo ""
            echo -e "${BLUE}Main Guides:${NC}"
            echo -e "• ${CYAN}README_DEVELOPMENT_SETUP.md${NC} - Setup overview"
            echo -e "• ${CYAN}DEVELOPMENT_ENVIRONMENT_GUIDE.md${NC} - Complete usage guide"
            echo -e "• ${CYAN}SOPHISTICATED_PROMPTS_RECONSTRUCTION.md${NC} - Advanced prompts"
            echo ""
            echo -e "${BLUE}Quick Preview of Development Guide:${NC}"
            if [ -f "DEVELOPMENT_ENVIRONMENT_GUIDE.md" ]; then
                head -20 "DEVELOPMENT_ENVIRONMENT_GUIDE.md"
                echo "..."
                echo -e "${YELLOW}(Read full file: cat DEVELOPMENT_ENVIRONMENT_GUIDE.md)${NC}"
            fi
            echo ""
            read -p "Press Enter to continue..."
            ;;
        5)
            echo ""
            echo -e "${GREEN}🔧 Sophisticated Prompts Information:${NC}"
            echo ""
            echo -e "${BLUE}The Current Issue:${NC}"
            echo -e "• Current prompts in /packages/api/src/index.ts are basic stubs"
            echo -e "• Missing: Error recovery, 95% accuracy features, schema simplification"
            echo -e "• Missing: EMA compliance, contextual error messages"
            echo ""
            echo -e "${BLUE}The Solution:${NC}"
            echo -e "• Complete sophisticated prompts found in older builds"
            echo -e "• Reconstructed with all advanced features"
            echo -e "• Implementation guide in SOPHISTICATED_PROMPTS_RECONSTRUCTION.md"
            echo ""
            echo -e "${BLUE}After Setup:${NC}"
            echo -e "1. Review: ${CYAN}cat SOPHISTICATED_PROMPTS_RECONSTRUCTION.md${NC}"
            echo -e "2. Implement: Replace prompts in /packages/api/src/index.ts"
            echo -e "3. Test: ${CYAN}./dev.sh test${NC}"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        q|Q)
            echo -e "${YELLOW}Setup cancelled. You can run this script again anytime with: ./setup.sh${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please choose 1-5 or 'q' to quit.${NC}"
            ;;
    esac
done

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "${YELLOW}1.${NC} Restart your terminal or run: ${CYAN}source ~/.bashrc${NC}"
echo -e "${YELLOW}2.${NC} Navigate to project: ${CYAN}pd${NC} or ${CYAN}cd /mnt/c/Users/millz/parserator-launch-ready${NC}"
echo -e "${YELLOW}3.${NC} Start development: ${CYAN}./dev.sh start${NC}"
echo -e "${YELLOW}4.${NC} Implement sophisticated prompts: ${CYAN}cat SOPHISTICATED_PROMPTS_RECONSTRUCTION.md${NC}"
echo ""
echo -e "${GREEN}Quick Commands Available:${NC}"
echo -e "• ${CYAN}./dev.sh start${NC}   - Start development server"
echo -e "• ${CYAN}./dev.sh test${NC}    - Run tests"
echo -e "• ${CYAN}./dev.sh build${NC}   - Build project"
echo -e "• ${CYAN}./dev.sh deploy${NC}  - Deploy to Firebase"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"