# Hadley Inventory — Frontend

Svelte 5 SPA for the Hadley Tool & Inventory Management System. Provides the UI for scanning, searching, transacting, and managing both consumable items and tracked tools.

## Stack

- **Framework:** Svelte 5 (runes mode)
- **Bundler:** Vite
- **Language:** TypeScript
- **HTTP Client:** Native `fetch` via a thin `api.ts` wrapper

## Getting Started

```bash
npm install
npm run dev              # starts on http://localhost:5173
```

The dev server proxies `/api` requests to the backend (default `http://localhost:3000`). Configure the backend URL in `vite.config.ts` if needed.

## Pages

| Route | Purpose |
|-------|---------|
| `/scan` | Unified scan/search page — accepts `?code=` and `?type=item\|tool` from URL params |
| `/items` | Paginated item list with filters (category, vendor, location, label status) |
| `/items/:id` | Item detail with transaction history, image upload, edit form |
| `/items/import` | CSV/Excel import wizard (analyze + execute) |
| `/tools` | Paginated tool list with filters (vendor, location, status) |
| `/tools/:id` | Tool detail with checkouts tab, maintenance tab, flags tab, QR print, decommission |
| `/tools/batch` | Batch create multiple tools with sequential HE numbering |
| `/vendors` | Vendor reference list with add/remove |
| `/vendors/:id` | Vendor detail showing associated items and tools |
| `/locations` | Location reference list |
| `/locations/:id` | Location detail showing associated items and tools |
| `/item-categories` | Category + sub-category management |
| `/stock-takes` | Physical inventory count workflow (create, count, reconcile) |
| `/costing` | Combined item transaction + tool purchase/maintenance cost view |
| `/labels` | One-click label printing for items and tools |
| `/trash` | Recently deleted entities (restore or permanent delete) |

## Architecture

### API Layer

All backend communication goes through `src/lib/api.ts`, which provides strongly-typed helper functions for each resource:

```ts
import { tools, items, lookup, vendors, locations } from '$lib/api';

const result = await lookup.byCode('155', 'tool');
const toolList = await tools.list('saw', { status: 'available', vendorId: 1 });
```

### Barcode Scanning

The scan page accepts scanner input via keyboard events. Scanners act as HID keyboards — they type the code followed by Enter. The `handleScanKeydown` handler catches Enter and triggers `doLookup()`. Scans can also be triggered by navigating to `/scan?code=<value>` (for QR codes, URL-embedded scans, or future camera-based scanning).

### Label Printing

The QR/barcode label flow opens a printer-friendly window with formatted HTML and calls `window.print()`. After printing, the backend is notified via `markPrinted()` to track which items/tools have been labeled. Supports batch selection from the labels page.

## Building for Production

```bash
npm run build
```

Output goes to `build/`. Serve with any static file server or the SvelteKit adapter of your choice. The production build expects `/api` to be proxied to the running backend.
