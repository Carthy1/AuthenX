@echo off
echo =========================================
echo Preparing Repository for GitHub
echo =========================================

echo Adding all files...
git add .

echo Committing files...
git commit -m "Initial commit: Certificate Verification System"

echo Setting Main Branch...
git branch -M main

echo Adding Remote Origin...
git remote add origin git@github.com:Carthy1/AuthenX.git

echo Pushing Code to GitHub...
git push -u origin main

echo =========================================
echo Repository Successfully Pushed to GitHub!
echo You can now go to Vercel and import it.
echo =========================================
pause
