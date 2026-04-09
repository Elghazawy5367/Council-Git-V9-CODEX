# Refactor Rules

## Refactor Strategy

Use incremental, dependency-aware refactoring only.

### Mandatory Sequence
1. Define bounded scope.
2. Identify all importers and exported contracts.
3. Apply smallest refactor step.
4. Run validation checks.
5. Commit when stable.

## Safe Rename Rules

- Rename symbols/files only when all import paths are updated atomically.
- Prefer IDE-assisted rename or scripted rename with verification.
- Preserve public API compatibility via wrappers when needed.

## Dependency-Aware Editing Rules

- For files with many inbound imports, avoid behavior changes in the same commit as structural changes.
- For central modules (`stores`, `services`, `lib`), perform focused changes and verify downstream call-sites.
- Do not cross browser and Node runtime boundaries during refactors.

## Backward Compatibility Protection

- Maintain compatibility wrappers while migration is in progress (current pattern used for legacy feature stores).
- Deprecations must include migration target and expected removal strategy.
- Preserve script names in `package.json` unless migration docs are included.

## Legacy Preservation Methods

- Keep old behavior reachable during staged migrations.
- Record migration examples in docs before removing compatibility layers.
- Archive historical docs rather than deleting unknown-context material.

## High-Risk Refactor Areas

- Large files (>500 LOC) with mixed concerns.
- Store/service boundaries that are consumed by many components.
- Files containing significant `any` usage, where implicit contracts may be hidden.

## Refactor Completion Checklist

- [ ] Imports resolved and type-check passes.
- [ ] Build passes for runtime-impacting changes.
- [ ] No public contract drift without migration notes.
- [ ] Related docs updated.
