@echo off
setlocal
cd /d "%~dp0.."

if "%~1"=="" (
    echo Usage: Server\setup-mobile-https.bat ^<laptop-wifi-ip^>
    echo Find the IPv4 address under the Wi-Fi adapter by running ipconfig.
    exit /b 1
)

set "MKCERT=mkcert"
where mkcert >nul 2>&1
if errorlevel 1 set "MKCERT=%LOCALAPPDATA%\Microsoft\WinGet\Packages\FiloSottile.mkcert_Microsoft.Winget.Source_8wekyb3d8bbwe\mkcert.exe"
if not exist "%MKCERT%" (
    echo mkcert is not installed. Install it with:
    echo   winget install --id FiloSottile.mkcert --exact
    exit /b 1
)

if not exist certs mkdir certs
"%MKCERT%" -install
if errorlevel 1 exit /b 1

"%MKCERT%" -key-file certs\localhost-key.pem -cert-file certs\localhost.pem localhost 127.0.0.1 %~1
if errorlevel 1 exit /b 1

for /f "delims=" %%I in ('"%MKCERT%" -CAROOT') do set "CAROOT=%%I"
copy /y "%CAROOT%\rootCA.pem" "certs\rootCA.crt" >nul
if errorlevel 1 exit /b 1
echo.
echo HTTPS certificate created for localhost and %~1.
echo Install this root certificate on your phone and trust it:
echo   %CD%\certs\rootCA.crt
echo Do not share the private file rootCA-key.pem.
echo Then restart the Vite frontend and open https://%~1:5173
