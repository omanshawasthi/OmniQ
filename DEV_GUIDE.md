# Developer Guide: Stable Local Setup

To prevent port conflicts (EADDRINUSE), zombie processes, and CORS errors, follow this workflow.

## 1. Port Standards
- **Frontend**: http://localhost:3000 (Forced via `strictPort: true`)
- **Backend**: http://localhost:5001 (Fixed in `.env` and `server.js`)

## 2. Starting Safely (Recommended)
Use the root-level scripts to ensure a clean state before starting.

### Option A: One-Click (Windows)
Run the `clean-dev.bat` file in the root directory. This will:
1. Kill any existing Node/Nodemon processes.
2. Force-clear ports 3000 and 5001.
3. Open two new terminal windows for the Backend and Frontend.

### Option B: Terminal Command
Run this in the root folder:
```bash
npm run dev
```
(This uses the root `package.json` to clean and start both services).

## 3. Manual Troubleshooting
If you see "Port 3000/5001 is already in use":
1. Run `npm run reset` from the root folder.
2. If it persists, manually kill processes:
   ```bash
   taskkill /F /IM node.exe /T
   ```

## 4. Why this matters?
- **CORS**: The backend now strictly expects `localhost:3000`. If Vite shifts to 3001, your API calls will fail.
- **Zombies**: Nodemon sometimes leaves "ghost" processes behind. The cleanup script wipes them out.
