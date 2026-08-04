# Angelisyn Architecture

## Overview

Angelisyn is designed as a modular cybersecurity platform.

Each capability is separated into independent applications, services, and reusable packages.

This architecture enables scalability, maintainability, and future expansion.

---

## High-Level Architecture

```text
                Internet
                    │
                    ▼
          ┌──────────────────┐
          │   Next.js Frontend │
          └──────────────────┘
                    │
                    ▼
             REST API Gateway
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
 Discovery      Intelligence     Reporting
 Service          Service         Service
     ▼              ▼              ▼
 PostgreSQL      Redis         Object Storage
```

---

## Repository Layout

```text
platform/

apps/
packages/
services/
scripts/
docs/
tests/
```

---

## Applications

### Dashboard

User interface.

Technology:

- Next.js
- React
- TailwindCSS

---

### API

Backend API.

Technology

- Fastify
- TypeScript

---

## Services

Discovery

Responsible for

- DNS
- WHOIS
- Port Scan
- HTTP
- SSL

---

Intelligence

Responsible for

- CVEs
- Fingerprinting
- Technologies
- Threat Intelligence

---

Reporting

Responsible for

- Reports
- Export
- Dashboards

---

## Packages

Reusable libraries.

Examples

- logger
- config
- ui
- types
- auth
- scanner

---

## Database

Primary Database

PostgreSQL

Caching

Redis

---

## Security

Authentication

JWT

Authorization

RBAC

HTTPS Everywhere

Rate Limiting

Audit Logs

Input Validation

---

## Deployment

Development

Docker Compose

Production

Docker

Reverse Proxy

Cloud Infrastructure

---

## Future

Plugin System

CLI

Public API

AI Assistant

Enterprise Edition