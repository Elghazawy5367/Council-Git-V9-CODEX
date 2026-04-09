# System Context

## System Responsibilities

1. Collect market and repository intelligence from external sources.
2. Run multi-expert analysis workflows.
3. Synthesize expert outputs into decision-oriented verdicts.
4. Persist and surface results through dashboards/history.
5. Support automation and MCP-driven tool integration.

## Runtime Lifecycle

```text
Bootstrap (main.tsx)
  → protection initialization
  → background DB initialization
  → React render with boundaries/providers
  → route-driven feature loading (lazy pages)
```

## Execution Flow (Council)

```text
User input/task
  → Phase 1: expert execution (parallel baseline)
  → intermediate outputs/cost tracking
  → Phase 2: judge synthesis mode execution
  → final synthesis + verdict + persistence
```

## Feature Clusters

- **Council**: multi-expert orchestration + synthesis.
- **Automation**: feature execution dashboards and reports.
- **Dashboard/Analytics**: decision and performance insight views.
- **Devtools**: analysis panels and worker-driven utilities.
- **Settings**: API key, runtime options, and UI toggles.

## Data Lifecycle

1. Input captured in UI/store state.
2. External calls produce streaming or batch outputs.
3. Outputs normalized into store + service structures.
4. Persisted to IndexedDB/local caches/history stores.
5. Reused for dashboards, timeline views, and report tooling.

## API Interaction Model

- Service/client wrappers isolate external API specifics.
- Failures are typically handled as partial failures (best-effort execution, non-blocking where possible).
- Tooling scripts execute independent workflows for periodic intelligence generation.

## User Interaction Lifecycle

1. Configure experts/settings.
2. Submit task or run automated feature workflow.
3. Observe status/progress and partial outputs.
4. Trigger synthesis/judge step.
5. Review verdict, history, and analytics.

## Requires Manual Verification

- Exact runtime behavior of each script in `scripts/` may vary by environment variables and API availability.
- Some docs in `/docs/archive` may describe prior flow variants.
