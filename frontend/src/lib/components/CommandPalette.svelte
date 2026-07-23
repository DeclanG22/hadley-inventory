<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, scale } from 'svelte/transition';
	import { items, tools, vendors, locations, itemCategories, stockTakes } from '$lib/api';
	import { onMount } from 'svelte';
	let open = $state(false);
	let query = $state('');
	let results = $state<{ type: string; label: string; sub: string; href: string; serialNumber?: string }[]>([]);
	let loading = $state(false);
	let selectedIdx = $state(0);
	let debounce: any;
	let inputEl: HTMLInputElement | undefined = $state();

	let cache = $state<{ vendors: any[]; locations: any[]; itemCats: any[]; stockTakes: any[]; maintFlags: any[] }>({
		vendors: [], locations: [], itemCats: [], stockTakes: [], maintFlags: [],
	});

	$effect(() => {
		if (open) {
			inputEl?.focus();
			if (cache.vendors.length === 0) {
				Promise.all([
					vendors.list().then(l => cache.vendors = l).catch(() => {}),
					locations.list().then(l => cache.locations = l).catch(() => {}),
					itemCategories.list().then(l => cache.itemCats = l).catch(() => {}),
					stockTakes.list().then(l => cache.stockTakes = l).catch(() => {}),
					tools.maintenanceFlags.list().then(l => cache.maintFlags = l).catch(() => {}),
				]);
			}
		}
	});

	onMount(() => {
		function openSearchFromMenu() {
			open = !open;

			if (open) {
				query = '';
				results = [];
				selectedIdx = 0;
			}
		}

		window.addEventListener('open-search', openSearchFromMenu);

		return () => {
			window.removeEventListener('open-search', openSearchFromMenu);
		};
});

	function onKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
			e.preventDefault();

			window.dispatchEvent(new Event('open-search'));
		}

		if (!open) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			open = false;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIdx = Math.min(selectedIdx + 1, results.length - 1);
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIdx = Math.max(selectedIdx - 1, 0);
		}

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
		stockTakes: ['stock', 'stocktake', 'stocktakes', 'stock take', 'stock takes'],
		maintFlags: ['flag', 'flags', 'maintenance'],
	};

	function showAllOf(lq: string, key: string): boolean {
		return typeAll[key]?.some(k => lq === k || lq.startsWith(k)) ?? false;
	}

	function norm(s: string): string {
		return s.replace(/\s+/g, ' ').trim().replace(/\s*([^\w\d\s])\s*/g, '$1').replace(/\s*([x×])\s*/g, '$1');
	}

	function stripPunct(s: string): string {
		return s.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
	}

	function tokensMatch(text: string, q: string): boolean {
		const tokens = stripPunct(q).toLowerCase().split(/\s+/).filter(Boolean);
		const lower = text.toLowerCase();
		return tokens.length > 1 ? tokens.every(t => lower.includes(t)) : lower.includes(q);
	}

	function doSearch(q: string) {
		query = q;
		clearTimeout(debounce);
		if (!q) { results = []; loading = false; return; }
		loading = true;
		debounce = setTimeout(async () => {
			selectedIdx = 0;
			const lq = q.toLowerCase();
			const nq = norm(lq);
			const sq = stripPunct(lq);
			const allItems = showAllOf(lq, 'items');
			const allTools = showAllOf(lq, 'tools');

			const queries = [lq];
			if (nq !== lq) queries.push(nq);
			if (sq !== lq && sq !== nq) queries.push(sq);
			const nQueries = sq !== nq ? [nq, sq] : [nq];

			const res = await Promise.all(queries.flatMap(query => [
				items.list(query, { limit: 200 }).catch(() => null),
				tools.list(query, { limit: 200 }).catch(() => null),
				tools.maintenanceSearch(query).catch(() => []),
			]));
			const seenItems = new Set<number>();
			const seenTools = new Set<number>();
			const seenMaint = new Set<number>();
			const r: typeof results = [];

			for (let i = 0; i < res.length; i += 3) {
				const itemsRes = res[i] as any;
				const toolsRes = res[i + 1] as any;
				const maintRes = res[i + 2] as any[];
				if (itemsRes) for (const it of itemsRes.data) {
					if (seenItems.has(it.id)) continue;
					seenItems.add(it.id);
					r.push({ type: 'Item', label: it.itemNumber, sub: it.description, href: `/items/${it.id}` });
				}
				if (toolsRes) for (const t of toolsRes.data) {
					if (seenTools.has(t.id)) continue;
					seenTools.add(t.id);
					const status = t.checkouts?.length > 0 ? 'Checked out' : 'Available';
					r.push({ type: 'Tool', label: t.heNumber ?? t.name, sub: `${t.name} — ${status}`, href: `/tools/${t.id}`, serialNumber: t.serialNumber });
				}
				for (const m of maintRes) {
					if (seenMaint.has(m.id)) continue;
					seenMaint.add(m.id);
					r.push({ type: 'Maintenance', label: `${m.tool.name} — ${m.type}`, sub: m.description ?? '', href: `/tools/${m.tool.id}` });
				}
			}

			if (showAllOf(lq, 'pages')) {
				for (const p of pages) r.push({ type: 'Page', label: p.label, sub: p.sub, href: p.href });
			} else {
				for (const p of pages) if (tokensMatch(`${p.label} ${p.sub}`, q)) r.push({ type: 'Page', label: p.label, sub: p.sub, href: p.href });
			}

			if (showAllOf(lq, 'vendors')) {
				for (const v of cache.vendors) r.push({ type: 'Vendor', label: v.name, sub: '', href: `/vendors/${v.id}` });
			} else {
				for (const v of cache.vendors) if (tokensMatch(v.name, q)) r.push({ type: 'Vendor', label: v.name, sub: '', href: `/vendors/${v.id}` });
			}

			if (showAllOf(lq, 'locations')) {
				for (const l of cache.locations) r.push({ type: 'Location', label: l.name, sub: '', href: `/locations/${l.id}` });
			} else {
				for (const l of cache.locations) if (tokensMatch(l.name, q)) r.push({ type: 'Location', label: l.name, sub: '', href: `/locations/${l.id}` });
			}

			if (showAllOf(lq, 'itemCats')) {
				for (const c of cache.itemCats) r.push({ type: 'Item Category', label: c.name, sub: '', href: `/item-categories?highlight=${c.id}` });
			} else {
				for (const c of cache.itemCats) if (tokensMatch(c.name, q)) r.push({ type: 'Item Category', label: c.name, sub: '', href: `/item-categories?highlight=${c.id}` });
			}

			if (showAllOf(lq, 'stockTakes')) {
				for (const s of cache.stockTakes) {
					const d = new Date(s.date).toLocaleDateString();
					r.push({ type: 'Stock Take', label: d, sub: `Status: ${s.status}`, href: `/stock-takes/${s.id}` });
				}
			} else {
				for (const s of cache.stockTakes) {
					const d = new Date(s.date).toLocaleDateString();
					if (tokensMatch(`${d} ${s.status ?? ''}`, q)) r.push({ type: 'Stock Take', label: d, sub: `Status: ${s.status}`, href: `/stock-takes/${s.id}` });
				}
			}

			if (showAllOf(lq, 'maintFlags')) {
				for (const f of cache.maintFlags) {
					const status = f.resolvedAt ? 'Resolved' : 'Open';
						r.push({ type: 'Flag', label: `${f.tool.name} — ${f.type}`, sub: `Status: ${status} — ${f.description ?? ''}`, href: `/tools/maintenance-flags?highlight=${f.id}` });
				}
			} else {
				for (const f of cache.maintFlags) {
					if (tokensMatch(`${f.tool.name} ${f.type} ${f.description ?? ''} ${f.createdBy ?? ''}`, q)) {
						const status = f.resolvedAt ? 'Resolved' : 'Open';
					r.push({ type: 'Flag', label: `${f.tool.name} — ${f.type}`, sub: `Status: ${status} — ${f.description ?? ''}`, href: `/tools/maintenance-flags?highlight=${f.id}` });
					}
				}
			}

			const lqLower = q.toLowerCase().trim();
			r.sort((a, b) => {
				const aExact = String(a.label).toLowerCase() === lqLower ? 0 : 1;
				const bExact = String(b.label).toLowerCase() === lqLower ? 0 : 1;
				if (aExact !== bExact) return aExact - bExact;
				return 0;
			});
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
						{#if r.type === 'Item' || r.type === 'Tool'}
							<button class="scan-btn" onclick={(e) => { e.stopPropagation(); const scanCode = r.serialNumber ?? r.label; goto(`/scan?code=${scanCode}&type=${r.type.toLowerCase()}`); open = false; }}>Scan</button>
						{/if}
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
	.results::-webkit-scrollbar {
		width: 8px;
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
		flex: 1;
	}
	.result-row .scan-btn {
		margin-left: auto;
		flex-shrink: 0;
		background: color-mix(in srgb, var(--blue) 15%, transparent);
		border: 1px solid color-mix(in srgb, var(--blue) 30%, transparent);
		color: color-mix(in srgb, var(--blue) 80%, transparent);
		border-radius: 6px;
		padding: 2px 8px;
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s, border-color 0.15s;
	}
	.result-row .scan-btn:hover {
		background: color-mix(in srgb, var(--blue) 25%, transparent);
		border-color: color-mix(in srgb, var(--blue) 50%, transparent);
	}
</style>
