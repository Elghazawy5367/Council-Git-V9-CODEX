# GitHub Pages White Page Diagnosis & Fix

## Problem Statement

The Council app renders a white/blank page when accessed at `https://elghazawy5367.github.io/Council-Git-V9/` on GitHub Pages, despite working perfectly on localhost.

---

## Current Status

✅ **Fix Applied:** Conditional base path configuration in `vite.config.ts`  
✅ **Build Status:** Production build succeeds with correct `/Council-Git-V9/` base path  
✅ **Deployment:** GitHub Actions workflow correctly sets `NODE_ENV: production`

---

## Diagnosis Steps

### 1. **Check Browser Console** 
Open your browser's developer tools (F12) at the GitHub Pages URL and look for:

```
- Script loading errors (404 Not Found on assets)
- CORS errors
- Uncaught JavaScript exceptions
- Module loading failures
```

**Expected:** Console should show app initialization logs, no errors

### 2. **Verify Asset URLs**
Inspect Network tab and look for:
- `/Council-Git-V9/assets/*.js` → Should return 200
- `/Council-Git-V9/assets/*.css` → Should return 200

**If 404:** Assets aren't being served from correct path

### 3. **Check HTML Structure**
View page source (Ctrl+U) and verify:
```html
<script type="module" crossorigin src="/Council-Git-V9/assets/index-*.js"></script>
<link rel="stylesheet" crossorigin href="/Council-Git-V9/assets/index-*.css">
```

**If paths are wrong:** Base path configuration didn't apply during build

---

## Potential Issues & Solutions

### Issue 1: Base Path Not Applied During Build

**Symptom:** Assets path is `/assets/...` instead of `/Council-Git-V9/assets/...`

**Root Cause:** Build environment variable not set

**Solution:**
```yaml
# .github/workflows/deploy.yml - ALREADY FIXED
- name: Build
  run: npm run build
  env:
    NODE_ENV: production  # ← This triggers the base path logic
```

**Current Status:** ✅ Already configured correctly

---

### Issue 2: React Router Not Finding Root Path

**Symptom:** Page loads but shows 404/NotFound component

**Root Cause:** HashRouter works correctly, but if router config is wrong

**Current Solution:** ✅ Using `HashRouter` (correct for subpath deployment)

```typescript
// src/App.tsx
<HashRouter>
  <Routes>
    <Route path="/" element={<Index />} />
    {/* Routes use hash-based routing */}
  </Routes>
</HashRouter>
```

**Why HashRouter:** Works with `/Council-Git-V9/#/path` URL structure

---

### Issue 3: JavaScript Execution Error

**Symptom:** Console shows JavaScript error preventing app initialization

**Root Cause:** 
- Missing environment variables
- Database initialization failing silently
- Missing dependencies in dist

**Debugging:**
```javascript
// Open browser console and check
console.log(window.__VITE_ENV__)
console.log(process.env.REACT_APP_*)
```

**Current Protection:** ✅ ErrorBoundary will catch and display errors

---

### Issue 4: Service Worker Interfering

**Symptom:** Old cached version showing blank page

**Solution:**
```bash
# Hard refresh in browser
Ctrl+Shift+R  (Windows/Linux)
Cmd+Shift+R   (Mac)

# Or clear site data
# Settings → Privacy → Clear Site Data for github.io
```

---

## Verification Checklist

### ✅ Build Configuration
- [x] `vite.config.ts` has conditional base path
- [x] Production build uses `/Council-Git-V9/` base
- [x] `.github/workflows/deploy.yml` sets `NODE_ENV: production`

### ✅ Routing Configuration
- [x] App uses `HashRouter` (correct for subpath)
- [x] Routes start with `/` (not with base path)
- [x] ErrorBoundary wraps the entire app

### ✅ Asset References
- [x] `index.html` has correct script/link paths
- [x] No hardcoded `/assets/` paths (all use Vite)
- [x] CSS/JS are bundled in dist

### ✅ Deployment Workflow
- [x] Deploy job uploads `dist/` to GitHub Pages
- [x] GitHub Pages configured to serve from root
- [x] No base path conflicts in settings

