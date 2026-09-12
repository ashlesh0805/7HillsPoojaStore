@echo off
title 7 Hills Pooja Store — Google Play Store Packager
color 0E

echo ====================================================================
echo   7 HILLS POOJA STORE — GOOGLE PLAY STORE (.AAB) BUILD HELPER
echo ====================================================================
echo.
echo  This helper provides two ways to build your signed Android App Bundle (.aab):
echo.
echo  [1] FASTEST CLOUD METHOD: PWABuilder (Recommended - No Java/SDK needed)
echo      - Generates signed .aab + release keystore in 30 seconds in the cloud.
echo      - Automatically applies Android 14 (API 34) and full TWA support.
echo.
echo  [2] LOCAL CLI METHOD: Google Bubblewrap CLI (@bubblewrap/cli)
echo      - Requires Node.js, JDK 17+, and Android Command-line Tools.
echo.
echo ====================================================================
echo.

set /p choice="Choose an option (1 or 2): "

if "%choice%"=="1" goto pwabuilder
if "%choice%"=="2" goto bubblewrap
goto end

:pwabuilder
echo.
echo Opening PWABuilder in your default browser...
start https://www.pwabuilder.com
echo.
echo INSTRUCTIONS:
echo 1. Enter your live HTTPS store domain (e.g. https://7hillspoojastore.com).
echo 2. Click 'Start' -> PWABuilder will audit your manifest.json and icons.
echo 3. Click 'Package for Stores' -> Select 'Google Play (Android)'.
echo 4. Set Package ID: com.sevenhills.poojastore
echo 5. Click 'Generate Package' -> Download your zip file containing:
echo    - app-release-bundle.aab (Upload this to Google Play Console!)
echo    - signing.keystore
echo    - assetlinks.json
echo.
pause
goto end

:bubblewrap
echo.
echo Checking Bubblewrap CLI installation...
call npx --yes @bubblewrap/cli --version
if errorlevel 1 (
  echo Error loading Bubblewrap CLI. Please ensure internet access and Node.js are available.
  pause
  goto end
)
echo.
echo Building Android App Bundle locally...
call npx @bubblewrap/cli build
echo.
pause
goto end

:end
echo.
echo Done! Consult playstore-copy.md and PLAYSTORE-PRE-REGISTRATION-GUIDE.md for next steps.
