# 🔧 GitHub Actions Workflow Fixes

This document contains exact fixes for all issues found in the audit.

---

## 🔴 CRITICAL FIX #1: github-discussions.yml

**Status**: Must fix before next scheduled run (Monday 2 PM UTC)

**File to Replace**: `.github/workflows/github-discussions.yml`

### Complete Replacement

```yaml
name: GitHub Discussions - Developer Pain Intelligence

on:
  schedule:
    - cron: '0 14 * * 1,4'  # Monday, Thursday at 2 PM UTC (twice weekly)
  workflow_dispatch:        # Manual trigger from GitHub UI

permissions:
  contents: write

jobs:
  github-discussions:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check feature flag
        id: flag
        run: |
          FLAG=$(node -e "
            const yaml = require('js-yaml');
            const fs = require('fs');
            try {
              const cfg = yaml.load(fs.readFileSync('config/2026-features.yaml','utf8'));
              console.log(cfg.features.github_discussions === true ? 'true' : 'false');
            } catch(e) { console.log('false'); }
          ")
          echo "enabled=$FLAG" >> $GITHUB_OUTPUT
          echo "github_discussions flag: $FLAG"

      - name: Run GitHub Discussions Intelligence (all niches)
        if: steps.flag.outputs.enabled == 'true'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx tsx scripts/run-github-discussions.ts

      - name: Commit intelligence reports
        if: steps.flag.outputs.enabled == 'true'
        run: |
          git config user.name "Council Intelligence Bot"
          git config user.email "bot@council-app.com"
          git add data/reports/github-discussions-*.md
          git add data/opportunities/github-discussions-*.json
          git diff --staged --quiet || git commit -m "💬 GitHub Discussions: Developer pain intelligence update"
          git push

      - name: Skip (feature flag disabled)
        if: steps.flag.outputs.enabled != 'true'
        run: |
          echo "GitHub Discussions skipped — github_discussions is false in config/2026-features.yaml"
          echo "To enable: set github_discussions: true in config/2026-features.yaml"
```

**To Apply Fix**:
```bash
# Option 1: Copy-paste the corrected YAML above into the file
# Option 2: Use sed/replacement commands

# On Windows PowerShell:
# Delete and recreate the file with correct content
```

---

## 🟠 HIGH FIX #2: hackernews-intelligence.yml

**Status**: Update actions to v4 and Node.js to 20

**File to Update**: `.github/workflows/hackernews-intelligence.yml`

### Changes Required

**BEFORE (Lines 1-21)**:
```yaml
name: HackerNews Intelligence - Tech Trends

on:
  schedule:
    - cron: '0 16 * * 1,4'  # Monday, Thursday at 4 PM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  hackernews-intelligence:
    runs-on: ubuntu-latest
    permissions:
      contents: write  # Needed to push reports to repository
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3           # ❌ CHANGE THIS
      
      - name: Setup Node.js
        uses: actions/setup-node@v3         # ❌ CHANGE THIS
        with:
          node-version: '18'                # ❌ CHANGE THIS
```

**AFTER (Lines 1-26)**:
```yaml
name: HackerNews Intelligence - Tech Trends

on:
  schedule:
    - cron: '0 16 * * 1,4'  # Monday, Thursday at 4 PM UTC
  workflow_dispatch:  # Manual trigger

permissions:
  contents: write  # Needed to push reports to repository

jobs:
  hackernews-intelligence:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4           # ✅ FIXED: v3 → v4

      - name: Setup Node.js
        uses: actions/setup-node@v4         # ✅ FIXED: v3 → v4
        with:
          node-version: '20'                # ✅ FIXED: 18 → 20
          cache: 'npm'                      # ✅ ADDED: npm cache
```

**Full Updated File**:
```yaml
name: HackerNews Intelligence - Tech Trends

on:
  schedule:
    - cron: '0 16 * * 1,4'  # Monday, Thursday at 4 PM UTC
  workflow_dispatch:  # Manual trigger

permissions:
  contents: write  # Needed to push reports to repository

jobs:
  hackernews-intelligence:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run HackerNews Intelligence
        run: npx tsx scripts/scan-hackernews.ts
      
      - name: Commit reports
        run: |
          git config user.name "HackerNews Bot"
          git config user.email "bot@council-app.com"
          git add data/reports/hackernews-*.md
          git commit -m "🗞️ HackerNews Intelligence: Tech trends report" || echo "No changes"
          git push
```

---

## 🟡 MEDIUM FIX #3: twin-mimicry.yml

**Status**: Add permissions block, separate steps, add caching

**File to Update**: `.github/workflows/twin-mimicry.yml`

### Complete Updated File

```yaml
name: Twin Mimicry

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly Sunday midnight
  workflow_dispatch:

permissions:
  contents: write  # Allow git push for mimic results

jobs:
  mimic:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Twin Mimicry
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node scripts/twin-mimicry.js
      
      - name: Commit results (if changes)
        run: |
          git config user.name "Twin Mimicry Bot"
          git config user.email "bot@council-app.com"
          git add . || true
          git diff --staged --quiet || git commit -m "🤖 Twin Mimicry: Weekly execution"
          git push || true
```

### What Changed
- ✅ Added `permissions: { contents: write }`
- ✅ Separated `npm install` and `node` commands
- ✅ Added `cache: npm` to setup-node
- ✅ Updated `node-version: 20` (with quotes for consistency)
- ✅ Added `GITHUB_TOKEN` env var
- ✅ Changed to `npm ci` (reproducible)

---

## 🟡 MEDIUM FIX #4: Feature Flag Validation

**Apply to**: 
- `autonomous-council.yml`
- `vector-indexer.yml`
- `self-learning.yml`

### Add This Step at Beginning of Job

