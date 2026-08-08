# API Development Instructions

These rules extend the root `AGENTS.md`.

## Scope
Applies to `apps/api` and its descendants.

## Architecture
Preserve the existing API module structure. Inspect modules, controllers, services, DTOs, guards, strategies, interfaces and configuration before changing related code.

## Authentication
Before modifying authentication or JWT behavior, search all payload producers and consumers. Keep JWT types consistent across generation, validation, strategies, guards and request typing.

## Validation
Reuse existing validation and DTO patterns.

## Database
Follow the repository's Prisma/database architecture. Do not introduce direct database access patterns that bypass established service boundaries.

## Verification
After API changes, run the relevant API typecheck, lint, tests and build tasks that actually exist in the repository.

## Scope
Do not modify web, website, or future IDE code unless the requested API change genuinely requires a coordinated change.
