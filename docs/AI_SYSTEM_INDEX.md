# AI System Documentation Index

Purpose: canonical reading order for AI agents and maintainers to understand and safely modify this repository's documentation-backed system model.

## Recommended Reading Order

1. **README.md** — Product overview, workflows, commands, and high-level architecture.
2. **/docs/CODEX.md** — Execution rules and change safety policy.
3. **/docs/ARCHITECTURE.md** — Repository structure, boundaries, and module map.
4. **/docs/SYSTEM_CONTEXT.md** — Runtime lifecycle and behavior model.
5. **/docs/REFACTOR_RULES.md** — Refactor safety constraints.
6. **/docs/ERROR_PATTERNS.md** — Known risks and issue registry.
7. **/docs/DEPENDENCY_MAP.md** — Internal/external dependency graph and critical chains.
8. **/docs/TOOLING_CONTEXT.md** — MCP/tool orchestration, sequential reasoning, and skills usage.
9. **/docs/DOCUMENTATION_COVERAGE_MAP.md** — Coverage inventory, overlaps, and gaps.
10. **/docs/ARCHITECTURE_V5_SPEC.md** — merged v5 architecture outline (no-duplication synthesis).

## Relationship to Existing Docs

- Existing guides in `/docs/guides` and `/docs/reference` are preserved and should be used as domain-specific supplements.
- Architecture content in `README.md` is treated as the high-level source; deeper technical detail is delegated to `/docs/ARCHITECTURE.md` and `/docs/DEPENDENCY_MAP.md`.
- Historical implementation notes in `/docs/archive` remain reference-only and are not canonical for current architecture decisions.

## Scope Rules

- Prefer linking to existing docs over duplicating content.
- If a domain already has an owner file, update that file rather than creating an overlapping document.
- If uncertain whether documentation is current, flag a **Requires Manual Verification** note in the target file.
