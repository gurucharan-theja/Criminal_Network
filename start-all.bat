@echo off
title CrimeNet Suite Starter
echo =========================================================
echo    Starting CrimeNet Suite (Frontend + Backend + AI)
echo =========================================================

:: 1. Start Python AI Microservice on Port 8000
echo [1/3] Launching Python AI NLP Engine (Port 8000)...
start "CrimeNet AI Engine" cmd /k "cd /d %~dp0ai-service && python main.py"

:: 2. Start Spring Boot Backend on Port 8080
echo [2/3] Launching Spring Boot Backend (Port 8080)...
start "CrimeNet Backend" cmd /k "cd /d %~dp0backend && C:\Users\HP\maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run"

:: 3. Start Vite React Frontend on Port 5173
echo [3/3] Launching React Workstation (Port 5173)...
start "CrimeNet Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =========================================================
echo All services are launching in separate windows!
echo - Frontend:  http://localhost:5173
echo - Backend:   http://localhost:8080/swagger-ui.html
echo - AI Engine: http://localhost:8000/docs
echo =========================================================
pause
