# Hadley Inventory

Backend API for the Hadley Tool Inventory Management System. Replaces Excel-based tracking with a centralized REST API for both consumable items (screws, washers) and tracked tools (drills, saws).

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** NestJS
- **Database:** PostgreSQL + Prisma ORM
- **Validation:** class-validator

## Getting Started

```bash
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

## API

- `GET /items` — list inventory items
- `GET /tools` — list tracked tools
- `GET /vendors`, `GET /locations` — reference data

See `docs/plan.md` for full API design.
