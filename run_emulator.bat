@echo off
cd /d "%LOCALAPPDATA%\Android\Sdk\emulator"
echo Starting Android Emulator: Pixel_9_api35 (SwiftShader)...
emulator -avd Pixel_9_api35 -no-snapshot-load -gpu swiftshader
pause
