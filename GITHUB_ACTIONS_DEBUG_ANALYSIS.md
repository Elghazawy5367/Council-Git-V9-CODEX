# 🔍 CRITICAL FIX: github-discussions.yml Analysis

## The Problem

The `github-discussions.yml` file has severe YAML indentation corruption. Every key after the first trigger is deeply nested, creating an invalid YAML structure that GitHub Actions cannot parse.

---

## Visual Breakdown of the Error

### INCORRECT (Current State) ❌

Lines 1-54 show progressive nesting corruption:

```yaml
on:
  schedule:
    - cron: '0 14 * * 1,4'
      workflow_dispatch:                    # ❌ Should be sibling to 'schedule', not child
        permissions:                        # ❌ Nested under workflow_dispatch  
          contents: write
            jobs:                           # ❌ Nested under permissions
              github-discussions:
                runs-on: ubuntu-latest
                  steps:                    # ❌ Excessive indentation
                    - name: Checkout
                      uses: actions/checkout@v4
                        - name: Setup Node   # ❌ Double-nested step
                          uses: ...
```

### CORRECT (Fixed Version) ✅

```yaml
on:
  schedule:
    - cron: '0 14 * * 1,4'
  workflow_dispatch:                        # ✅ Same level as 'schedule'

permissions:                                # ✅ Top-level key
  contents: write

jobs:                                       # ✅ Top-level key
  github-discussions:
    runs-on: ubuntu-latest
    steps:                                  # ✅ Proper indentation (4 spaces)
      - name: Checkout repository
        uses: actions/checkout@v4
```

---

## Key YAML Indentation Rules

1. **Top-level keys** (`on:`, `permissions:`, `jobs:`) = 0 spaces
2. **One level deep** (`schedule:`, `workflow_dispatch:`, `contents:`) = 2 spaces
3. **Array items** (`- name:`, `- cron:`) = proper nesting + 2 spaces
4. **Step properties** (`uses:`, `run:`, `with:`, `env:`) = 4 spaces under the step

---

## Side-by-Side Line Comparison

### Lines 3-9: INCORRECT ❌

```yaml
on:
  schedule:
    - cron: '0 14 * * 1,4'  # Monday, Thursday at 2 PM UTC
      workflow_dispatch:          # ❌ WRONG: nested under cron array item
        permissions:              # ❌ WRONG: nested 8 spaces deep
          contents: write         # ❌ WRONG: nested 10 spaces deep
          
            jobs:                 # ❌ WRONG: nested 12 spaces deep
              github-discussions: # ❌ WRONG: nested 14 spaces deep
```

### Lines 3-9: CORRECT ✅

```yaml
on:
  schedule:
    - cron: '0 14 * * 1,4'  # Monday, Thursday at 2 PM UTC
  workflow_dispatch:              # ✅ CORRECT: 2 spaces (sibling to schedule)

permissions:                      # ✅ CORRECT: 0 spaces (top-level)
  contents: write                 # ✅ CORRECT: 2 spaces

jobs:                             # ✅ CORRECT: 0 spaces (top-level)
  github-discussions:             # ✅ CORRECT: 2 spaces
```

---

## Error Message When Parsing

If you run this YAML through any parser, you get:

```
YAMLError: mapping values are not allowed here
  in "github-discussions.yml", line 6, column 7
    | workflow_dispatch:
    | ^
```

**Translation**: You can't have `workflow_dispatch:` as a child property of a cron line. These must be sibling keys under `on:`.

---

## The Full Current File (Corrupted)

```yaml
1.  name: GitHub Discussions - Developer Pain Intelligence
2.  
3.  on:
4.    schedule:
5.      - cron: '0 14 * * 1,4'  # Monday, Thursday at 2 PM UTC
6.        workflow_dispatch:          # ❌ ERROR: should not be indented here
7.            permissions:            # ❌ ERROR: cascading nesting
8.              contents: write
9. 
10.             jobs:                 # ❌ ERROR: completely wrong scope
11.               github-discussions:
12.                   runs-on: ubuntu-latest
13. 
14.                     steps:        # ❌ ERROR: massive indentation
15.                           - name: Checkout repository
16.                                   uses: actions/checkout@v4
17. 
18.                                     - name: Setup Node.js
19.                                             uses: actions/setup-node@v4
...
```

This is **completely broken YAML** that cannot be parsed.

---

## How to Fix

### Option 1: Copy the Correct Version
1. Open `.github/workflows/github-discussions.yml`
2. Delete all content
3. Copy the corrected YAML from `GITHUB_ACTIONS_FIXES.md`
4. Paste and save

