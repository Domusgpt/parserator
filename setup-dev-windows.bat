@echo off
REM 🚀 PARSERATOR DEVELOPMENT SETUP FOR WINDOWS
REM Run this in Command Prompt as Administrator

echo 🚀 Setting up Parserator Development Environment on Windows...
echo ============================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js from https://nodejs.org/
    echo    Download the LTS version and run this script again.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Update npm
echo 📦 Updating npm to latest version...
npm install -g npm@latest

REM Install essential development tools
echo 🛠️ Installing essential development tools...
npm install -g typescript
npm install -g ts-node
npm install -g tsx
npm install -g nodemon
npm install -g firebase-tools
npm install -g turbo
npm install -g jest
npm install -g eslint
npm install -g prettier
npm install -g concurrently

echo ✅ Development tools installed

REM Install project dependencies
echo 📦 Installing project dependencies...
cd /d C:\Users\millz\parserator-launch-ready
npm install

echo ✅ Project dependencies installed

REM Create development helper batch file
echo 🔧 Creating development helper...

echo @echo off > dev.bat
echo REM Parserator Development Helper for Windows >> dev.bat
echo. >> dev.bat
echo if "%%1"=="start" goto start >> dev.bat
echo if "%%1"=="dev" goto start >> dev.bat
echo if "%%1"=="test" goto test >> dev.bat
echo if "%%1"=="build" goto build >> dev.bat
echo if "%%1"=="deploy" goto deploy >> dev.bat
echo if "%%1"=="logs" goto logs >> dev.bat
echo if "%%1"=="install" goto install >> dev.bat
echo if "%%1"=="clean" goto clean >> dev.bat
echo goto help >> dev.bat
echo. >> dev.bat
echo :start >> dev.bat
echo echo 🚀 Starting Parserator development server... >> dev.bat
echo npm run dev >> dev.bat
echo goto end >> dev.bat
echo. >> dev.bat
echo :test >> dev.bat
echo echo 🧪 Running tests... >> dev.bat
echo npm test >> dev.bat
echo goto end >> dev.bat
echo. >> dev.bat
echo :build >> dev.bat
echo echo 🔨 Building project... >> dev.bat
echo npm run build >> dev.bat
echo goto end >> dev.bat
echo. >> dev.bat
echo :deploy >> dev.bat
echo echo 🚀 Deploying to Firebase... >> dev.bat
echo firebase deploy >> dev.bat
echo goto end >> dev.bat
echo. >> dev.bat
echo :logs >> dev.bat
echo echo 📋 Viewing logs... >> dev.bat
echo firebase functions:log --project parserator-production >> dev.bat
echo goto end >> dev.bat
echo. >> dev.bat
echo :install >> dev.bat
echo echo 📦 Installing dependencies... >> dev.bat
echo npm install >> dev.bat
echo goto end >> dev.bat
echo. >> dev.bat
echo :clean >> dev.bat
echo echo 🧹 Cleaning project... >> dev.bat
echo rmdir /s /q node_modules >> dev.bat
echo del package-lock.json >> dev.bat
echo npm install >> dev.bat
echo goto end >> dev.bat
echo. >> dev.bat
echo :help >> dev.bat
echo echo Parserator Development Helper >> dev.bat
echo echo Usage: dev.bat [command] >> dev.bat
echo echo. >> dev.bat
echo echo Commands: >> dev.bat
echo echo   start/dev  - Start development server >> dev.bat
echo echo   test       - Run tests >> dev.bat
echo echo   build      - Build project >> dev.bat
echo echo   deploy     - Deploy to Firebase >> dev.bat
echo echo   logs       - View Firebase logs >> dev.bat
echo echo   install    - Install dependencies >> dev.bat
echo echo   clean      - Clean and reinstall dependencies >> dev.bat
echo goto end >> dev.bat
echo. >> dev.bat
echo :end >> dev.bat

echo ✅ Development helper created: dev.bat

REM Create Windows PowerShell profile with aliases (optional)
echo 📝 Creating PowerShell aliases...
if not exist "%USERPROFILE%\Documents\WindowsPowerShell" mkdir "%USERPROFILE%\Documents\WindowsPowerShell"

echo # Parserator Development Aliases > "%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
echo Set-Alias pd "Set-Location C:\Users\millz\parserator-launch-ready" >> "%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
echo function pstart { cd C:\Users\millz\parserator-launch-ready; npm run dev } >> "%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
echo function ptest { cd C:\Users\millz\parserator-launch-ready; npm test } >> "%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
echo function pbuild { cd C:\Users\millz\parserator-launch-ready; npm run build } >> "%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
echo function pdeploy { cd C:\Users\millz\parserator-launch-ready; firebase deploy } >> "%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"

echo ✅ PowerShell aliases created

REM Environment verification
echo 🔍 Verifying installation...
echo Node.js: 
node --version
echo npm: 
npm --version
echo TypeScript: 
tsc --version
echo Firebase CLI: 
firebase --version

echo.
echo 🎉 Windows Development Setup Complete!
echo ======================================
echo.
echo 🚀 Quick commands:
echo   dev.bat start     - Start development
echo   dev.bat test      - Run tests  
echo   dev.bat build     - Build project
echo   dev.bat deploy    - Deploy
echo.
echo 📋 Next steps:
echo   1. Open new PowerShell/Command Prompt
echo   2. Navigate to project: cd C:\Users\millz\parserator-launch-ready
echo   3. Start development: dev.bat start
echo   4. Check SOPHISTICATED_PROMPTS_RECONSTRUCTION.md to upgrade prompts
echo.
echo ✅ Ready to develop on Windows! 🚀

pause