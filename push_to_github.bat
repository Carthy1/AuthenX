@echo off
title Push AuthenX to GitHub
echo ====================================================
echo Pushing latest commits to https://github.com/Carthy1/AuthenX
echo ====================================================
cd /d "e:\Projects\GROUP 4E_Certificate Verification System"

git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ====================================================
    echo [SUCCESS] Changes successfully pushed to GitHub!
    echo ====================================================
) else (
    echo ====================================================
    echo [INFO] If prompted above or in your browser, complete the sign-in.
    echo ====================================================
)
pause
