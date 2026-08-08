# Angelisyn IDE Development Instructions

## Status
The Angelisyn IDE is a future application. These instructions apply only when IDE development is explicitly started.

## Architecture
Keep the IDE separate from the dashboard and website.

Potential responsibilities include:
- code editor
- file explorer
- terminal
- Git integration
- build/test runner
- Angelisyn development tooling
- AI coding assistance

Do not implement security or external-system capabilities without explicit scope and authorization.

## Reuse
Reuse appropriate Angelisyn shared packages where practical, but do not force dashboard-specific UI or browser-only assumptions into the desktop IDE.

## Verification
Verify desktop packaging, renderer code, main-process code and IPC boundaries separately where applicable.
