# Coding Standards

## Purpose

This document defines the engineering standards used throughout the Angelisyn platform.

All contributors should follow these conventions to maintain consistency, readability, and maintainability.

---

# General Principles

- Write clean and readable code.
- Prefer simplicity over cleverness.
- Keep functions small and focused.
- Avoid duplicated logic.
- Document public APIs.
- Write tests for new functionality.

---

# Project Structure

```text
apps/
packages/
services/
docs/
scripts/
tests/
```

Each directory should have a single, well-defined responsibility.

---

# Naming Conventions

## Folders

Use lowercase with hyphens.

Examples

```
scanner-engine
asset-service
http-parser
```

---

## Files

Examples

```
scanner.ts
port-service.ts
config.ts
logger.ts
```

---

## Classes

Use PascalCase.

```
ScannerEngine
PortScanner
HttpClient
```

---

## Functions

Use camelCase.

```
scanPorts()

discoverAssets()

generateReport()
```

---

## Constants

Use UPPER_SNAKE_CASE.

```
DEFAULT_TIMEOUT

MAX_CONCURRENT_SCANS
```

---

# TypeScript

- Enable strict mode.
- Avoid the `any` type.
- Prefer interfaces for object shapes.
- Export reusable types.

---

# Error Handling

- Never ignore exceptions.
- Return meaningful error messages.
- Log errors with context.
- Avoid exposing sensitive information.

---

# Logging

Every service should use the shared logging package.

Logs should include:

- Timestamp
- Log level
- Service name
- Correlation ID (when available)

---

# Security

- Validate all inputs.
- Sanitize external data.
- Never hardcode secrets.
- Store configuration in environment variables.
- Use parameterized database queries.

---

# Documentation

Every public module should include:

- Description
- Parameters
- Return values
- Usage examples (when appropriate)

---

# Testing

Each module should include:

- Unit Tests
- Integration Tests

Critical features should also include:

- End-to-End Tests

---

# Commit Messages

Use Conventional Commits.

Examples

```
feat: add scanner scheduler

fix: resolve ssl parser issue

docs: update architecture

refactor: improve port scanning performance

test: add scanner unit tests
```

---

# Pull Requests

A pull request should:

- Build successfully
- Pass all tests
- Include documentation updates
- Follow coding standards
- Be focused on a single feature or fix