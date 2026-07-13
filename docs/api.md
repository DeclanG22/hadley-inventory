# API Reference

Base URL: `http://localhost:3000/api`

**Global validation behavior:** All DTOs are validated via `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. Unknown fields in request bodies are stripped, extra fields cause errors, and query/param strings are auto-converted to numbers where applicable.

---

## Lookup (Unified Item/Tool Search)

### `GET /lookup/:code`

Scans a barcode/QR code value or free-text search and returns the **first matching entity** — either an item or a tool — in a single unified response. Designed for scan-and-transact workflows (e.g., scanning a QR code on a bin or tool tag).

**Search algorithm (two-phase per entity):**

1. **Phase 1 – Exact match** on the primary identifier:
   - Items: `itemNumber` (case-insensitive)
   - Tools: `toolNumber` (case-insensitive)
2. **Phase 2 – Contains match** on the description/name (only if Phase 1 misses):
   - Items: `description` (case-insensitive contains)
   - Tools: `name` (case-insensitive contains)

**Entity priority:** Items are searched first. Only if no item matches does the endpoint fall through to tools. If neither matches, returns 404.

**Response shape** — the response has a `type` discriminator (`"item"` or `"tool"`) and a `data` object whose fields differ by type:

**Item match (`type: "item"`):**

```json
{
  "type": "item",
  "data": {
    "id": 1,
    "itemNumber": "6-32x1/2-PH-SS",
    "description": "6-32 x 1/2 Panhead Phillips S.S",
    "onHand": 68,
    "unit": "Each",
    "category": "Screws",
    "imageUrl": "https://example.com/screw.jpg"
  }
}
```

| Field | Type | Notes |
|-------|------|-------|
| id | int | Item primary key |
| itemNumber | string | Unique item identifier |
| description | string | Item description |
| onHand | int | Current stock quantity |
| unit | string or null | Unit of measure |
| category | string or null | Category name |
| imageUrl | string or null | Image URL |

**Tool match (`type: "tool"`):**

```json
{
  "type": "tool",
  "data": {
    "id": 1,
    "toolNumber": "SAW-001",
    "name": "Dewalt Miter Saw",
    "brand": "Dewalt",
    "model": "DWS780",
    "category": "Power Tools",
    "imageUrl": "https://example.com/saw.jpg",
    "checkedOut": true,
    "checkedOutBy": "John D",
    "checkedOutAt": "2026-07-09T18:00:00.000Z"
  }
}
```

| Field | Type | Notes |
|-------|------|-------|
| id | int | Tool primary key |
| toolNumber | string | Unique tool identifier |
| name | string | Display name |
| brand | string or null | Manufacturer |
| model | string or null | Model number |
| category | string or null | Category name |
| imageUrl | string or null | Image URL |
| checkedOut | boolean | Whether the tool is currently checked out |
| checkedOutBy | string or null | Name of who checked it out (null if available) |
| checkedOutAt | ISO datetime or null | When it was checked out (null if available) |

**Error response (404):**

```json
{
  "message": "No item or tool found matching \"SEARCH-CODE\"",
  "error": "Not Found",
  "statusCode": 404
}
```

**Typical workflow:**

1. User scans a QR code (or types a number) on the scan page.
2. Call `GET /lookup/<code>`.
3. If the result's `type` is `"item"`, show the item details and prompt for a stock movement (in/out, quantity, job number).
4. If the result's `type` is `"tool"`, check `checkedOut`: if false, show check-out form (name, job number, job site, expected return date); if true, show check-in button.
5. On 404, show a "not found" message.

---

## Upload

### `POST /upload`

Accepts an image file via `multipart/form-data` and returns a URL that can be used as `imageUrl` on items and tools.

**Request:** `multipart/form-data` with field name `file`.

- Only image MIME types allowed (`image/*`)
- Max file size: 5MB
- Files are saved to the `uploads/` directory and served statically at `/uploads/<filename>`

**Response:**

```json
{
  "url": "/uploads/1740012345678-987654321.jpg"
}
```

**Typical usage:**

1. Upload an image file.
2. Store the returned `url` in the item's or tool's `imageUrl` field.
3. Display the image by prefixing with the API base URL: `http://localhost:3000/uploads/1740012345678-987654321.jpg` (or via the `/api` proxy in frontend: `fetch('/api/uploads/...')`).

**Error responses:**

```json
{ "message": "Only image files are allowed", "error": "Bad Request", "statusCode": 400 }
{ "message": "No file provided", "error": "Bad Request", "statusCode": 400 }
```

---

## Activity

### `GET /activity/recent`

Returns the latest activity across items (transactions), tools (checkouts/checkins), and tool maintenance, combined and sorted by date descending.

**Query params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | int  | 20      | Max items to return |

**Response** — array of activity objects with a `type` discriminator:

```json
[
  {
    "type": "item_transaction",
    "id": 1,
    "date": "2026-07-09T18:15:00.000Z",
    "direction": "in",
    "qty": 5,
    "summary": "In 5 x ITM-001 (job 123)",
    "link": "/items/1",
    "itemRef": "ITM-001"
  },
  {
    "type": "tool_checkout",
    "id": 2,
    "date": "2026-07-09T18:00:00.000Z",
    "summary": "Checked out SAW-001 — Dewalt Miter Saw by John D",
    "link": "/tools/1",
    "itemRef": "SAW-001"
  },
  {
    "type": "tool_checkin",
    "id": 2,
    "date": "2026-07-10T10:00:00.000Z",
    "summary": "Checked in SAW-001 — Dewalt Miter Saw by John D",
    "link": "/tools/1",
    "itemRef": "SAW-001"
  },
  {
    "type": "tool_maintenance",
    "subType": "repair",
    "id": 1,
    "date": "2026-07-09T17:00:00.000Z",
    "summary": "repair on SAW-001 — Dewalt Miter Saw: Replaced blade",
    "link": "/tools/1",
    "itemRef": "SAW-001"
  }
]
```

**Notes:**
- `direction` is `"in"` or `"out"` for item transactions, omitted for tool events.
- `subType` is the maintenance type string (`repair`, `service`, `calibration`, `inspection`) for maintenance events.

---

## Vendors

Simple reference data — each vendor has an auto-incremented `id` and a unique `name`. Vendors support soft-delete: `DELETE` sets `deletedAt`, `GET /vendors/deleted` lists soft-deleted records.

**Model fields:** `id`, `name`, `createdAt`, `updatedAt`, `deletedAt`.

### `GET /vendors`
```json
[{ "id": 1, "name": "McMaster-Carr", "createdAt": "...", "updatedAt": "..." }]
```
Returns only active (non-deleted) vendors.

### `POST /vendors`
```json
{ "name": "McMaster-Carr" }
```

### `GET /vendors/:id`
### `PATCH /vendors/:id`
```json
{ "name": "McMaster-Carr (updated)" }
```

### `DELETE /vendors/:id`
Soft-deletes the vendor (sets `deletedAt`). The vendor will no longer appear in `GET /vendors` but can be restored via `POST /vendors/:id/restore`.

### `GET /vendors/deleted`
Returns all soft-deleted vendors, ordered by `deletedAt` descending.

### `POST /vendors/:id/restore`
Restores a soft-deleted vendor (clears `deletedAt`).

### `DELETE /vendors/:id/permanent`
Permanently deletes the vendor from the database. Cannot be undone.

---

## Locations

Reference data for physical storage locations (e.g., "Shelf A3", "Tool Crib"). Supports soft-delete.

**Model fields:** `id`, `name`, `createdAt`, `updatedAt`, `deletedAt`.

### `GET /locations`
```json
[{ "id": 1, "name": "Main Inventory Room", "createdAt": "...", "updatedAt": "..." }]
```
Returns only active locations.

### `POST /locations`
```json
{ "name": "Shelf A3" }
```

### `GET /locations/:id`
### `PATCH /locations/:id`
```json
{ "name": "Shelf A3 (moved)" }
```

### `DELETE /locations/:id`
Soft-deletes the location (sets `deletedAt`).

### `GET /locations/deleted`
Returns all soft-deleted locations, ordered by `deletedAt` descending.

### `POST /locations/:id/restore`
Restores a soft-deleted location.

### `DELETE /locations/:id/permanent`
Permanently deletes the location.

---

## Item Categories

Hierarchical — categories contain sub-categories. Both support soft-delete.

**Model fields:** `id`, `name`, `createdAt`, `updatedAt`, `deletedAt`.

### `GET /item-categories`
```json
[
  {
    "id": 1,
    "name": "Screws",
    "subCategories": [{ "id": 1, "name": "Pan Head", "itemCategoryId": 1 }],
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```
Returns only active categories with active sub-categories.

### `POST /item-categories`
```json
{ "name": "Screws" }
```

### `GET /item-categories/:id`
### `PATCH /item-categories/:id`
```json
{ "name": "Screws (renamed)" }
```

### `DELETE /item-categories/:id`
Soft-deletes the category (sets `deletedAt`).

### `GET /item-categories/deleted`
Returns all soft-deleted categories.

### `POST /item-categories/:id/restore`
Restores a soft-deleted category.

### `DELETE /item-categories/:id/permanent`
Permanently deletes the category.

### Sub-Categories

#### `GET /item-categories/:id/sub-categories`
```json
[{ "id": 1, "name": "Pan Head", "itemCategoryId": 1 }]
```

#### `POST /item-categories/:id/sub-categories`
```json
{ "name": "Pan Head" }
```

#### `DELETE /item-categories/sub-categories/:subId`
Soft-deletes the sub-category.

#### `GET /item-categories/sub-categories/deleted`
Returns all soft-deleted sub-categories.

#### `POST /item-categories/sub-categories/:subId/restore`
Restores a soft-deleted sub-category.

#### `DELETE /item-categories/sub-categories/:subId/permanent`
Permanently deletes the sub-category.

---

## Tool Categories

Flat reference data for tool types (e.g., "Power Tools", "Hand Tools"). Supports soft-delete.

**Model fields:** `id`, `name`, `createdAt`, `updatedAt`, `deletedAt`.

### `GET /tool-categories`
```json
[{ "id": 1, "name": "Power Tools", "createdAt": "...", "updatedAt": "..." }]
```
Returns only active categories.

### `POST /tool-categories`
```json
{ "name": "Saws" }
```

### `GET /tool-categories/:id`
### `PATCH /tool-categories/:id`
```json
{ "name": "Saws (renamed)" }
```

### `DELETE /tool-categories/:id`
Soft-deletes the category (sets `deletedAt`).

### `GET /tool-categories/deleted`
Returns all soft-deleted categories.

### `POST /tool-categories/:id/restore`
Restores a soft-deleted category.

### `DELETE /tool-categories/:id/permanent`
Permanently deletes the category.

---

## Items (Consumables)

The Item model represents consumable/stock-tracked inventory. Each item has an `onHand` quantity, optionally associated with a location, vendor, category, and sub-category. Stock movements are recorded via transactions.

**Item model fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | int | auto | Primary key |
| itemNumber | string | **yes** | Unique identifier (user-provided) |
| description | string | **yes** | Item description |
| unit | string | no | Unit of measure: "Each", "Bag", "Box", "Lb" |
| unitPrice | decimal(10,2) | no | Price per unit |
| weightPerUnit | decimal(10,4) | no | Weight in grams |
| analysisCode | string | no | GL/account code |
| removeFlag | boolean | no (default false) | Soft-delete flag for archived items |
| labelPrinted | boolean | no (default false) | Whether label has been printed |
| headType | string | no | For fasteners: "Pan", "Flat", "Hex" |
| imageUrl | string | no | Image reference |
| categoryId | int | no | FK -> ItemCategory |
| subCategoryId | int | no | FK -> ItemSubCategory (scoped to category) |
| locationId | int | no | FK -> Location |
| vendorId | int | no | FK -> Vendor |
| onHand | int | no (default 0) | Current stock quantity |
| minStock | int | no | Min stock threshold for low-stock alerts |
| dateAdded | date | no | Original date the item was added |
| dateDisbursed | date | no | Date the item was last disbursed/removed |
| lastQtyInOut | int | no | Last transaction quantity (auto-managed by transactions) |
| lastJobNumber | string | no | Job number from last transaction (auto-managed) |
| totalCost | decimal(12,2) | no | Running total cost (auto-managed by transactions) |
| createdAt | datetime | auto | Prisma timestamp |
| updatedAt | datetime | auto | Prisma timestamp |
| deletedAt | datetime | no | Soft-delete timestamp (null if active) |

### `GET /items`

Returns a **paginated** list of items with category, sub-category, location, and vendor eagerly loaded.

**Query params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| q | string | — | Search by itemNumber or description (case-insensitive contains) |
| categoryId | int | — | Filter by category ID |
| vendorId | int | — | Filter by vendor ID |
| locationId | int | — | Filter by location ID |
| page | int | 1 | Page number (1-indexed) |
| limit | int | 2000 | Items per page |
| sortBy | string | `itemNumber` | Sort column: `itemNumber`, `description`, `onHand`, `unitPrice` |
| sortOrder | string | `asc` | Sort direction: `asc` or `desc` |

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "itemNumber": "6-32x1/2-PH-SS",
      "description": "6-32 x 1/2 Panhead Phillips S.S",
      "unit": "Each",
      "unitPrice": 0.14,
      "weightPerUnit": 2.3805,
      "analysisCode": "A12",
      "removeFlag": false,
      "labelPrinted": false,
      "headType": "Pan",
      "imageUrl": null,
      "categoryId": 1,
      "category": { "id": 1, "name": "Screws", "createdAt": "...", "updatedAt": "..." },
      "subCategoryId": 2,
      "subCategory": { "id": 2, "name": "Pan Head", "itemCategoryId": 1, "createdAt": "...", "updatedAt": "..." },
      "locationId": 3,
      "location": { "id": 3, "name": "Shipping/Receiving", "createdAt": "...", "updatedAt": "..." },
      "vendorId": 1,
      "vendor": { "id": 1, "name": "McMaster-Carr", "createdAt": "...", "updatedAt": "..." },
      "onHand": 68,
      "minStock": 10,
      "dateAdded": null,
      "dateDisbursed": null,
      "createdAt": "2026-07-09T18:15:00.000Z",
      "updatedAt": "2026-07-09T18:15:00.000Z"
    }
  ],
  "total": 1741,
  "page": 1,
  "limit": 50
}
```

### `GET /items/low-stock`

Returns items where `onHand <= minStock` AND `minStock IS NOT NULL`. Includes the same relations as `GET /items`.

```json
[
  { "id": 5, "itemNumber": "...", "onHand": 3, "minStock": 10, ... }
]
```

### `GET /items/:id`

Item detail with all relations (category, subCategory, location, vendor) and transactions eagerly loaded.

```json
{
  "id": 1,
  "itemNumber": "6-32x1/2-PH-SS",
  "transactions": [
    {
      "id": 1,
      "itemId": 1,
      "jobNumber": "JOB-456",
      "date": "2026-07-09T00:00:00.000Z",
      "quantityInOut": -5,
      "unitPrice": 0.14,
      "totalCost": 0.70,
      "notes": "Used on site",
      "createdAt": "2026-07-09T18:15:00.000Z"
    }
  ],
  ...other fields
}
```

### `POST /items`

Create a new item.

```json
{
  "itemNumber": "6-32x1/2-PH-SS",
  "description": "6-32 x 1/2 Panhead Phillips S.S",
  "unit": "Each",
  "unitPrice": 0.14,
  "weightPerUnit": 2.3805,
  "analysisCode": "A12",
  "headType": "Pan",
  "imageUrl": "https://example.com/screw.jpg",
  "categoryId": 1,
  "subCategoryId": 2,
  "locationId": 3,
  "vendorId": 1,
  "onHand": 68,
  "minStock": 10,
  "dateAdded": "2026-01-15",
  "dateDisbursed": null
}
```

### `PATCH /items/:id`

Partial update — send only the fields to change. Same shape as POST but all fields optional.

### `DELETE /items/:id`

Soft-deletes the item (sets `deletedAt` and `removeFlag: true`). The item no longer appears in `GET /items` or `GET /items/low-stock` but can be restored.

### `GET /items/deleted`

Returns all soft-deleted items (where `deletedAt` is not null), ordered by `deletedAt` descending. Includes category, location, and vendor relations.

### `POST /items/:id/restore`

Restores a soft-deleted item (clears `deletedAt` and sets `removeFlag: false`).

### `DELETE /items/:id/permanent`

Permanently deletes the item from the database. Cannot be undone.

### Item Transactions

Transactions record stock movements. Positive `quantityInOut` = stock coming in, negative = stock going out. Creating a transaction automatically updates the item's `onHand`, `lastQtyInOut`, and `lastJobNumber`.

**Auto-calculation:** If `unitPrice` is not provided, the backend falls back to the item's current `unitPrice`. `totalCost` is auto-calculated as `|quantityInOut| × unitPrice` if not provided. Stock take adjustment transactions explicitly set `unitPrice: 0, totalCost: 0` (cost-neutral).

#### `GET /items/:id/transactions`

Transaction history for a single item, ordered by date descending.

```json
[
  {
    "id": 1,
    "itemId": 1,
    "jobNumber": "JOB-456",
    "date": "2026-07-09T00:00:00.000Z",
    "quantityInOut": -5,
    "unitPrice": 0.14,
    "totalCost": 0.70,
    "notes": "Used on site",
    "createdAt": "..."
  }
]
```

#### `POST /items/:id/transactions`

Record a stock movement.

```json
{
  "date": "2026-07-09",
  "quantityInOut": -5,
  "jobNumber": "JOB-456",
  "unitPrice": 0.14,
  "totalCost": 0.70,
  "notes": "Used on site"
}
```

Required fields: `date`, `quantityInOut`. Optional: `jobNumber`, `unitPrice`, `totalCost`, `notes`.

If `unitPrice` is omitted, it defaults to the item's current `unitPrice`. If `totalCost` is omitted, it is auto-calculated as `|quantityInOut| × unitPrice`.

**Side effects:** Updates the item's `onHand` (incremented by `quantityInOut`), sets `lastQtyInOut` and `lastJobNumber`.

#### `GET /items/transactions` (Cross-Item Costing View)

Returns all item transactions across all items with optional filters. Used for the costing page.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| dateFrom | string (ISO date) | Include transactions on or after this date |
| dateTo | string (ISO date) | Include transactions on or before this date |
| jobNumber | string | Filter by job number (case-insensitive partial contains match) |

**Response** — array of transaction objects with item details eagerly loaded:

```json
[
  {
    "id": 1,
    "itemId": 1,
    "item": { "id": 1, "itemNumber": "6-32x1/2-PH-SS", "description": "6-32 x 1/2 Panhead Phillips S.S" },
    "jobNumber": "JOB-456",
    "date": "2026-07-09T00:00:00.000Z",
    "quantityInOut": -5,
    "unitPrice": 0.14,
    "totalCost": 0.70,
    "notes": "Used on site",
    "createdAt": "..."
  }
]
```

### Import (CSV/Excel Upload, Two-Phase)

Items can be bulk-imported from CSV or Excel files (.xlsx). The process has two phases:

**Phase 1 — Analyze** (`POST /items/import/analyze`): Upload the file, receive detected columns, suggested mappings, and a `fileToken`.

**Phase 2 — Execute** (`POST /items/import/execute`): Confirm the column mapping to import data.

The import detects column names automatically from 100+ known aliases (e.g., "Part #", "Item No.", "Description", "Qty", "Unit Price", "Vendor Name", "Category", etc.). Column names are normalized: trimmed, lowercased, and spaces around punctuation are removed before matching.

Rows with fewer than 3 recognized column name matches are treated as filler/header rows and skipped.

#### `GET /items/import/fields`

Returns the list of available database fields that CSV columns can be mapped to.

```json
[
  { "value": "itemNumber", "label": "Item Number", "required": true },
  { "value": "description", "label": "Description", "required": true },
  { "value": "dateAdded", "label": "Date Added", "required": false },
  { "value": "onHand", "label": "On Hand", "required": false },
  { "value": "unitPrice", "label": "Unit Price", "required": false },
  { "value": "jobNumber", "label": "Job Number", "required": false },
  { "value": "dateDisbursed", "label": "Date Disbursed", "required": false },
  { "value": "unit", "label": "Unit", "required": false },
  { "value": "locationName", "label": "Location", "required": false },
  { "value": "analysisCode", "label": "Analysis Code", "required": false },
  { "value": "vendorName", "label": "Primary Vendor", "required": false },
  { "value": "weightPerUnit", "label": "Weight/Unit (grams)", "required": false },
  { "value": "categoryName", "label": "Category", "required": false },
  { "value": "subCategoryName", "label": "Sub-Category", "required": false },
  { "value": "headType", "label": "Head Type", "required": false },
  { "value": "removeFlag", "label": "Remove?", "required": false },
  { "value": "labelPrinted", "label": "Label Printed", "required": false }
]
```

Required fields that must be mapped: `itemNumber`, `description`.

**Special dbFields:** Names ending in `Name` (e.g., `locationName`, `vendorName`, `categoryName`, `subCategoryName`) trigger upsert logic — the import will create or find the referenced entity by name and set the appropriate FK (`locationId`, `vendorId`, etc.). This means you can import a column named "Location" with values like "Shelf A3" and it will auto-create/find the Location and link it.

#### `POST /items/import/analyze`

Upload a CSV or XLSX file. Uses `multipart/form-data` with field name `file`.

**Response:**

```json
{
  "fileToken": "abc123-def456",
  "filename": "inventory.csv",
  "totalRows": 1500,
  "columns": ["Item #", "Description", "On Hand", "Unit Price", "Vendor"],
  "mapping": {
    "Item #": "itemNumber",
    "Description": "description",
    "On Hand": "onHand",
    "Unit Price": "unitPrice",
    "Vendor": "vendorName"
  },
  "preview": {
    "Item #": "6-32x1/2-PH-SS",
    "Description": "6-32 x 1/2 Panhead Phillips",
    "On Hand": "68",
    "Unit Price": "0.14",
    "Vendor": "McMaster-Carr"
  },
  "unrecognized": [],
  "missing": []
}
```

`unrecognized` lists CSV columns that could not be auto-mapped to any known field. `missing` lists required dbFields (`itemNumber`, `description`) that have no mapping.

The `fileToken` expires after 10 minutes.

#### `POST /items/import/execute`

Execute the import with the user-confirmed column mapping.

```json
{
  "fileToken": "abc123-def456",
  "columnMap": {
    "Item #": "itemNumber",
    "Description": "description",
    "On Hand": "onHand",
    "Unit Price": "unitPrice",
    "Vendor": "vendorName"
  }
}
```

**Response:**

```json
{
  "total": 1500,
  "created": 1420,
  "updated": 80,
  "errors": [
    { "row": 12, "message": "Missing item number" },
    { "row": 45, "message": "Invalid value for onHand" }
  ]
}
```

**Import behavior:**
- Existing items (matched by `itemNumber`) are **updated**; new items are **created**.
- Vendors, locations, categories, and sub-categories referenced by name are auto-created via upsert if they don't exist.
- Date fields (`dateAdded`, `dateDisbursed`) accept ISO dates or US format `MM/DD/YYYY`.
- Numeric fields strip `$` and `,` before parsing.

---

## Tools (Assets)

The Tool model represents unique tracked assets (tools, equipment). Each tool has check-out/check-in history and maintenance logs. Tool status is derived: if there's an open checkout (no `checkedInAt`), the tool is "Checked Out"; otherwise it's "Available".

**Tool model fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | int | auto | Primary key |
| toolNumber | string | **yes** | Unique identifier (user-provided, e.g. "SAW-001") |
| name | string | **yes** | Display name |
| description | string | no | Details about the tool |
| brand | string | no | Manufacturer/brand |
| model | string | no | Model number |
| serialNumber | string | no | Manufacturer serial number |
| imageUrl | string | no | Image reference |
| purchaseCost | decimal(10,2) | no | Original purchase cost |
| notes | string | no | Free-form notes |
| categoryId | int | no | FK -> ToolCategory |
| locationId | int | no | FK -> Location (where the tool is stored) |
| createdAt | datetime | auto | Prisma timestamp |
| updatedAt | datetime | auto | Prisma timestamp |
| deletedAt | datetime | no | Soft-delete timestamp (null if active) |

### `GET /tools`

List all tools with category, location, and current status (derived from open checkouts).

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| q | string | Search by toolNumber, name, brand, model, or description (case-insensitive contains) |

**Response:**

```json
[
  {
    "id": 1,
    "toolNumber": "SAW-001",
    "name": "Dewalt Miter Saw",
    "description": "DWS780 12-inch",
    "brand": "Dewalt",
    "model": "DWS780",
    "serialNumber": "SN-12345",
    "imageUrl": null,
    "purchaseCost": 199.99,
    "notes": null,
    "categoryId": 1,
    "category": { "id": 1, "name": "Power Tools", "createdAt": "...", "updatedAt": "..." },
    "locationId": 2,
    "location": { "id": 2, "name": "Tool Crib", "createdAt": "...", "updatedAt": "..." },
    "checkouts": [
      {
        "id": 1,
        "toolId": 1,
        "checkedOutBy": "John D",
        "jobNumber": "JOB-789",
        "jobSite": "Site B",
        "checkedOutAt": "2026-07-09T18:00:00.000Z",
        "expectedReturnAt": "2026-07-16T00:00:00.000Z",
        "checkedInAt": null,
        "notes": "",
        "createdAt": "..."
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

The `checkouts` array contains only **open** checkouts (where `checkedInAt` is null). If the array is non-empty, the tool is currently checked out. The latest open checkout is at index 0.

### `GET /tools/:id`

Tool detail with all checkouts (including closed ones) and all maintenance logs eagerly loaded.

```json
{
  "id": 1,
  "toolNumber": "SAW-001",
  ...basic fields...,
  "category": { "id": 1, "name": "Power Tools" },
  "location": { "id": 2, "name": "Tool Crib" },
  "checkouts": [
    {
      "id": 1,
      "toolId": 1,
      "checkedOutBy": "John D",
      "jobNumber": "JOB-789",
      "jobSite": "Site B",
      "checkedOutAt": "2026-07-09T18:00:00.000Z",
      "expectedReturnAt": "2026-07-16T00:00:00.000Z",
      "checkedInAt": null,
      "notes": "",
      "createdAt": "..."
    },
    {
      "id": 2,
      "toolId": 1,
      "checkedOutBy": "Jane S",
      "jobNumber": "JOB-456",
      "jobSite": null,
      "checkedOutAt": "2026-07-01T10:00:00.000Z",
      "expectedReturnAt": null,
      "checkedInAt": "2026-07-05T14:00:00.000Z",
      "notes": "Returned in good condition",
      "createdAt": "..."
    }
  ],
  "maintenance": [
    {
      "id": 1,
      "toolId": 1,
      "type": "repair",
      "description": "Replaced blade",
      "date": "2026-07-09T00:00:00.000Z",
      "performedBy": "Jane S",
      "cost": 45.00,
      "notes": "",
      "createdAt": "..."
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `POST /tools`

Create a new tool.

```json
{
  "toolNumber": "SAW-001",
  "name": "Dewalt Miter Saw",
  "description": "DWS780 12-inch",
  "brand": "Dewalt",
  "model": "DWS780",
  "serialNumber": "SN-12345",
  "purchaseCost": 199.99,
  "notes": "Purchased 2025",
  "categoryId": 1,
  "locationId": 2
}
```

Required: `toolNumber`, `name`. All other fields are optional.

### `POST /tools/batch`

Create multiple identical tools with auto-numbering. Generates `{PREFIX}-001`, `{PREFIX}-002`, etc., picking up the next available sequence number based on existing tools with the same prefix.

```json
{
  "quantity": 10,
  "toolNumberPrefix": "HAM",
  "name": "16oz Claw Hammer",
  "brand": "Stanley",
  "categoryId": 2,
  "locationId": 3
}
```

Required: `quantity` (>= 1), `toolNumberPrefix`, `name`. All other tool optional fields are accepted and applied to all generated tools.

### `PATCH /tools/:id`

Partial update. Same shape as POST but all fields optional.

### `DELETE /tools/:id`

Soft-deletes the tool (sets `deletedAt`). The tool no longer appears in `GET /tools` but can be restored.

### `GET /tools/deleted`

Returns all soft-deleted tools, ordered by `deletedAt` descending. Includes category and location relations.

### `POST /tools/:id/restore`

Restores a soft-deleted tool (clears `deletedAt`).

### `DELETE /tools/:id/permanent`

Permanently deletes the tool from the database. Cannot be undone.

### Checkouts

#### `POST /tools/:id/checkout`

Check out a tool. Fails with 400 if the tool already has an open checkout (checkedInAt is null).

```json
{
  "checkedOutBy": "John D",
  "jobNumber": "JOB-789",
  "jobSite": "Site B",
  "expectedReturnAt": "2026-07-16",
  "notes": ""
}
```

Required: `checkedOutBy`. Optional: `jobNumber`, `jobSite`, `expectedReturnAt` (ISO date string), `notes`.

**Response** — the created checkout with tool details:
```json
{
  "id": 1,
  "toolId": 1,
  "checkedOutBy": "John D",
  "jobNumber": "JOB-789",
  "jobSite": "Site B",
  "checkedOutAt": "2026-07-10T12:00:00.000Z",
  "expectedReturnAt": "2026-07-16T00:00:00.000Z",
  "checkedInAt": null,
  "notes": "",
  "createdAt": "...",
  "tool": { ...tool object... }
}
```

#### `POST /tools/:id/checkin`

Check in the tool. Resolves the latest open checkout (by `checkedOutAt` desc). Fails with 400 if the tool is not currently checked out.

```json
{ "notes": "Returned in good condition" }
```

All fields optional. Sets `checkedInAt` to the current server timestamp.

**Response** — the updated checkout record with tool details.

#### `GET /tools/:id/checkouts`

Returns all checkout records for a tool, ordered by `checkedOutAt` descending.

```json
[
  {
    "id": 1,
    "toolId": 1,
    "checkedOutBy": "John D",
    "jobNumber": "JOB-789",
    "jobSite": "Site B",
    "checkedOutAt": "2026-07-09T18:00:00.000Z",
    "expectedReturnAt": "2026-07-16T00:00:00.000Z",
    "checkedInAt": null,
    "notes": ""
  }
]
```

### Maintenance

#### `POST /tools/:id/maintenance`

Record a maintenance event.

```json
{
  "type": "repair",
  "date": "2026-07-09",
  "description": "Replaced blade",
  "performedBy": "Jane S",
  "cost": 45.00,
  "notes": ""
}
```

Required: `type` (one of: `repair`, `service`, `calibration`, `inspection`), `date` (ISO date string). Optional: `description`, `performedBy`, `cost` (number), `notes`.

#### `GET /tools/:id/maintenance`

Returns maintenance records for a specific tool, ordered by `date` descending.

```json
[
  {
    "id": 1,
    "toolId": 1,
    "type": "repair",
    "description": "Replaced blade",
    "date": "2026-07-09T00:00:00.000Z",
    "performedBy": "Jane S",
    "cost": 45.00,
    "notes": "",
    "createdAt": "..."
  }
]
```

### Tool Costing (Combined Purchase + Maintenance View)

#### `GET /tools/costing`

Returns a unified view of tool purchase costs and maintenance costs, sorted by date descending. Used for the costing page.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| dateFrom | string (ISO date) | Include records on or after this date |
| dateTo | string (ISO date) | Include records on or before this date |

**Response** — array of records with a `type` discriminator:

```json
[
  {
    "date": "2026-07-09T00:00:00.000Z",
    "type": "purchase",
    "toolId": 1,
    "toolNumber": "SAW-001",
    "toolName": "Dewalt Miter Saw",
    "description": "Dewalt DWS780",
    "performedBy": null,
    "cost": 199.99
  },
  {
    "date": "2026-07-09T00:00:00.000Z",
    "type": "repair",
    "toolId": 1,
    "toolNumber": "SAW-001",
    "toolName": "Dewalt Miter Saw",
    "description": "Replaced blade",
    "performedBy": "Jane S",
    "cost": 45.00
  }
]
```

**Notes:**
- `type` is `"purchase"` for tool purchase records, or one of `repair`, `service`, `calibration`, `inspection` for maintenance records.
- For purchase records, `cost` is the `purchaseCost` and `date` is the tool's `createdAt`.
- For maintenance records, `cost` may be `null` if no cost was recorded.
- Purchase records without a `purchaseCost` are excluded.

#### `GET /tools/maintenance-costing`

Returns maintenance records only, across all tools. Used for filtered maintenance costing views.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| dateFrom | string (ISO date) | Include records on or after this date |
| dateTo | string (ISO date) | Include records on or before this date |
| type | string | Filter by maintenance type (`repair`, `service`, `calibration`, `inspection`) |

**Response:**

```json
[
  {
    "id": 1,
    "toolId": 1,
    "type": "repair",
    "description": "Replaced blade",
    "date": "2026-07-09T00:00:00.000Z",
    "performedBy": "Jane S",
    "cost": 45.00,
    "notes": "",
    "createdAt": "...",
    "tool": { "id": 1, "toolNumber": "SAW-001", "name": "Dewalt Miter Saw", "purchaseCost": 199.99 }
  }
]
```

---

## Stock Takes (Inventory Counts)

Stock takes are physical inventory counts. They compare the system quantity (`systemQty`) against the physically counted quantity (`physicalQty`) and can produce adjustment transactions.

**Workflow:**
1. `POST /stock-takes` — creates a draft stock take, pre-populating every non-removed item with its current `onHand` as `systemQty`.
2. `PATCH /stock-takes/:id/items/:itemId` — record the physical count for an item.
3. `POST /stock-takes/:id/reconcile` — apply adjustments (creates transactions, updates `onHand`, marks as completed).
4. Optionally `PATCH /stock-takes/:id` — cancel by setting `status: "cancelled"`.
5. `DELETE /stock-takes/:id` — if completed, reverses all adjustments; otherwise just deletes.

**StockTake status values:** `draft` (initial), `completed` (after reconcile), `cancelled`.

### `GET /stock-takes`

List all stock takes with item count.

```json
[
  {
    "id": 1,
    "date": "2026-07-10T00:00:00.000Z",
    "notes": "Monthly count",
    "status": "draft",
    "_count": { "items": 1741 },
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### `POST /stock-takes`

Create a new stock take. Pre-populates all non-removed items with their current `onHand` as `systemQty`.

```json
{ "date": "2026-07-10", "notes": "Monthly count" }
```

Required: `date` (ISO date string). Optional: `notes`.

**Response:**

```json
{
  "id": 1,
  "date": "2026-07-10T00:00:00.000Z",
  "notes": "Monthly count",
  "status": "draft",
  "items": [
    {
      "id": 1,
      "stockTakeId": 1,
      "itemId": 1,
      "systemQty": 68,
      "physicalQty": null,
      "notes": null,
      "item": { "id": 1, "itemNumber": "6-32x1/2-PH-SS", "description": "...", "onHand": 68 }
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `GET /stock-takes/:id`

Get stock take details with all items, system quantities, physical quantities, and computed variance (`physicalQty - systemQty`).

```json
{
  "id": 1,
  "date": "2026-07-10T00:00:00.000Z",
  "notes": "Monthly count",
  "status": "draft",
  "items": [
    {
      "id": 1,
      "stockTakeId": 1,
      "itemId": 1,
      "systemQty": 68,
      "physicalQty": null,
      "notes": null,
      "item": { "id": 1, "itemNumber": "6-32x1/2-PH-SS", "description": "...", "onHand": 68, "unit": "Each" }
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `PATCH /stock-takes/:id`

Update stock take notes or status.

```json
{ "notes": "Updated notes", "status": "cancelled" }
```

Allowed status transitions: any status can be set manually. Valid statuses: `draft`, `completed`, `cancelled`.

### `DELETE /stock-takes/:id`

Delete a stock take.

**Behavior varies by status:**
- **Draft / Cancelled:** Simply deletes the stock take and its items (cascade).
- **Completed:** For each counted item with a variance, creates a **reversal transaction** (`quantityInOut: -variance` with job number `STOCKTAKE-{id}-REVERSED`), updates the item's `onHand` back to the system quantity, then deletes the stock take.

### Counting Items

#### `PATCH /stock-takes/:id/items/:itemId`

Record the physical count for an item. Only allowed on draft stock takes.

```json
{ "physicalQty": 45, "notes": "Found on shelf B3" }
```

Required: `physicalQty` (integer >= 0). Optional: `notes`.

**Response:** The updated `StockTakeItem` record.

### Reconcile

#### `POST /stock-takes/:id/reconcile`

Apply all counted adjustments. Only allowed on draft stock takes with at least one item that has a `physicalQty` recorded.

**Actions:**
1. For each counted item where `physicalQty != systemQty`, creates an item transaction with `quantityInOut = variance` (positive = increase stock, negative = decrease), job number `STOCKTAKE-{id}`, and `unitPrice: 0, totalCost: 0` (cost-neutral).
2. Updates each affected item's `onHand` (incremented by variance).
3. Marks the stock take as `completed`.

**Response:** The full stock take with all items (same shape as `GET /stock-takes/:id`).

---

## Error Responses

All errors follow NestJS default format:

```json
{
  "message": "Description of the error",
  "error": "Bad Request",
  "statusCode": 400
}
```

Common status codes:
| Code | Meaning |
|------|---------|
| 400 | Validation error or business rule violation (e.g., tool already checked out) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Data Model Relationships

```
Vendor (1) ──< Item (N)
Location (1) ──< Item (N), Tool (N)
ItemCategory (1) ──< ItemSubCategory (N), Item (N)
ItemSubCategory (1) ──< Item (N)
ToolCategory (1) ──< Tool (N)

Item (1) ──< ItemTransaction (N)
Item (1) ──< StockTakeItem (N)
StockTake (1) ──< StockTakeItem (N)

Tool (1) ──< ToolCheckout (N)
Tool (1) ──< ToolMaintenanceLog (N)
```

**Key business rules:**
- A tool can only have one open checkout at a time (checkedInAt is null).
- Item `onHand` is updated automatically by transactions and stock take adjustments.
- Stock take delete + reconcile are transactional — all-or-nothing via Prisma `$transaction`.
- File tokens for import expire after 10 minutes.