Add this validation step right after "Install dependencies":

```yaml
      - name: Validate feature config exists
        run: |
          if [ ! -f "config/2026-features.yaml" ]; then
            echo "ERROR: config/2026-features.yaml not found!"
            echo "Required for feature flag detection."
            exit 1
          fi
          echo "✓ Feature configuration file found"
```

### Example: autonomous-council.yml (add after line 26)

```yaml
      - name: Install dependencies
        run: npm ci

      - name: Validate feature config exists
        run: |
          if [ ! -f "config/2026-features.yaml" ]; then
            echo "ERROR: config/2026-features.yaml not found!"
            echo "Required for feature flag detection."
            exit 1
          fi
          echo "✓ Feature configuration file found"

      - name: Check feature flag
        id: flag
        run: |
          FLAG=$(node -e "
            const yaml = require('js-yaml');
            const fs = require('fs');
            try {
              const cfg = yaml.load(fs.readFileSync('config/2026-features.yaml','utf8'));
              console.log(cfg.features.autonomous_swarm === true ? 'true' : 'false');
            } catch(e) { console.log('false'); }
          ")
          echo "enabled=$FLAG" >> $GITHUB_OUTPUT
          echo "autonomous_swarm flag: $FLAG"
```

---

## 🔍 Verification Commands

After applying fixes, verify with these commands:

### 1. Validate YAML Syntax

```bash
# Install yamllint if needed
npm install -g yamllint

# Check all workflows
yamllint .github/workflows/

# Check specific workflow
yamllint .github/workflows/github-discussions.yml
yamllint .github/workflows/hackernews-intelligence.yml
yamllint .github/workflows/twin-mimicry.yml
```

### 2. Verify Permissions Blocks

```bash
# Ensure all workflows (except market-gap.yml) have permissions block
grep -l "permissions:" .github/workflows/*.yml | wc -l
# Should return: 22 (all except market-gap.yml which is read-only)

grep -L "permissions:" .github/workflows/*.yml
# Should only show: market-gap.yml
```

### 3. Check Action Versions

```bash
# Find all v3 actions (should be 0 after fix)
grep -r "@v3" .github/workflows/
# Should return: 0 results after fixing hackernews-intelligence.yml

# Verify v4 checkout is standard
grep "checkout@v4" .github/workflows/*.yml | wc -l
# Should return: 22 or 23
```

### 4. Validate Node.js Versions

```bash
# Find any Node 18 references (should be 0 after fix)
grep -r "node-version.*18" .github/workflows/
# Should return: 0 results after fixing hackernews-intelligence.yml

# Verify Node 20 is standard
grep "node-version.*20" .github/workflows/*.yml | wc -l
# Should return: 22 or 23
```

### 5. Test github-discussions.yml Locally

```bash
# Create a test runner to parse the YAML
node -e "
const yaml = require('js-yaml');
const fs = require('fs');
try {
  const workflow = yaml.load(fs.readFileSync('.github/workflows/github-discussions.yml', 'utf8'));
  console.log('✓ YAML is valid!');
  console.log('Workflow name:', workflow.name);
  console.log('Triggers:', Object.keys(workflow.on).join(', '));
  console.log('Jobs:', Object.keys(workflow.jobs).join(', '));
} catch(e) {
  console.error('✗ YAML ERROR:', e.message);
  process.exit(1);
}
"
```

---

## 📋 Fix Checklist

- [ ] Fix `github-discussions.yml` YAML syntax (CRITICAL)
- [ ] Update `hackernews-intelligence.yml` to v4 actions (HIGH)
- [ ] Update `hackernews-intelligence.yml` to Node 20 (HIGH)
- [ ] Add permissions to `twin-mimicry.yml` (MEDIUM)
- [ ] Separate steps in `twin-mimicry.yml` (MEDIUM)
- [ ] Add npm cache to `twin-mimicry.yml` (MEDIUM)
- [ ] Add feature config validation to 3 flag-dependent workflows (MEDIUM)
- [ ] Run yamllint on all workflows
- [ ] Verify no v3 actions remain
- [ ] Verify no Node 18 references remain
- [ ] Test each fixed workflow manually (workflow_dispatch)
- [ ] Commit fixes with message: "fix: resolve github actions audit issues"

---

## 🚀 Deployment Plan

### Phase 1: Critical Fix (Immediate)
```bash
# 1. Fix github-discussions.yml
# 2. Test locally: yamllint .github/workflows/github-discussions.yml
# 3. Commit: git add .github/workflows/github-discussions.yml
# 4. Push to main immediately
```

### Phase 2: High Priority (Within 24h)
```bash
# 1. Update hackernews-intelligence.yml
# 2. Verify: grep hackernews-intelligence.yml | grep "@v4"
# 3. Commit and push
```

### Phase 3: Medium Priority (Within 1 week)
```bash
# 1. Update twin-mimicry.yml
# 2. Add feature config validation (3 workflows)
# 3. Run full yamllint suite
# 4. Commit and push
```

---

## 📞 Support

**If fixes fail to work**:

1. Check that files were saved with Unix line endings (LF, not CRLF)
   ```bash
   # Convert to LF if needed
   dos2unix .github/workflows/github-discussions.yml
   ```

2. Verify no tab characters in YAML (only spaces)
   ```bash
   # Check for tabs (none should appear)
   grep -P '\t' .github/workflows/github-discussions.yml
   ```

3. Test the workflow can be parsed:
   ```bash
   node -e "const yaml = require('js-yaml'); const fs = require('fs'); console.log(yaml.load(fs.readFileSync('.github/workflows/github-discussions.yml', 'utf8')));"
   ```

---

**Fixes Prepared**: 2026-04-15  
**Status**: Ready to apply  
**Estimated fix time**: 30 minutes total
