# GitHub Pages Deployment Guide

This document provides a complete guide for deploying The Council application to GitHub Pages.

## Overview

The Council is configured to deploy automatically to GitHub Pages using GitHub Actions. The deployment process builds the React application and deploys it to the `gh-pages` branch.

## Configuration

### 1. Vite Configuration (`vite.config.ts`)

```typescript
export default defineConfig(({ mode, command }) => {
  // Use base path for all builds (GitHub Pages)
  // In development, use root path for easier local testing
  const base = command === 'build' ? '/Council-Git-V9/' : '/';
  
  return {
    base,
    // ... rest of config
  };
});
```

**Key Points:**
- Base path is set to `/Council-Git-V9/` for all builds
- Development server uses root path (`/`) for easier local testing
- Build outputs to `dist/` directory by default

### 2. Package.json Scripts

```json
{
  "scripts": {
    "build": "vite build",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

**Key Points:**
- `build`: Builds the production-ready application
- `predeploy`: Runs automatically before `deploy` to ensure fresh build
- `deploy`: Uses `gh-pages` package to deploy `dist/` folder to `gh-pages` branch

### 3. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

The workflow automatically triggers on:
- Push to `main` branch
- Manual workflow dispatch

**Workflow Steps:**
1. **Checkout**: Clones the repository
2. **Setup Pages**: Configures GitHub Pages settings
3. **Setup Node.js**: Installs Node.js 20 with npm cache
4. **Install dependencies**: Runs `npm ci` for clean install
5. **Build**: Runs `npm run build` with `NODE_ENV=production`
6. **Add .nojekyll**: Creates `.nojekyll` file in `dist/` to disable Jekyll processing
7. **Verify build**: Lists dist/ contents and checks asset paths
8. **Upload artifact**: Uploads `dist/` folder as Pages artifact
9. **Deploy**: Deploys artifact to GitHub Pages

### 4. Static Files (`public/` directory)

Files in `public/` are copied to `dist/` during build:
- `.nojekyll`: Disables Jekyll processing (also added by workflow)
- `404.html`: Handles SPA routing for GitHub Pages
- `robots.txt`: Search engine directives
- `favicon.ico`: Site favicon
- `placeholder.svg`: Placeholder image

## Deployment Process

### Automatic Deployment

1. Push changes to `main` branch
2. GitHub Actions workflow triggers automatically
3. Application is built and deployed to GitHub Pages
4. Site is available at: https://elghazawy5367.github.io/Council-Git-V9/

### Manual Deployment

```bash
# Build and deploy manually using gh-pages package
npm run deploy

# Or build separately
npm run build
npx gh-pages -d dist
```

## Verification

After deployment, verify the following:

### 1. Check Build Artifacts

```bash
# Build locally
npm run build

# Verify dist/ structure
ls -la dist/
# Should contain:
# - index.html (with correct asset paths)
# - assets/ (JS and CSS files)
# - .nojekyll
# - 404.html
# - favicon.ico
# - placeholder.svg
# - robots.txt
```

### 2. Check Asset Paths in index.html

```bash
cat dist/index.html | grep -E 'src=|href='
```

Should show paths like:
- `/Council-Git-V9/assets/index-[hash].js`
- `/Council-Git-V9/assets/index-[hash].css`

### 3. Test Deployed Site

Visit: https://elghazawy5367.github.io/Council-Git-V9/

**Test Checklist:**
- [ ] Page loads without white screen
- [ ] No console errors about MIME types
- [ ] Assets load correctly (check Network tab)
- [ ] Application is functional
- [ ] Client-side routing works (refresh on sub-routes)

## Common Issues and Solutions

### Issue 1: White Page / MIME Type Error

**Symptom:** Browser tries to load `src/main.tsx` instead of built assets

**Cause:** Incorrect base path in vite.config.ts or missing build step

**Solution:**
1. Verify `base: '/Council-Git-V9/'` in vite.config.ts
2. Ensure `npm run build` is executed before deployment
3. Check GitHub Actions workflow is using built files from `dist/`

### Issue 2: 404 on Page Refresh

**Symptom:** Direct navigation to routes works, but refresh gives 404

**Cause:** GitHub Pages doesn't handle SPA routing by default

**Solution:** Already configured via:
- `public/404.html` redirects to index.html with route as query param
- `index.html` has script to parse query param and restore route
- Both files are included in deployment

### Issue 3: Assets Not Loading

**Symptom:** HTML loads but CSS/JS files return 404

**Cause:** Incorrect asset paths or missing base configuration

**Solution:**
1. Verify base path in vite.config.ts: `base: '/Council-Git-V9/'`
2. Check built index.html has correct paths: `/Council-Git-V9/assets/...`
3. Ensure `.nojekyll` file exists in dist/

### Issue 4: Jekyll Processing Errors

**Symptom:** Files with underscores in names (e.g., `_app.js`) not served

**Cause:** GitHub Pages uses Jekyll by default, which ignores underscore-prefixed files

**Solution:** `.nojekyll` file in dist/ disables Jekyll (handled automatically)

## GitHub Pages Settings

Ensure GitHub Pages is configured correctly in repository settings:

1. Go to: https://github.com/Elghazawy5367/Council-Git-V9/settings/pages
2. **Source:** GitHub Actions (not "Deploy from a branch")
3. **Custom domain:** (optional)
4. **Enforce HTTPS:** Enabled (recommended)

## Local Development

For local development, the base path is set to `/` for easier testing:

```bash
# Development server (uses base: '/')
npm run dev
# Visit: http://localhost:5000

# Production preview (uses base: '/Council-Git-V9/')
npm run build
npm run preview
# Visit: http://localhost:4173/Council-Git-V9/
```

## Environment Variables

The build process uses:
- `NODE_ENV=production`: Set in GitHub Actions workflow
- `command`: Vite automatically sets to 'build' or 'serve'
- `mode`: Vite automatically sets to 'production' or 'development'

## Dependencies

Key dependencies for deployment:
- `vite`: Build tool
- `gh-pages`: Manual deployment package (optional, backup to Actions)
- `@vitejs/plugin-react-swc`: Fast React compilation

## Troubleshooting

If deployment fails:

1. **Check GitHub Actions logs:**
   - Go to: https://github.com/Elghazawy5367/Council-Git-V9/actions
   - Click on the failed workflow run
   - Review build and deploy logs

2. **Verify build locally:**
   ```bash
   npm ci
   npm run build
   ls -la dist/
   ```

3. **Check permissions:**
   - Ensure GitHub Actions has write permissions for Pages
   - Check workflow permissions in `.github/workflows/deploy.yml`

4. **Manual verification:**
   ```bash
   # Check index.html paths
   grep -E 'src=|href=' dist/index.html
   
   # Check .nojekyll exists
   ls -la dist/.nojekyll
   
   # Check 404.html exists
   ls -la dist/404.html
   ```

## Summary

The deployment is configured with:
- ✅ Correct base path in vite.config.ts
- ✅ Build outputs to dist/ directory
- ✅ GitHub Actions workflow for automatic deployment
- ✅ .nojekyll to disable Jekyll processing
- ✅ 404.html for SPA routing support
- ✅ Predeploy and deploy scripts in package.json

All requirements from the problem statement are met and properly configured.
