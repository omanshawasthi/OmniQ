@echo off
echo "=========================================="
echo " QueueLess DEV RESET & CLEAN START"
echo "=========================================="

echo "[1/3] Killing all existing Node/Nodemon processes..."
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM nodemon.exe /T >nul 2>&1

echo "[2/3] Explicitly freeing ports 3000 and 5001..."
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo "[3/3] Starting Backend and Frontend..."
start "BACKEND" cmd /k "cd backend && npm run dev"
start "FRONTEND" cmd /k "cd frontend && npm run dev"

echo "=========================================="
echo " DONE! Backend (5001) & Frontend (3000) are starting in new windows."
echo "=========================================="
pause
