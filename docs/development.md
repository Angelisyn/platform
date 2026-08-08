# Angelisyn Development Guide

## Requirements
Use the versions declared by the repository configuration and package manager metadata.

Primary tooling:
- Node.js
- pnpm
- Git
- TypeScript
- Turborepo
- Prisma

## Install
From the repository root:

```powershell
pnpm install
```

## Development
Use the scripts defined by the repository and individual workspace packages. Prefer existing Turborepo tasks for multi-package workflows.

## Verification
For a normal code change, choose relevant checks such as:

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Only use commands that actually exist in the repository. Inspect `package.json` files before assuming a script name.

## Database
Document the project's real Prisma/database workflow here, including environment setup and migration commands, once confirmed.

Never commit secrets or production credentials.

## Recommended Workflow
1. `git status`
2. Inspect relevant code.
3. Make a focused change.
4. Run targeted checks.
5. Run broader checks when shared code changes.
6. Inspect `git diff`.
7. Record important architectural changes in `docs/DECISIONS.md`.

## Environment
Document required environment variables by name and purpose, never their secret values.

## Troubleshooting
Record recurring build, dependency, database and environment problems here with verified fixes.