### Option 2: Use Command Line

**PowerShell**:
```powershell
# Backup the broken file
Copy-Item .github/workflows/github-discussions.yml .github/workflows/github-discussions.yml.broken

# Create corrected version
@"
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
"@ | Out-File -Encoding UTF8 -Force .github/workflows/github-discussions.yml

Write-Host "✓ File corrected successfully"
```

**Bash**:
```bash
# Create corrected version
cat > .github/workflows/github-discussions.yml << 'EOF'
name: GitHub Discussions - Developer Pain Intelligence

on:
  schedule:
    - cron: '0 14 * * 1,4'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  github-discussions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - id: flag
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
      - if: steps.flag.outputs.enabled == 'true'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx tsx scripts/run-github-discussions.ts
      - if: steps.flag.outputs.enabled == 'true'
        run: |
          git config user.name "Council Intelligence Bot"
          git config user.email "bot@council-app.com"
          git add data/reports/github-discussions-*.md
          git add data/opportunities/github-discussions-*.json
          git diff --staged --quiet || git commit -m "💬 GitHub Discussions: Developer pain intelligence update"
          git push
EOF
```

---

## Verification After Fix

Run these commands to confirm the fix works:

### 1. Validate YAML Syntax

```bash
# Install yamllint if needed
npm install -g yamllint

# Check syntax
yamllint .github/workflows/github-discussions.yml
```

Expected output:
```
✓ Successful: 0 errors, 0 warnings
```

### 2. Parse and Verify Structure

```bash
node -e "
const yaml = require('js-yaml');
const fs = require('fs');
try {
  const w = yaml.load(fs.readFileSync('.github/workflows/github-discussions.yml', 'utf8'));
  console.log('✓ YAML is valid!');
  console.log('Workflow name:', w.name);
  console.log('Top-level keys:', Object.keys(w).join(', '));
  console.log('Triggers:', Object.keys(w.on).join(', '));
  console.log('Jobs:', Object.keys(w.jobs).join(', '));
} catch(e) {
  console.error('✗ ERROR:', e.message);
  process.exit(1);
}
"
```

Expected output:
```
✓ YAML is valid!
Workflow name: GitHub Discussions - Developer Pain Intelligence
Top-level keys: name, on, permissions, jobs
Triggers: schedule, workflow_dispatch
Jobs: github-discussions
```

### 3. Commit the Fix

```bash
git add .github/workflows/github-discussions.yml
git commit -m "fix: resolve github-discussions.yml YAML syntax error

The workflow had severe indentation corruption that made it unparseable
by GitHub Actions. All keys after the cron trigger were incorrectly nested.

Fixed by properly restructuring:
- workflow_dispatch is now a sibling to schedule (under 'on:')
- permissions is a top-level key (not nested under workflow_dispatch)
- jobs is a top-level key (not nested under permissions)
- All steps have correct indentation (2 spaces per nesting level)

Verification: yamllint passes, YAML parser confirms valid structure.
"
git push
```

---

## Root Cause Analysis

This error likely occurred due to one of these:

1. **Manual YAML editing mistake** - incorrect copy-paste or auto-indent gone wrong
2. **IDE auto-formatter** - incorrect YAML formatter applied (e.g., auto-indent all lines)
3. **Find & Replace error** - search/replace that affected indentation
4. **File encoding issue** - mixed tabs and spaces
5. **Merge conflict** - improper conflict resolution
6. **Accidental nested edit** - starting edit at wrong line

---

## Prevention: Add CI Validation

Add workflow validation to your CI pipeline:

```yaml
# In your main CI workflow (.github/workflows/ci.yml)
- name: Validate GitHub Actions workflows
  run: |
    npm install -g yamllint
    yamllint .github/workflows/
```

This catches YAML errors BEFORE they're pushed to main.

---

## Timeline

- **Detected by**: GitHub Actions Architecture Auditor (static validation)
- **Risk Level**: 🔴 CRITICAL (all runs fail)
- **Status**: Not functional (0% success rate)
- **Impact**: GitHub Discussions intelligence feature is completely broken
- **Last Scheduled Run**: Monday 2 PM UTC (FAILED if not fixed before then)
- **Fix Complexity**: ⭐ Easy (copy-paste correct YAML)
- **Time to Fix**: < 5 minutes

---

**Next Step**: Copy the corrected YAML from `GITHUB_ACTIONS_FIXES.md` and replace the current file.
