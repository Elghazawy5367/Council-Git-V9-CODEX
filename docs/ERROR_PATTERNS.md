# Error Patterns Registry

Purpose: centralize known risk/error patterns and provide a place to append future failures.

## Detected Repository Risk Patterns

## 1) Runtime Boundary Mismatch (Node-only libs in browser paths)
- **Pattern**: importing Node-oriented packages into frontend execution paths can break Vite/browser runtime.
- **Current mitigation**: explicit Node-only package exclusion in Vite config.
- **Risk level**: High.

## 2) Large-file Change Blast Radius
- **Pattern**: files >500 LOC in `src/lib`, services, and key components increase regression probability.
- **Risk level**: Medium-High.

## 3) Transitional Store Layer Drift
- **Pattern**: coexistence of unified stores and deprecated compatibility wrappers can create duplicated state assumptions.
- **Risk level**: Medium.

## 4) Weak Typing Hotspots
- **Pattern**: repeated `any` usage in integration-heavy modules can hide contract breaks until runtime.
- **Risk level**: Medium.

## 5) External API Volatility
- **Pattern**: GitHub/Reddit/OpenRouter responses, rate limits, or schema changes can degrade tool outputs.
- **Risk level**: Medium-High.

## 6) Documentation Drift
- **Pattern**: many implementation-summary docs can become stale relative to current code.
- **Risk level**: Medium.

---

## Failure Log Template (append-only)

### Incident Record
- **Date (UTC)**:
- **Subsystem**:
- **Trigger**:
- **Observed Symptoms**:
- **Root Cause (confirmed / suspected)**:
- **Impact**:
- **Fix Applied**:
- **Follow-up Actions**:
- **Verification Command(s)**:

### Example Subsystems
- Council execution
- Store synchronization
- MCP tooling
- Build/deployment
- Data/report pipelines
