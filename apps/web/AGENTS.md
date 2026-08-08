# Web Application Development Instructions

These rules extend the root `AGENTS.md`.

## Scope

Applies to `apps/web` and its descendants. This is the main Angelisyn web/dashboard application.

## Architecture

Preserve the existing Next.js and React architecture. Reuse existing components, providers, hooks, API clients, and query patterns before creating new ones.

## Server / Client

Preserve server/client component boundaries and existing authentication patterns. Do not introduce a new UI framework or state-management library without explicit instruction.

## Verification

Run the relevant web application typecheck, lint, tests, and build tasks that actually exist in the repository.

## Scope Boundaries

Do not modify API or shared packages unless a requested web change genuinely requires a coordinated change.
