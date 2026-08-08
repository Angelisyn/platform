# Angelisyn Testing Strategy

## Goals
Tests should provide confidence in correctness, security and regression resistance.

## Test Layers

### Unit
Test isolated functions, services and utilities.

### Integration
Test interactions between modules, databases and external boundaries where appropriate.

### End-to-End
Test important user and API workflows.

### Build / Type
Type checking and production builds are verification layers, not substitutes for behavioral tests.

## Test Placement
Follow the repository's existing conventions. Do not create a second testing structure without a reason.

## Required Verification
Choose checks based on the affected area:
- typecheck
- lint
- unit tests
- integration tests
- end-to-end tests
- build

## Security Testing
Only test systems and environments for which authorization exists.

## Test Data
Do not use real credentials, secrets or sensitive production data.

## Failure Handling
When a test fails, identify the root cause rather than weakening the assertion or disabling the test.
