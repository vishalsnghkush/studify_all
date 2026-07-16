@echo off
cd /d "%LOCALAPPDATA%\Android\Sdk\emulator"
echo Available Emulators:
echo 1. Pixel_9_api35
echo 2. Pixel_8_Pro_api37
echo.
set choice=1
set /p choice="Choose emulator (1 or 2, default is 1): "
if "%choice%"=="2" (
    echo Starting Android Emulator: Pixel_8_Pro_api37...
    emulator -avd Pixel_8_Pro_api37 -no-snapshot-load
) else (
    echo Starting Android Emulator: Pixel_9_api35...
    emulator -avd Pixel_9_api35 -no-snapshot-load
)
pause
