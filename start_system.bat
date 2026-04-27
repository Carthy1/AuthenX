@echo off
echo =========================================
echo Starting Certificate Verification System
echo =========================================

echo Starting Hardhat Local Node in a new window...
start cmd /k "npx hardhat node"

echo Waiting for node to start...
timeout /t 5 /nobreak > nul

echo Deploying contracts in a new window...
start cmd /k "node scripts/deploy.js"

echo Waiting for deployment to finish...
timeout /t 5 /nobreak > nul

echo Starting React Frontend in a new window...
cd frontend
start cmd /k "npm start"

echo =========================================
echo System Startup Initiated!
echo You can close this window now.
echo =========================================
pause