---

## Testing on GitHub Pages

### Real-Time Testing

1. **Navigate to the URL:**
   ```
   https://elghazawy5367.github.io/Council-Git-V9/
   ```

2. **Open Developer Tools (F12):**
   - Console tab: Look for errors
   - Network tab: Check if assets load (200 status)
   - Application tab: Check for IndexedDB initialization

3. **Try Different Routes:**
   - `https://elghazawy5367.github.io/Council-Git-V9/#/council`
   - `https://elghazawy5367.github.io/Council-Git-V9/#/features`
   - `https://elghazawy5367.github.io/Council-Git-V9/#/quality`

---

## Common White Page Causes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Assets return 404 | Base path not applied | Verify `NODE_ENV: production` in build |
| Page loads but blank | JavaScript error | Check console for errors |
| Old version showing | Browser cache | Hard refresh (Ctrl+Shift+R) |
| Shows 404 page | Router misconfigured | Check HashRouter in App.tsx |
| Slow to load/loading spinner | Database initialization | Check IndexedDB in DevTools → Application |

---

## Debug Mode

To enable verbose logging:

1. **Add debug output to main.tsx:**
```typescript
console.log('[DEBUG] Environment:', import.meta.env)
console.log('[DEBUG] Location:', window.location.href)
console.log('[DEBUG] Base path:', document.baseURI)
```

2. **Check Network requests:**
   - Look for failed resource loads (404 errors)
   - Verify CORS headers are correct
   - Check redirect chains

3. **Monitor console errors:**
   - JavaScript syntax errors
   - Module import failures
   - API key/authentication issues

---

## Solution: If Still Showing White Page

### Step 1: Check Build Artifacts
```bash
# Verify dist/ was built correctly
ls -la dist/
ls -la dist/assets/

# Check if index.html has correct paths
grep "Council-Git-V9" dist/index.html
```

### Step 2: Test Locally with Production Build
```bash
# Build production version
npm run build

# Serve the dist folder
npx serve dist -l 5000 -s

# Visit http://localhost:5000/Council-Git-V9/
```

If this works locally but not on GitHub Pages, the issue is with GitHub Pages configuration, not the app.

### Step 3: Check GitHub Pages Settings
1. Go to Repository Settings → Pages
2. Verify:
   - Source: Deploy from a branch
   - Branch: main (or your deploy branch)
   - Folder: root (not /docs)

### Step 4: Rebuild and Redeploy
```bash
# Force rebuild
git clean -fd
git checkout .

# Rebuild and push
npm run build
git add dist/ && git commit -m "fix: rebuild for github pages"
git push origin main
```

---

## Prevention: Future White Page Issues

### 1. **Add Diagnostic Endpoint**
Create a debug page that shows:
- Build configuration
- Environment variables
- Asset paths
- Router state

### 2. **Monitor Build Process**
```bash
# Add post-build verification
npm run build && npm run verify-dist
```

### 3. **CI/CD Validation**
Add workflow step to verify dist output:
```yaml
- name: Verify Build
  run: |
    [ -f dist/index.html ] || exit 1
    grep -q "Council-Git-V9" dist/index.html || exit 1
    [ -d dist/assets ] || exit 1
```

---

## Summary

**Current Implementation:** ✅ Correct
- Conditional base path applied during build
- HashRouter correctly configured
- GitHub Pages workflow properly set up
- Production build includes correct asset paths

**If Still Showing White Page:**
1. Clear browser cache and hard refresh
2. Check browser console for JavaScript errors
3. Verify GitHub Pages deployment completed (check Actions)
4. Try accessing from different browser/incognito
5. If issue persists, verify GitHub Pages configuration

**Next Steps:**
- Monitor GitHub Pages deployment status
- Check browser console for specific error messages
- Test asset loading with Network tab
- Verify no CORS or resource loading issues

---

**Last Updated:** February 3, 2026  
**Status:** Diagnostic Guide Ready  
**Action Required:** Monitor deployment and check browser console for errors
