# Angelisyn Development Instructions

## Project

This is the Angelisyn platform monorepo. It uses pnpm, Turborepo, TypeScript, Node.js, Prisma, React/Next.js applications where applicable, and shared packages.

## Application Map

- `apps/api` — backend API
- `apps/web` — main Angelisyn web/dashboard application
- `apps/website` — paused public website
- `apps/ide` — future Angelisyn IDE
- `apps/dashboard` — unused placeholder; do not treat it as the main dashboard application

## Core Rules

Before changing code, inspect the relevant files, related imports and exports, existing implementations, and the surrounding architecture. Make the smallest correct change.

Do not rewrite unrelated files, create duplicate implementations, types, or utilities, introduce unnecessary dependencies, change architecture without justification, remove working functionality, or modify unrelated applications or packages.

## Monorepo

Respect workspace boundaries. Before changing a shared package, determine its consumers. Do not modify lockfiles manually. Use pnpm for package management and existing Turbo tasks when available.

## Existing Code Has Priority

Before creating an abstraction, utility, type, or component, search the repository for an existing implementation and extend it where appropriate.

## TypeScript

Use the repository's existing TypeScript configuration. Prefer existing types, interfaces, and aliases. Avoid `any` unless technically justified, preserve strict typing, and keep simple imports on one line. Do not create duplicate domain types.

## React / Next.js

For web application work, inspect and reuse existing components, shared UI, hooks, providers, API clients, and patterns. Preserve server/client boundaries. Do not introduce a new UI library without explicit instruction.

## API

Respect the existing backend architecture. Before modifying authentication, inspect controllers, services, DTOs, guards, strategies, interfaces, modules, and JWT configuration. Do not casually redesign authentication.

## Prisma

Use the existing Prisma architecture and configuration. Before modifying the schema, inspect it, its migrations, affected services, and generated-client usage. Do not make destructive database changes without explicit approval.

## Security

Never hardcode credentials, expose secrets, commit API keys or private keys, disable authentication merely to make tests pass, bypass authorization checks, or weaken security controls without explicit instruction. Use the existing environment-variable and secret-management mechanisms. Security testing must target only authorized systems.

## Git

Before substantial changes, run `git status` and inspect relevant diffs. Do not reset or discard user changes, force-push, rewrite history, or perform destructive Git operations unless explicitly instructed.

## Verification

After changes, run appropriate repository-defined checks such as typecheck, lint, tests, builds, and Turbo task validation. Do not claim a check passed unless it was actually executed. Report changed files, verification commands and results, and remaining issues.

## Error Fixing

When a build or type error occurs, read the error, inspect related imports, exports, dependencies, and configuration, identify the root cause, make the smallest fix, and rerun the failing check. Do not hide errors by disabling checks.

## Scope

Only modify files required for the requested task. Do not perform unrelated cleanup or refactoring. Identify affected packages before a necessary cross-package change.

## Paused Website

The public website is paused. Do not modify it unless explicitly requested.

## Future IDE

The IDE is a future separate application. Do not begin IDE implementation unless explicitly requested. Preserve its separation from the web application, API, website, and shared packages.

## Communication

After completing a task, report what changed, files changed, verification commands and results, and remaining problems.
