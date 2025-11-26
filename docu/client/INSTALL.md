# Installation Guide - Kiosk Client

## Prerequisites

- Node.js >= 18.17.0
- npm >= 9.0.0

Check your versions:
```bash
node --version
npm --version
```

## Quick Start

### For Windows (PowerShell)

```powershell
npm run fresh-install:win
```

### For Linux/Mac

```bash
npm run fresh-install
```

## Troubleshooting

### Issue: npm install fails with deprecated package warnings and ETIMEDOUT errors

**Symptoms:**
- Warnings about deprecated packages (inflight, rimraf, glob, uuid, har-validator, etc.)
- Error installing electron with ETIMEDOUT
- RequestError or AggregateError during installation

**Root Cause:**
This happens when you have a stale `package-lock.json` file with outdated dependencies that are no longer needed.

**Solution:**

#### Option 1: Use the fresh install script (Recommended)

**Windows PowerShell:**
```powershell
npm run fresh-install:win
```

**Linux/Mac:**
```bash
npm run fresh-install
```

#### Option 2: Manual cleanup

**Windows PowerShell:**
```powershell
# Remove node_modules directory
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }

# Remove package-lock.json
if (Test-Path package-lock.json) { Remove-Item package-lock.json }

# Fresh install
npm install
```

**Windows Command Prompt:**
```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
```

**Linux/Mac:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Network timeouts during installation

**Solution:**
The `.npmrc` file has been configured with longer timeouts. If you still experience issues:

1. Check your internet connection
2. Try using a different network
3. If behind a corporate firewall, configure proxy settings:

```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

### Issue: Peer dependency conflicts

**Solution:**
The `.npmrc` file has `strict-peer-dependencies=false` to handle this. If you still have issues, try:

```bash
npm install --legacy-peer-deps
```

### Issue: Electron installation fails (when not needed)

**Note:** This project is a Next.js web application and does NOT require Electron. If you see Electron in your installation:

1. Delete `node_modules` and `package-lock.json`
2. Run a fresh install
3. Check that your `package.json` matches the repository version

## Development

After successful installation:

### Start development server
```bash
npm run dev
```

Access the application at: `http://localhost:3000`

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm run start
```

### Lint code
```bash
npm run lint
```

## Environment Variables

Create a `.env.local` file in the Kiosk directory with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Adjust the API URL to match your backend server configuration.

## Common Issues

### Port already in use
If port 3000 is already in use:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

Or specify a different port:
```bash
npm run dev -- -p 3001
```

### TypeScript errors
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

## Getting Help

If you continue to experience issues:

1. Check that you're using the correct Node.js version (>= 18.17.0)
2. Ensure you've deleted both `node_modules` and `package-lock.json`
3. Try clearing npm cache: `npm cache clean --force`
4. Check the error logs in: `C:\Users\<YourUser>\AppData\Local\npm-cache\_logs\` (Windows)

## Notes

- This is a Next.js application using React 18 and Next.js 15
- The UI framework is HeroUI (NextUI fork)
- Styling is done with Tailwind CSS v4
- Do NOT manually install Electron - it's not needed for this project
