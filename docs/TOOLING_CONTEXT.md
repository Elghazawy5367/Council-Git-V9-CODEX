# Tooling Context

## MCP Compatibility Strategy

The repository includes first-party MCP tooling support via `src/lib/mcp-servers/*` and `scripts/run-mcp-server.ts`.

Compatibility rules:
- Keep stable MCP tool names once published.
- Version MCP server intentionally when tool contracts change.
- Separate tool registration (index) from tool implementations.
- Ensure token requirements are explicit per tool.

## Tool Orchestration Model

### Standard Routing Logic

1. **Code modification tasks**
   - Inspect impacted files and dependencies first.
   - Apply minimal patch.
   - Run typecheck/build validations.

2. **Dependency analysis tasks**
   - Build/inspect import graph.
   - Highlight critical chains and risk boundaries.

3. **Build validation tasks**
   - Run `npm run typecheck` then `npm run build`.
   - Escalate failing module areas only.

4. **Static analysis tasks**
   - Lint/type checks + targeted grep/scan scripts.
   - Record weak typing and large-file hotspots.

5. **External automation tasks**
   - Use scripts in `scripts/*.ts` for repeatable execution.
   - Keep environment-sensitive steps explicit.

## Sequential Thinking Model

Use this default reasoning sequence:

1. Understand task
2. Build plan
3. Execute in stages
4. Validate after each stage
5. Repair errors
6. Confirm integrity

This aligns with operational policy in `/docs/CODEX.md`.

## Sequential Reasoning Workflow (Agent-facing)

```text
Intake
  → Context scan (docs + code)
  → Plan with boundaries
  → Stage execution
  → Stage validation
  → Fix/regress checks
  → Final integrity confirmation
```

## External Skills Usage

When a local skill is available and task-matched:
- Load only required `SKILL.md` instructions.
- Reuse provided scripts/templates instead of recreating workflows.
- Apply minimal skill set needed for the task.

## AI-Assisted Workflow Patterns

- Prefer repository-native scripts over ad hoc commands.
- Record assumptions explicitly; mark uncertain areas as manual verification.
- Preserve deterministic command paths for reproducibility.

## Tool Chaining Safety

- Never chain destructive operations without prior validation checkpoints.
- For multi-step changes: checkpoint after each stage with command output.
- Keep docs and implementation changes synchronized when contracts change.

## External API Usage Safety

- Validate API key presence before request execution.
- Use defensive error handling for rate limits and transient failures.
- Avoid treating external API response shape as permanently stable.
