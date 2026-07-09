# Implementation Plan

## Problem

Replace Excel-based tracking with a centralized API-driven system that:
- Eliminates disappearing tools with no accountability
- Provides real-time visibility into stock and asset locations
- Creates an audit trail for both consumables and tools
- Enables QR code scanning for fast check-in/check-out

## Two Domains

| Aspect | Items (Consumables) | Tools (Assets) |
|---|---|---|
| Examples | Screws, washers, nuts | Drills, saws, impact guns |
| Tracking | Quantity on hand | Who has which individual tool |
| Unit | "68 units of 6-32 x 1/2" | "Tool #001 — Dewalt DWS780" |
| Movement | Qty in/out per job number | Check-out / check-in with timestamps |
| Lifecycle | Reorder when low | Maintenance log, retire |

## API Design

### Items (`/items`)
- `GET /items` — list (filters: category, search, location)
- `GET /items/:id` — details + current stock
- `POST /items` — create
- `PATCH /items/:id` — update
- `DELETE /items/:id` — soft delete
- `GET /items/:id/transactions` — in/out history
- `POST /items/:id/transactions` — record stock movement

### Tools (`/tools`)
- `GET /tools` — list (filters: category, status, location)
- `GET /tools/:id` — details + current status
- `POST /tools` — create
- `PATCH /tools/:id` — update
- `DELETE /tools/:id` — soft delete
- `POST /tools/:id/checkout` — check out (timestamp, who, job)
- `POST /tools/:id/checkin` — check in (resolved from latest open checkout)
- `GET /tools/:id/checkouts` — checkout history
- `GET /tools/:id/maintenance` — maintenance log
- `POST /tools/:id/maintenance` — log maintenance event

### Reference Data
- `GET/POST /vendors`, `GET/POST /locations`
- `GET/POST /item-categories`, `GET/POST /tool-categories`

## Database Schema (Prisma)

### Shared
- `Vendor` — name (items use for purchasing)
- `Location` — name (both items and tools use)

### Items Domain
- `ItemCategory` — id, name
- `ItemSubCategory` — id, name, category_id
- `Item` — item_number, description, product_type, unit, unit_price, weight_per_unit, analysis_code, remove_flag, label_printed, on_hand, last_qty_in_out, last_job_number, date_added, date_disbursed, total_cost, head_type, + FK to category/subcategory/location/vendor
- `ItemTransaction` — item_id, job_number, date, quantity_in_or_out, unit_price, total_cost, notes

### Tools Domain
- `ToolCategory` — id, name
- `Tool` — tool_number, name, description, brand, model, serial_number, qr_code, notes, + FK to category/location
- `ToolCheckout` — tool_id, checked_out_by, job_number, job_site, checked_out_at, expected_return_at, checked_in_at, notes
- `ToolMaintenanceLog` — tool_id, type (repair/service/calibration), description, date, performed_by, cost, notes

## Project Structure

```
src/
  prisma/
    prisma.module.ts      — global Prisma module
    prisma.service.ts     — wraps PrismaClient
  vendors/                — CRUD for vendors
  locations/              — CRUD for locations
  item-categories/        — CRUD for item categories + subcategories
  items/                  — items CRUD + transaction endpoints
  tool-categories/        — CRUD for tool categories
  tools/                  — tools CRUD + checkout/maintenance endpoints
  app.module.ts
  main.ts
```

## Implementation Order

1. Prisma schema + PrismaModule/PrismaService
2. Vendors module
3. Locations module
4. Item categories module
5. Items module (includes subcategories + transactions)
6. Tool categories module
7. Tools module (includes checkouts + maintenance)
8. Wire into AppModule, verify build

## Frontend (separate — SvelteKit)

Planned later: a SvelteKit app for testing with:
- Item/tool list views
- Scan-to-check-out flow
- Basic stock management
