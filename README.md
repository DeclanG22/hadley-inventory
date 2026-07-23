# Hadley Inventory — Backend

REST API for the Hadley Tool & Inventory Management System. Replaces spreadsheet-based workflows with a centralized PostgreSQL-backed service for tracking consumable stock (fasteners, chemicals, hardware) and serialized assets (tools, equipment).

## Stack

- **Runtime:** Node.js 20+, TypeScript
- **Framework:** NestJS
- **Database:** PostgreSQL 15+ via Prisma ORM
- **Validation:** class-validator + class-transformer (whitelist, forbidNonWhitelisted, auto-transform)
- **File Storage:** Local `uploads/` directory for item/tool images

## Getting Started

```bash
npm install
npx prisma generate
npx prisma db push       # creates tables from schema
npm run start:dev         # starts on http://localhost:3000
```

Requires a running PostgreSQL instance. Connection string is configured via `DATABASE_URL` in your environment or `.env` file.

## Project Structure

```
src/
├── lookup/            Unified barcode / free-text search (items + tools)
├── items/             Consumable inventory (CRUD, transactions, CSV/Excel import)
├── tools/             Tracked assets (CRUD, checkouts, maintenance, flags, decommissioning)
├── vendors/           Vendor reference data
├── locations/         Physical storage location reference data
├── item-categories/   Hierarchical category + sub-category system
├── stock-takes/       Physical inventory counts with reconciliation
├── upload/            Image upload endpoint
├── activity/          Combined recent-activity feed
├── jobs/              Job number lookup
├── import/            Shared CSV/Excel import engine (used by items and tools)
└── prisma/            Prisma service (singleton, database client)
```

## API Overview

The full API reference is maintained in [`docs/api.md`](docs/api.md). Key endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /lookup/:code` | Unified scan/search — exact metadata matches before contains, optional `?type=item\|tool` |
| `GET /items` | Paginated consumable list (search, filter, sort) |
| `GET /tools` | Paginated tool list (search, filter by vendor/location/status, sort) |
| `GET /tools/:id/checkout` | Check out a tool |
| `GET /tools/:id/checkin` | Check in a tool |
| `POST /stock-takes` | Create a physical inventory count |
| `POST /items/import/analyze` | Phase 1 of CSV/Excel import — column detection |
| `POST /items/import/execute` | Phase 2 — confirm mapping and import |

## Search Behavior

The `/lookup/:code` endpoint uses a two-phase priority system:

1. **Phase 1 — Exact matches across all entity types** (itemNumber, serialNumber, heNumber, name) — returns immediately on first match
2. **Phase 2 — Contains / partial matches** — only runs if no exact match was found

This ensures scanning a barcode containing HE# `155` matches the tool with that number, not an item whose description happens to contain "155".

## Database

Prisma schema lives at `prisma/schema.prisma`. Key models:

- **Vendor**, **Location** — shared reference data (soft-deletable)
- **ItemCategory**, **ItemSubCategory** — hierarchical consumable categories
- **Item** — consumable stock (on-hand quantity, transactions, import)
- **Tool** — unique assets (checkouts, maintenance logs, flags)
- **ToolCheckout** — check-in/check-out records with job number tracking
- **ToolMaintenanceLog**, **ToolMaintenanceFlag** — maintenance workflow
- **StockTake**, **StockTakeItem** — physical inventory counts

Migrations are managed via `npx prisma migrate dev`. Schema changes should be made through Prisma migrations, not direct SQL.
