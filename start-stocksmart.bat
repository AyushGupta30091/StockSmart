@echo off
setlocal enabledelayedexpansion

echo =======================================================================
echo          STOCKSMART - RETAIL INVENTORY OPTIMIZATION SYSTEM            
echo =======================================================================
echo Target URL: http://localhost:8080
echo.

:: 1. Check Java 21
where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java runtime not found in PATH!
    echo Please install JDK 21 and add it to your PATH environment variable.
    pause
    exit /b 1
)

for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set JVER=%%g
)
echo [OK] Detected Java runtime: !JVER!

:: 2. Check Oracle Environment Variables (Optional fallback to Oracle-compatible mode)
if defined ORACLE_URL (
    echo [INFO] Oracle URL detected: %ORACLE_URL%
    echo [INFO] Oracle User: %ORACLE_USER%
) else (
    echo [NOTICE] ORACLE_URL environment variable is not set.
    echo [NOTICE] Launching with Oracle-compatible mode for instant local testing.
    echo [NOTICE] (To connect to live Oracle DB, set ORACLE_URL, ORACLE_USER, ORACLE_PASSWORD).
)

:: 3. Check Executable JAR
set JAR_PATH=%~dp0StockSmart\target\StockSmart-0.0.1-SNAPSHOT.jar
if not exist "%JAR_PATH%" (
    echo [WARN] Executable JAR not found at %JAR_PATH%
    echo [INFO] Building StockSmart application now...
    call "%~dp0build-all.bat"
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Build failed. Cannot start StockSmart.
        pause
        exit /b 1
    )
)

echo.
echo =======================================================================
echo Starting StockSmart Server on port 8080...
echo Access the application in your browser at:
echo http://localhost:8080
echo.
echo Demo Accounts:
echo   - ADMIN:   admin@stocksmart.com   / admin123
echo   - MANAGER: manager@stocksmart.com / Manager@123
echo   - STAFF:   staff@stocksmart.com   / Staff@123
echo =======================================================================
echo.

java -jar "%JAR_PATH%"

pause
