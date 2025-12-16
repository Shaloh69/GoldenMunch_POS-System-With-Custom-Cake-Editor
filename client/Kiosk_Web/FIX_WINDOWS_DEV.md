# Fix Windows Development Error - lightningcss

## Error You're Seeing

```
Error: Cannot find module '../lightningcss.win32-x64-msvc.node'
```

This happens because Tailwind CSS v4 uses `lightningcss` (a native Rust module), and the Windows binary isn't installed properly.

---

## 🔧 Fix #1: Reinstall Dependencies (Recommended)

Run these commands in **PowerShell or CMD** (as Administrator):

```bash
cd C:\Projects\Thesis\GoldenMunchPOS\client\Kiosk_Web

# Delete node_modules and lock file
rmdir /s /q node_modules
del package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall everything
npm install

# Try dev server
npm run dev
```

---

## 🔧 Fix #2: Rebuild Native Modules

If Fix #1 doesn't work:

```bash
cd C:\Projects\Thesis\GoldenMunchPOS\client\Kiosk_Web

# Rebuild lightningcss for Windows
npm rebuild lightningcss

# Or rebuild all native modules
npm rebuild

# Try dev server
npm run dev
```

---

## 🔧 Fix #3: Install lightningcss Explicitly

```bash
cd C:\Projects\Thesis\GoldenMunchPOS\client\Kiosk_Web

# Install lightningcss explicitly
npm install lightningcss --save-dev

# Try dev server
npm run dev
```

---

## 🔧 Fix #4: Check Node.js Version

Tailwind v4 requires **Node.js 18+**. Check your version:

```bash
node --version
```

If you're on Node 16 or below:
1. Download Node.js 20 from: https://nodejs.org/
2. Install it
3. Run Fix #1 again

---

## 🔧 Fix #5: Use VS Code PowerShell (Not Git Bash)

Sometimes Git Bash on Windows causes issues with native modules.

1. Open VS Code
2. Terminal → New Terminal (uses PowerShell)
3. Run Fix #1 commands above

---

## 🔧 Fix #6: Install Visual Studio Build Tools (Last Resort)

If nothing else works, you might need Windows build tools:

```bash
# Run as Administrator
npm install --global windows-build-tools

# Or install Visual Studio Build Tools manually:
# https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++"
```

Then run Fix #1 again.

---

## ✅ Verification

Once fixed, you should see:

```bash
npm run dev

> goldenmunch-kiosk-web@1.0.0 dev
> next dev -p 3002

   ▲ Next.js 15.3.1
   - Local:        http://localhost:3002
   - Network:      http://192.168.x.x:3002

 ✓ Starting...
 ✓ Ready in 2.3s
```

Then open: http://localhost:3002

---

## 🌐 Meanwhile: Use the Deployed Version

While you fix local development, you can test using the **live Render deployment**:

https://goldenmunch-pos-system-with-custom-cake-ud4p.onrender.com

(Should work once Render finishes rebuilding with the PORT fix)

---

## 📝 Why This Happens

- **Tailwind CSS v4** uses `lightningcss` for faster CSS processing
- **lightningcss** is a native Rust module compiled for each platform
- Sometimes the Windows binary (`win32-x64-msvc.node`) doesn't download/install correctly
- This is a known issue on Windows with native Node modules

---

## 🚨 If Nothing Works

As a last resort, you can temporarily use the production build locally:

```bash
# Build production version
npm run build

# Start production server
npm start

# Visit http://localhost:3002
```

This works because production builds compile everything ahead of time.

---

**Most likely solution:** Fix #1 (reinstall dependencies)
**If that fails:** Fix #2 (rebuild native modules)
**Estimated time:** 5-10 minutes
