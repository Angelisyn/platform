# Development Guide

## Introduction

This guide explains how to set up the Angelisyn development environment and contribute to the project.

---

# Development Environment

## Required Software

- Git
- Visual Studio Code
- Node.js (LTS)
- pnpm
- Docker Desktop
- PostgreSQL
- Redis

---

# Recommended VS Code Extensions

- ESLint
- Prettier
- GitLens
- Docker
- GitHub Pull Requests
- Error Lens
- YAML
- Markdown All in One

---

# Repository Structure

```text
platform/

apps/
packages/
services/
docs/
scripts/
tests/
```

---

# Git Workflow

Main Branch

```
main
```

Development Branch

```
develop
```

Feature Branch

```
feature/<feature-name>
```

Example

```
feature/dashboard
feature/scanner
feature/api
```

---

# Commit Convention

Examples

```
feat: add dashboard authentication

fix: resolve dns parser bug

docs: update architecture

refactor: optimize scanner engine

test: add unit tests
```

---

# Pull Requests

Every feature should

- Build successfully
- Pass all tests
- Follow coding standards
- Include documentation updates

---

# Testing

Every module should include

- Unit Tests
- Integration Tests
- End-to-End Tests

---

# Code Reviews

Every Pull Request should be reviewed before merging into the main branch.

---

# Development Principles

- Keep modules independent.
- Write readable code.
- Document public APIs.
- Avoid duplicate logic.
- Prefer composition over inheritance.
- Write tests for new features.

---

# Future Tooling

The following tools will be configured during Phase 2.

- pnpm Workspace
- Turborepo
- TypeScript
- ESLint
- Prettier
- Husky
- Docker
- GitHub Actions