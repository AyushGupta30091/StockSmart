@echo off
setlocal

echo =======================================================================
echo          STOCKSMART - AUTOMATED BUILD & PACKAGING PIPELINE            
echo =======================================================================
echo.

cd /d "%~dp0frontend"
echo [1/3] Building Angular Production Bundle...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed!
    exit /b 1
)

echo [2/3] Integrating Frontend static resources with Spring Boot...
xcopy /E /I /Y "dist\frontend\browser\*" "..\StockSmart\src\main\resources\static\"

cd /d "%~dp0StockSmart"
echo [3/3] Packaging Spring Boot Standalone Executable JAR with Java 21...
call .\mvnw.cmd package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend packaging failed!
    exit /b 1
)

echo.
echo =======================================================================
echo [SUCCESS] StockSmart build completed successfully!
echo Executable JAR ready at: StockSmart\target\StockSmart-0.0.1-SNAPSHOT.jar
echo Run start-stocksmart.bat to launch the application.
echo =======================================================================
