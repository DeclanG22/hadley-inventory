# Tool Inventory Backend

## Project Overview

This repository contains the backend service for a Tool Inventory Management System.

The application is being developed to replace an existing Excel-based inventory tracking workflow with a centralized database-driven system and REST API.

The project is currently in the requirements gathering and initial architecture phase. The inventory data model is not finalized and should be treated as evolving. Do not assume specific fields, statuses, workflow rules, or business processes unless they are explicitly defined in the codebase.

## Primary Goals

- Replace spreadsheet-based inventory management
- Provide a centralized system of record
- Expose inventory data through a REST API
- Support future frontend integrations
- Maintain data integrity and auditability
- Allow inventory import from existing Excel data
- Provide a scalable foundation for future inventory workflows

## Technology Stack

### Backend

- TypeScript
- Node.js
- NestJS

### Database

- PostgreSQL
- Prisma ORM

### Development Tools

- ESLint
- Prettier
- Docker (possibly in the future, not now)

## Architecture

```text
Frontend
    |
    v
REST API
    |
    v
NestJS Backend
    |
    v
Prisma ORM
    |
    v
PostgreSQL
```

## Development Principles

### Do Not Assume Business Logic

Many inventory requirements are still being discovered.

Avoid introducing:

- Hardcoded inventory statuses
- Fixed checkout workflows
- Assumed user roles
- Assumed asset categories
- Assumed field names

Business rules should emerge from documented requirements and existing inventory data.

### Keep the Design Extensible

When implementing features:

- Prefer configurable solutions
- Avoid premature optimization
- Avoid overengineering
- Design for future schema evolution

### Database Guidelines

- Use PostgreSQL as the source of truth
- Use Prisma for database access
- Prefer migrations over manual schema modifications
- Maintain referential integrity
- Favor normalized data structures unless requirements indicate otherwise

### API Guidelines

- Follow REST conventions
- Use DTOs for request validation
- Keep controllers thin
- Place business logic in services
- Maintain consistent error responses

### Code Quality

- Use strict TypeScript
- Prefer explicit typing
- Keep functions focused and small
- Write self-documenting code
- Favor readability over cleverness

## Current Project Status

The following items are still being determined:

- Inventory schema
- Tool metadata fields
- Status definitions
- User roles
- Permission model
- Audit requirements
- Reporting requirements
- Check-in/check-out workflows

When generating code, treat these areas as undefined unless implemented elsewhere in the repository.

## AI Assistant Guidance

Before creating models, endpoints, or database schemas:

1. Search the repository for existing requirements.
2. Reuse existing patterns.
3. Avoid inventing business rules.
4. Preserve backward compatibility whenever possible.
5. Prefer incremental improvements over large refactors.

If requirements are unclear, generate flexible implementations rather than assuming operational workflows.
