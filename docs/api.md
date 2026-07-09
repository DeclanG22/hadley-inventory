# API Reference

Base URL: `http://localhost:3000/api`

---

## Activity

### `GET /activity/recent`

Returns the latest activity across items and tools.

**Query params**

| Param | Type | Default |
|-------|------|---------|
| limit | int  | 20      |

**Response**

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
  }
]
```

`direction` is `"in"` or `"out"` for item transactions, omitted for tool events.

---

## Vendors

### `GET /vendors`
List all vendors.

### `POST /vendors`
Create a vendor.

```json
{ "name": "McMaster-Carr" }
```

### `DELETE /vendors/:id`

---

## Locations

### `GET /locations`
List all locations.

### `POST /locations`
Create a location.

```json
{ "name": "Shelf A3" }
```

### `DELETE /locations/:id`

---

## Item Categories

### `GET /item-categories`
List categories with their sub-categories.

### `POST /item-categories`
Create a category.

```json
{ "name": "Screws" }
```

### `DELETE /item-categories/:id`

### Sub-Categories (nested under category)

#### `GET /item-categories/:id/sub-categories`
#### `POST /item-categories/:id/sub-categories`

```json
{ "name": "Pan Head" }
```

#### `DELETE /item-categories/sub-categories/:id`

---

## Tool Categories

### `GET /tool-categories`
### `POST /tool-categories`

```json
{ "name": "Saws" }
```

### `DELETE /tool-categories/:id`

---

## Items (Consumables)

### `GET /items`
List all items with category, sub-category, location, vendor.

### `GET /items/:id`
### `POST /items`

```json
{
  "itemNumber": "6-32x1/2-PH-SS",
  "description": "6-32 x 1/2 Panhead Phillips S.S",
  "productType": "Screw",
  "unit": "Each",
  "unitPrice": 0.14,
  "weightPerUnit": 2.3805,
  "analysisCode": "A12",
  "headType": "Pan",
  "qrCode": "optional QR data/link",
  "categoryId": 1,
  "subCategoryId": 2,
  "locationId": 3,
  "vendorId": 1,
  "onHand": 68,
  "lastQtyInOut": 10,
  "lastJobNumber": "JOB-123",
  "totalCost": 9.52
}
```

### `PATCH /items/:id`
Partial update — send only the fields to change.

### `DELETE /items/:id`

### Transactions

#### `GET /items/:id/transactions`
Transaction history for an item.

#### `POST /items/:id/transactions`
Record stock movement. Positive `quantityInOut` = stock in, negative = stock out. Also updates the item's `onHand`.

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

---

## Tools (Assets)

### `GET /tools`
List all tools with category, location, and current checkout status.

### `GET /tools/:id`
Tool details with checkout history and maintenance log.

### `POST /tools`

```json
{
  "toolNumber": "SAW-001",
  "name": "Dewalt Miter Saw",
  "description": "DWS780 12-inch",
  "brand": "Dewalt",
  "model": "DWS780",
  "serialNumber": "SN-12345",
  "qrCode": "http://yourapp/tools/1",
  "notes": "Purchased 2025",
  "categoryId": 1,
  "locationId": 2
}
```

### `POST /tools/batch`
Create multiple identical tools with auto-numbering.

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

Generates `HAM-001`, `HAM-002`, ..., `HAM-010`.

### `PATCH /tools/:id`
### `DELETE /tools/:id`

### Checkouts

#### `POST /tools/:id/checkout`
Check out a tool. Fails if tool is already checked out.

```json
{
  "checkedOutBy": "John D",
  "jobNumber": "JOB-789",
  "jobSite": "Site B",
  "expectedReturnAt": "2026-07-16",
  "notes": ""
}
```

#### `POST /tools/:id/checkin`
Check in the tool. Resolves the latest open checkout.

```json
{ "notes": "Returned in good condition" }
```

#### `GET /tools/:id/checkouts`

### Maintenance

#### `POST /tools/:id/maintenance`

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

`type` is one of: `repair`, `service`, `calibration`, `inspection`

#### `GET /tools/:id/maintenance`
