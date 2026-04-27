@echo off
echo =========================================
echo Preparing Repository for GitHub
echo =========================================

echo Adding all files...
git add .

echo Committing files...
git commit --allow-empty -m "Forcing Vercel Rebuild with CI bypass"

echo Setting Main Branch...
git branch -M main

echo Configuring Remote Origin...
git remote remove origin
git remote add origin git@github.com:Carthy1/AuthenX.git

echo Pushing Code to GitHub...
git push -u origin main

echo =========================================
echo Read the text right above this line!
echo If you see a red ERROR (like "Permission denied"), paste it to me!
echo If it says "100%", your repository successfully pushed to GitHub!
echo =========================================
pause
