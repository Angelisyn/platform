# Angelisyn Architecture Decisions

Use this document for decisions that materially affect architecture, technology, security or repository boundaries.

## Decision Template

### ADR-XXX — Title

**Status:** Proposed / Accepted / Superseded / Rejected

**Date:** YYYY-MM-DD

**Context**

What problem required a decision?

**Decision**

What was chosen?

**Alternatives**

What other approaches were considered?

**Reason**

Why was the chosen approach preferred?

**Consequences**

What benefits, costs or constraints follow?

---

## ADR-001 — pnpm + Turborepo Monorepo

**Status:** Accepted

**Decision**

Use pnpm workspace management with Turborepo for the monorepo.

**Reason**

The repository contains multiple applications and reusable packages that benefit from shared tooling and coordinated tasks.

## ADR-002 — Separate Web Dashboard and IDE

**Status:** Accepted

**Decision**

The Angelisyn web dashboard (`apps/web`) and future Angelisyn IDE remain separate applications.

**Reason**

The dashboard is a web product while the IDE is a developer environment with different runtime, filesystem and process requirements.
