# Angelisyn Architecture

## Purpose
This document is the architectural source of truth for Angelisyn.

## Repository Layers

```text
platform/
├── apps/       # user-facing applications
├── packages/   # reusable shared packages
├── services/   # service-level functionality
├── scripts/    # repository automation
├── tests/      # tests
└── docs/       # documentation
```

## Application Boundaries

### API
Path: `apps/api`

Purpose: backend/API functionality.

### Web Application
Path: `apps/web`

Purpose: main Angelisyn web/dashboard application.

### Website
Path: `apps/website`

Status: paused. It remains preserved but is not part of active development unless explicitly requested.

### IDE
Path: `apps/ide`

Status: future application. It is intended to remain separate from the dashboard and API.

## Shared Packages

Current repository packages include:
- `packages/config`
- `packages/eslint-config`
- `packages/sdk`
- `packages/types`
- `packages/ui`
- `packages/validation`

Document each package's public responsibility here as its implementation stabilizes.

## Architecture Rules
- Keep application-specific code inside its application.
- Put reusable code in shared packages only when multiple consumers genuinely need it.
- Avoid circular dependencies.
- Preserve package boundaries.
- Prefer explicit contracts between applications and services.

## Data Flow
Document important request/data flows here as they become stable.

## Authentication
Document the real authentication flow here once the implementation is finalized. Keep this document synchronized with code; do not invent behavior.

## Source of Truth
Code and executable configuration are authoritative for implementation details. This document explains stable architecture and boundaries, not every implementation detail.
