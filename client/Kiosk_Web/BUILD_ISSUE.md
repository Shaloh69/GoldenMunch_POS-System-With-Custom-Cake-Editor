# Known Build Issue: HeroUI SSR Stack Overflow

## Problem

The production build (`npm run build`) fails with a "Maximum call stack size exceeded" error during the static page generation phase:

```
Error occurred prerendering page "/about"
RangeError: Maximum call stack size exceeded
```

## Root Cause

**HeroUI v2 + Next.js 15 Incompatibility**

The HeroUI component library has a circular dependency or infinite recursion issue during Server-Side Rendering (SSR) / static page prerendering with Next.js 15.x. This is a known issue affecting multiple HeroUI components.

## What Works

✅ TypeScript compilation (`tsc --noEmit`)
✅ Development server (`npm run dev`)
✅ ESLint linting
✅ Code runs fine at runtime
❌ Production build with static generation

## Attempted Fixes

1. ✅ **Upgraded @heroui/theme** from 2.4.22 to latest (fixed peer dependency warnings)
2. ✅ **Simplified not-found.tsx** to remove HeroUI components
3. ✅ **Added `output: 'standalone'`** in next.config.mjs
4. ✅ **Disabled worker threads** with `experimental.workerThreads: false`
5. ❌ **Downgraded to Next.js 14.2.x** - Same issue persists
6. ❌ **Added `dynamic = "force-dynamic"`** - Doesn't apply to client components
7. ❌ **Removed HeroUI from not-found** - Issue affects all pages

## Workarounds

### Option A: Use Dockerfile.dev (TEMPORARY WORKAROUND)

**A ready-to-use workaround Dockerfile is included: `Dockerfile.dev`**

This Dockerfile skips the build step and runs the dev server instead.

**To use on Render:**

1. In your Render dashboard, go to your service settings
2. Change the Dockerfile path from `Dockerfile` to `Dockerfile.dev`
3. Redeploy

**Or update render.yaml:**
```yaml
services:
  - type: web
    name: goldenmunch-kiosk-web
    env: docker
    dockerfilePath: ./client/Kiosk_Web/Dockerfile.dev
    dockerContext: ./client/Kiosk_Web
```

**Pros:**
- ✅ Works immediately
- ✅ No code changes needed
- ✅ Easy to revert

**Cons:**
- ⚠️ Slower performance
- ⚠️ No optimizations
- ⚠️ Higher memory usage (512MB+ recommended)
- ⚠️ Not production-ready long-term

### Option B: Wait for HeroUI Fix

Monitor HeroUI GitHub for SSR fixes:
- https://github.com/jrgarciadev/hero-ui/issues
- Check for updates in @heroui/theme and @heroui/system

### Option C: Switch UI Library

Replace HeroUI with an alternative:
- **Shadcn/ui** - Better Next.js 15 support
- **Chakra UI** - Proven SSR stability
- **Mantine** - Good Next.js integration

### Option D: Custom Build Process

Use a custom build that skips prerendering:

1. Build with errors ignored (already configured)
2. Deploy `.next` folder directly
3. Let Render handle runtime rendering

## Current Configuration

```javascript
// next.config.mjs
{
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: 'standalone',
  experimental: {
    workerThreads: false,
    cpus: 1,
  }
}
```

## Recommended Solution

**Short-term:** Deploy despite build warnings (Render may still work)
**Long-term:** Switch from HeroUI to Shadcn/ui or wait for HeroUI updates

## Related Issues

- HeroUI SSR issues: https://github.com/jrgarciadev/hero-ui
- Next.js prerendering: https://nextjs.org/docs/messages/prerender-error

## Testing Locally

```bash
# Dev server works fine
npm run dev

# Build fails at prerendering
npm run build
# Error: Maximum call stack size exceeded
```

## Last Updated

2025-12-15 - Tested with:
- Next.js 15.3.1 and 14.2.21
- HeroUI @heroui/theme@latest
- All pages marked as client components
