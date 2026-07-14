<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, scale } from 'svelte/transition';
	import { items, tools, vendors, locations, itemCategories, toolCategories, stockTakes } from '$lib/api';

	let open = $state(false);
	let query = $state('');
	let results = $state<{ type: string; label: string; sub: string; href: string }[]>([]);
	let loading = $state(false);
	let selectedIdx = $state(0);
	let debounce: any;
	let inputEl: HTMLInputElement | undefined = $state();

	let cache = $state<{ vendors: any[]; locations: any[]; itemCats: any[]; toolCats: any[]; stockTakes: any[] }>({
		vendors: [], locations: [], itemCats: [], toolCats: [], stockTakes: [],
	});

	$effect(() => {
		if (open) {
			inputEl?.focus();
			if (cache.vendors.length === 0) {
				Promise.all([
					vendors.list().then(l => cache.vendors = l).catch(() => {}),
					locations.list().then(l => cache.locations = l).catch(() => {}),
					itemCategories.list().then(l => cache.itemCats = l).catch(() => {}),
					toolCategories.list().then(l => cache.toolCats = l).catch(() => {}),
					stockTakes.list().then(l => cache.stockTakes = l).catch(() => {}),
				]);
			}
		}
	});

	function onKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
			e.preventDefault();
			open = !open;
			if (open) { query = ''; results = []; selectedIdx = 0; }
		}
		if (!open) return;
		if (e.key === 'Escape') { e.preventDefault(); open = false; }
		if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, results.length - 1); }
		if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); }
		if (e.key === 'Enter' && results[selectedIdx]) {
			e.preventDefault();
			goto(results[selectedIdx].href);
			open = false;
		}
	}

	const pages = [
		{ label: 'Dashboard', sub: 'Home', href: '/' },
		{ label: 'All Items', sub: 'Browse inventory items', href: '/items' },
		{ label: 'New Item', sub: 'Create an item', href: '/items/new' },
		{ label: 'Item Categories', sub: 'Manage item categories', href: '/item-categories' },
		{ label: 'Item Costing', sub: 'Item transaction costing', href: '/items/costing' },
		{ label: 'Low Stock Items', sub: 'Items below minimum stock', href: '/items/low-stock' },
		{ label: 'Import Items', sub: 'Bulk import from spreadsheet', href: '/items/import' },
		{ label: 'All Tools', sub: 'Browse tools', href: '/tools' },
		{ label: 'New Tool', sub: 'Create a tool', href: '/tools/new' },
		{ label: 'Tool Categories', sub: 'Manage tool categories', href: '/tool-categories' },
		{ label: 'Tool Costing', sub: 'Tool purchase & maintenance costing', href: '/tools/costing' },
		{ label: 'Checked Out Tools', sub: 'Currently checked out tools', href: '/tools/checked-out' },
		{ label: 'Overdue Returns', sub: 'Tools past due date', href: '/tools/checked-out?overdue=true' },
		{ label: 'Stock Takes', sub: 'Inventory counts', href: '/stock-takes' },
		{ label: 'New Stock Take', sub: 'Start a new count', href: '/stock-takes/new' },
		{ label: 'Vendors', sub: 'Manage vendors', href: '/vendors' },
		{ label: 'Locations', sub: 'Manage locations', href: '/locations' },
		{ label: 'Recently Deleted', sub: 'View trashed items and tools', href: '/trash' },
		{ label: 'Scan & Transact', sub: 'Scan barcode to transact', href: '/scan' },
		{ label: 'QR Code Generator', sub: 'Print QR code labels', href: '/labels' },
	];

	const typeAll: Record<string, string[]> = {
		pages: ['page', 'pages'],
		items: ['item', 'items'],
		tools: ['tool', 'tools'],
		vendors: ['vendor', 'vendors'],
		locations: ['location', 'locations', 'loc'],
		itemCats: ['category', 'categories', 'cat', 'item category'],
		toolCats: ['tool category', 'tool categories'],
		stockTakes: ['stock', 'stocktake', 'stocktakes', 'stock take', 'stock takes'],
	};

	function showAllOf(lq: string, key: string): boolean {
		return typeAll[key]?.some(k => lq === k || lq.startsWith(k)) ?? false;
	}

	function doSearch(q: string) {
		query = q;
		clearTimeout(debounce);
		if (!q) { results = []; loading = false; return; }
		loading = true;
		debounce = setTimeout(async () => {
			selectedIdx = 0;
			const lq = q.toLowerCase();
			const allItems = showAllOf(lq, 'items');
			const allTools = showAllOf(lq, 'tools');

			const [itemsRes, toolsRes, maintRes] = await Promise.all([
				items.list(q, { limit: allItems ? 50 : 5 }).catch(() => null),
				tools.list(q, { limit: allTools ? 50 : 5 }).catch(() => null),
				tools.maintenanceSearch(q).catch(() => []),
			]);
			const r: typeof results = [];

			if (showAllOf(lq, 'pages')) {
				for (const p of pages) r.push({ type: 'Page', label: p.label, sub: p.sub, href: p.href });
			} else {
				for (const p of pages) if (p.label.toLowerCase().includes(lq) || p.sub.toLowerCase().includes(lq)) r.push({ type: 'Page', label: p.label, sub: p.sub, href: p.href });
			}

			if (itemsRes) for (const i of itemsRes.data) r.push({ type: 'Item', label: i.itemNumber, sub: i.description, href: `/items/${i.id}` });
			if (toolsRes) for (const t of toolsRes.data) {
				const status = t.checkouts?.length > 0 ? 'Checked out' : 'Available';
				r.push({ type: 'Tool', label: t.toolNumber, sub: `${t.name} — ${status}`, href: `/tools/${t.id}` });
			}
			for (const m of (maintRes as any[])) r.push({ type: 'Maintenance', label: `${m.tool.toolNumber} — ${m.type}`, sub: m.description ?? '', href: `/tools/${m.tool.id}` });

			if (showAllOf(lq, 'vendors')) {
				for (const v of cache.vendors) r.push({ type: 'Vendor', label: v.name, sub: '', href: `/vendors/${v.id}` });
			} else {
				for (const v of cache.vendors) if (v.name.toLowerCase().includes(lq)) r.push({ type: 'Vendor', label: v.name, sub: '', href: `/vendors/${v.id}` });
			}

			if (showAllOf(lq, 'locations')) {
				for (const l of cache.locations) r.push({ type: 'Location', label: l.name, sub: '', href: `/locations/${l.id}` });
			} else {
				for (const l of cache.locations) if (l.name.toLowerCase().includes(lq)) r.push({ type: 'Location', label: l.name, sub: '', href: `/locations/${l.id}` });
			}

			if (showAllOf(lq, 'itemCats')) {
				for (const c of cache.itemCats) r.push({ type: 'Item Category', label: c.name, sub: '', href: `/item-categories?highlight=${c.id}` });
			} else {
				for (const c of cache.itemCats) if (c.name.toLowerCase().includes(lq)) r.push({ type: 'Item Category', label: c.name, sub: '', href: `/item-categories?highlight=${c.id}` });
			}

			if (showAllOf(lq, 'toolCats')) {
				for (const c of cache.toolCats) r.push({ type: 'Tool Category', label: c.name, sub: '', href: `/tool-categories?highlight=${c.id}` });
			} else {
				for (const c of cache.toolCats) if (c.name.toLowerCase().includes(lq)) r.push({ type: 'Tool Category', label: c.name, sub: '', href: `/tool-categories?highlight=${c.id}` });
			}

			if (showAllOf(lq, 'stockTakes')) {
				for (const s of cache.stockTakes) {
					const d = new Date(s.date).toLocaleDateString();
					r.push({ type: 'Stock Take', label: d, sub: `Status: ${s.status}`, href: `/stock-takes/${s.id}` });
				}
			} else {
				for (const s of cache.stockTakes) {
					const d = new Date(s.date).toLocaleDateString();
					if (d.includes(lq) || s.status?.toLowerCase().includes(lq)) r.push({ type: 'Stock Take', label: d, sub: `Status: ${s.status}`, href: `/stock-takes/${s.id}` });
				}
			}

			results = r;
			loading = false;
		}, 200);
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="backdrop" transition:fade={{ duration: 150 }} onclick={() => open = false} onkeydown={() => {}}></div>
	<div class="palette" class:show-divider={loading || query} transition:scale={{ start: 0.92, duration: 150 }} role="dialog" aria-label="Command palette">
		<input
			bind:this={inputEl}
			type="search"
			placeholder="Search pages, items, tools, stock takes..."
			oninput={(e) => doSearch((e.target as HTMLInputElement).value)}
			onkeydown={(e) => {
				if (e.key === 'Escape') open = false;
				if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') e.preventDefault();
			}}
		/>
		{#if loading}
			<div class="loading">Searching…</div>
		{:else if query && results.length === 0}
			<div class="empty">No results found.</div>
		{:else if results.length > 0}
			<div class="results">
				{#each results as r, i}
					<button
						class="result-row"
						class:selected={i === selectedIdx}
						onclick={() => { goto(r.href); open = false; }}
						onmouseenter={() => selectedIdx = i}
					>
						<span class="type-badge">{r.type}</span>
						<span class="label">{r.label}</span>
						{#if r.sub}<span class="sub">{r.sub}</span>{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.45);
		backdrop-filter: blur(4px);
		z-index: 999;
	}
	.palette {
		position: fixed;
		top: 15%;
		left: 50%;
		transform: translateX(-50%);
		width: 520px;
		max-width: 90vw;
		max-height: 55vh;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 14px;
		box-shadow: 0 8px 40px rgba(0,0,0,0.2);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.palette input::-webkit-search-cancel-button,
.palette input::-webkit-search-decoration,
.palette input::-webkit-search-results-button,
.palette input::-webkit-search-results-decoration {
		-webkit-appearance: none;
		appearance: none;
		display: none;
}
	.palette input {
		width: 100%;
		padding: 14px 16px;
		border: none;
		background: transparent;
		color: var(--text-primary);
		border-radius: 0px;
		border-bottom: 1px solid transparent;
		font-size: 15px;
		outline: none;
		box-sizing: border-box;
	}
	.palette.show-divider input {
		border-bottom: 1px solid var(--border-color);
}
	.loading, .empty {
		padding: 20px;
		text-align: center;
		color: var(--text-secondary);
		font-size: 13px;
	}
	.results {
		overflow-y: auto;
		flex: 1;
		padding: 6px;
	}
	.result-row {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 10px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--text-primary);
		font-size: 13px;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition: background 0.1s;
	}
	.result-row.selected, .result-row:hover {
		background: color-mix(in srgb, var(--empty-text-secondary) 20%, transparent);
	}
	.type-badge {
		font-size: 10px;
		font-weight: 500;
		padding: 2px 6px;
		border-radius: 4px;
		background: color-mix(in srgb, var(--empty-text-secondary) 25%, transparent);
		color: var(--text-secondary);
		flex-shrink: 0;
	}
	.label {
		font-weight: 500;
		flex-shrink: 0;
	}
	.sub {
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
