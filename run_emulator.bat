@echo off
cd /d "%LOCALAPPDATA%\Android\Sdk\emulator"
echo Starting Android Emulator: Medium_Phone_API_36.1 (SwiftShader)...
emulator -avd Medium_Phone_API_36.1 -no-snapshot-load -gpu swiftshader
pause
