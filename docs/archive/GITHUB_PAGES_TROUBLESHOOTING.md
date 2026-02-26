# GitHub Pages Troubleshooting Guide

Complete guide for diagnosing and fixing GitHub Pages deployment issues for the Council application.

---

## 📋 Table of Contents

1. [Common Issues Overview](#common-issues-overview)
2. [Issue #1: 404 Error](#issue-1-404-error-for-main-tsx)
3. [Issue #2: MIME Type Error](#issue-2-mime-type-error)
4. [Build Verification](#build-verification)
5. [Deployment Process](#deployment-process)
6. [Cache Management](#cache-management)
7. [Quick Reference](#quick-reference)
8. [Prevention Best Practices](#prevention-best-practices)

---

## Common Issues Overview

### Symptoms
- **White page** on GitHub Pages
- **404 errors** in browser console
- **MIME type errors** for module scripts
- **Old content** served after fixes

### Quick Diagnosis
```bash
# Check if it's a deployment issue
1. Does it work locally? → Build issue
2. Does it work in main branch? → Deployment config issue
3. Is GitHub Actions passing? → Workflow issue
4. Still broken after 10 minutes? → Cache issue
```

---

## Issue #1: 404 Error for main.tsx

### Error Message
```
Failed to load resource: the server responded with a status of 404 ()
at https://elghazawy5367.github.io/src/main.tsx
```

### Root Cause
The `index.html` file had an **absolute path** to the TypeScript source file:
```html
<script type="module" src="/src/main.tsx"></script>
```

### Why It Failed
1. In **development**: Vite dev server intercepts and serves TypeScript files
2. In **production**: The `dist/` folder only contains bundled JavaScript
3. **GitHub Pages**: Tries to serve `/src/main.tsx` literally
4. **Result**: 404 error because the file doesn't exist in the deployed directory

### Solution ✅
Change to **relative path**:
```diff
- <script type="module" src="/src/main.tsx"></script>
+ <script type="module" src="./src/main.tsx"></script>
```

### Why This Works
- Vite recognizes relative paths as entry points
- Processes and bundles the TypeScript during build
- Updates the reference to the bundled JavaScript file
- Applies the base path configuration (`/Council-Git-V9/`)

### Verification
After build, `dist/index.html` should contain:
```html
<script type="module" crossorigin src="/Council-Git-V9/assets/index-[hash].js"></script>
```

**Status:** ✅ **FIXED**

---

## Issue #2: MIME Type Error

### Error Message
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "application/octet-stream". 
Strict MIME type checking is enforced for module scripts per HTML spec.
/Council-Git-V9/src/main.tsx:1
```

### Root Cause
This error occurs when:
1. The fix is implemented in a **feature branch** (e.g., `copilot/refactor-scout-analysis`)
2. GitHub Pages deploys from the **main branch**
3. The **live site** is still serving old code from before the fix

### Why It Happens
```
Feature Branch (copilot/refactor-scout-analysis)
  ✅ Has fix: ./src/main.tsx
  ✅ Build works: Generates correct bundles
  ✅ Local testing: Everything works

Main Branch
  ❌ Old code: Still has absolute path
  ❌ Deployment: GitHub Pages uses this
  ❌ Live site: Serving old, broken code
```

### Solution ✅
**Merge the PR to main branch**

When merged:
1. GitHub Actions automatically triggers
2. Builds with the fixed `index.html`
3. Deploys correct files to GitHub Pages
4. Site works correctly

### Timeline
1. **Immediate**: Merge completes
2. **~2 minutes**: GitHub Actions builds and deploys
3. **5-10 minutes**: CDN cache clears
4. **Result**: Site works!

### Verification Steps
```bash
# 1. Check GitHub Actions
Go to: https://github.com/Elghazawy5367/Council-Git-V9/actions

# 2. Verify successful deployment
Look for: ✅ "pages build and deployment"

# 3. Check build output
Click on workflow → View "Verify build artifacts" step

# 4. Visit site (after cache clears)
https://elghazawy5367.github.io/Council-Git-V9/
```

**Status:** ⏳ **WAITING FOR MERGE**

---

## Build Verification

### Local Build Test
```bash
# Build for production
NODE_ENV=production npm run build

# Expected output
✓ built in ~15s
✓ dist/index.html created
✓ dist/assets/ contains bundled files
```

### Verify Build Output
```bash
# Check generated HTML
cat dist/index.html | grep script

# Expected output
<script type="module" crossorigin src="/Council-Git-V9/assets/index-[hash].js"></script>

# List bundled assets
ls -lh dist/assets/

# Expected: Multiple JS and CSS files
```

### What to Check
1. **dist/index.html exists** ✅
2. **Script tag points to bundled JS** ✅
3. **Base path is correct** (`/Council-Git-V9/`) ✅
4. **Assets directory has files** ✅

### Common Build Issues
```bash
# Issue: vite not found
Solution: npm install

# Issue: TypeScript errors
Solution: npm run typecheck → Fix errors

# Issue: Missing assets
Solution: Check vite.config.ts configuration
```

---

## Deployment Process

### GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
Triggers:
  - Push to main branch
  - Manual dispatch (workflow_dispatch)

Steps:
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies (npm ci)
  4. Build (npm run build with NODE_ENV=production)
  5. Add .nojekyll file
  6. Verify build artifacts
  7. Upload to GitHub Pages
  8. Deploy to GitHub Pages

Expected Duration: 2-3 minutes
```

### Manual Deployment Trigger
```
1. Go to: Actions tab on GitHub
2. Select: "Deploy to GitHub Pages" workflow
3. Click: "Run workflow"
4. Select: main branch
5. Click: "Run workflow" button
```

### Verify Deployment Success
```
1. GitHub Actions tab
2. Look for green checkmark: ✅
3. Click workflow run
4. Check each step passed
5. Note the deployment URL
```

### Troubleshooting Failed Deployments

**Build Fails:**
```bash
# Check TypeScript errors locally
npm run typecheck

# Check build locally
npm run build
```

**Deploy Fails:**
```
# Check GitHub Pages settings:
Settings → Pages → Build and deployment
Source: GitHub Actions ✅
```

**Assets Not Loading:**
```
# Check base path in vite.config.ts
base: '/Council-Git-V9/' for production

# Verify in dist/index.html
All asset paths should include /Council-Git-V9/
```

---

## Cache Management

### GitHub Pages CDN Cache

**Duration:** 5-10 minutes  
**Scope:** Global CDN  
**Control:** Automatic (cannot be manually cleared)

**What to do:**
```
1. Wait 5-10 minutes after deployment
2. Try different browsers
3. Use private/incognito mode
4. Use different devices if available
```

### Browser Cache

**Hard Refresh:**
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`
- **Mobile**: Close browser, reopen, or clear browser data

**Developer Tools:**
```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

**Complete Clear:**
```
1. Open Browser Settings
2. Clear browsing data
3. Select "Cached images and files"
4. Select "All time"
5. Clear data
```

### Cache Busting Techniques

**For Assets:**
Vite automatically adds hash to filenames:
```
index-15z6G5ic.js  ← Hash prevents cache issues
```

**For HTML:**
GitHub Pages handles this automatically via ETag headers.

### Verification After Cache Clear
```
1. Open DevTools Network tab
2. Disable cache (checkbox)
3. Reload page
4. Check all resources load with 200 status
5. Verify JavaScript bundle loads correctly
```

---

## Quick Reference

### Essential Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Access at: http://localhost:5000/

# Build for production
NODE_ENV=production npm run build

# Type check
npm run typecheck

# Verify build output
cat dist/index.html | grep -E "script|link"
ls -lh dist/assets/
```

### Verification Checklist
```
Build Phase:
  □ npm install runs successfully
  □ npm run build completes without errors
  □ dist/ directory created
  □ dist/index.html contains bundled JS reference
  □ dist/assets/ contains JS and CSS files
  □ Asset paths include /Council-Git-V9/ base path

Deployment Phase:
  □ Changes merged to main branch
  □ GitHub Actions workflow triggered
  □ All workflow steps pass (green checkmarks)
  □ Deployment step completes successfully
  □ Wait 5-10 minutes for cache

Browser Testing:
  □ Hard refresh browser (Ctrl+Shift+R)
  □ Open in incognito/private mode
  □ Check browser console (F12) for errors
  □ Verify app loads and functions
  □ Test on different browsers
```

### Troubleshooting Workflow
```
1. Issue occurs
   ↓
2. Check locally
   - npm run build → Does it work?
   - Check dist/index.html → Correct references?
   ↓
3. Check GitHub Actions
   - Did workflow run?
   - Did all steps pass?
   - What's in the deployment?
   ↓
4. Check branch
   - Is fix in main branch?
   - Or still in feature branch?
   ↓
5. Check cache
   - Wait 10 minutes
   - Hard refresh browser
   - Try different browser
   ↓
6. If still broken
   - Check browser console errors
   - Verify asset paths
   - Check GitHub Pages settings
```

---

## Prevention Best Practices

### Development Practices

**1. Always Use Relative Paths**
```html
✅ Good: <script type="module" src="./src/main.tsx"></script>
❌ Bad:  <script type="module" src="/src/main.tsx"></script>
```

**2. Test Builds Locally**
```bash
# Before committing
NODE_ENV=production npm run build
cat dist/index.html | grep script

# Should show bundled JS, not source TS
```

**3. Verify Before Merging**
```
□ Local build succeeds
□ TypeScript check passes
□ Dev server works
□ Build output verified
```

### Deployment Practices

**1. Merge to Main Only When Ready**
```
- Feature branch: For development and testing
- Main branch: Only for deployment-ready code
- Result: Live site stays stable
```

**2. Monitor Deployments**
```
1. Watch GitHub Actions after merge
2. Verify successful completion
3. Wait for cache to clear
4. Test live site
```

**3. Document Changes**
```
- Update documentation for significant changes
- Add troubleshooting notes
- Keep this guide updated
```

### Configuration Practices

**1. vite.config.ts Base Path**
```typescript
// Correct: Conditional base path
const base = command === 'build' && process.env.NODE_ENV === 'production' 
  ? '/Council-Git-V9/'  // Production: GitHub Pages
  : '/';                 // Development: Local

// This ensures:
// - Local development works at root
// - Production deploys with correct base path
```

**2. GitHub Actions Workflow**
```yaml
# Always build with production env
- name: Build
  run: npm run build
  env:
    NODE_ENV: production  # ← Important!
```

**3. .nojekyll File**
```bash
# Workflow includes this:
- name: Add .nojekyll for GitHub Pages
  run: touch dist/.nojekyll

# Why: Prevents Jekyll processing, allows _ prefixed files
```

### Testing Practices

**1. Test Locally First**
```bash
# Simulate production
NODE_ENV=production npm run build
npx serve dist -s

# Access at localhost:3000
# Test all features
```

**2. Test in Multiple Browsers**
```
- Chrome/Edge (Chromium)
- Firefox
- Safari (if on Mac)
- Mobile browsers
```

**3. Test After Deployment**
```
1. Wait 10 minutes for cache
2. Hard refresh browser
3. Check console for errors
4. Verify all features work
5. Test on different devices
```

---

## Additional Resources

### Documentation
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Project Files
- `vite.config.ts` - Build configuration
- `.github/workflows/deploy.yml` - Deployment workflow
- `package.json` - Build scripts

### Related Guides
- `GITHUB_PAGES_404_FIX.md` - 404 error detailed analysis
- `WHITE_PAGE_FIX.md` - Base path configuration
- `README.md` - Project documentation

---

## Summary

### Issue Resolution Status

| Issue | Status | Solution |
|-------|--------|----------|
| 404 Error | ✅ Fixed | Use relative path in index.html |
| MIME Type Error | ⏳ Pending | Merge PR to main branch |
| Cache Issues | 📚 Documented | Wait 5-10 min, hard refresh |
| Build Problems | 📚 Documented | Verification steps provided |

### Key Takeaways

1. **Always use relative paths** for module scripts
2. **Test builds locally** before deploying
3. **Understand the deployment flow** (feature → main → GitHub Pages)
4. **Account for cache** (5-10 min delay)
5. **Verify at each step** (build, deploy, live site)

### Quick Win Checklist

When issues occur:
```
□ Is the fix in main branch? (Check git)
□ Did GitHub Actions run? (Check Actions tab)
□ Did all steps pass? (Green checkmarks)
□ Has it been 10+ minutes? (Cache time)
□ Have I hard refreshed? (Ctrl+Shift+R)
□ Does it work in incognito? (Browser cache)
```

---

**Last Updated:** 2026-02-03  
**Status:** Complete and ready for team use  
**Maintainer:** Development team

---

For questions or issues not covered here, check the GitHub Issues tab or contact the development team.
