<script lang="ts">
	import { goto } from '$app/navigation';
	import { items, locations, vendors, itemCategories } from '$lib/api';

	const PAGE_SIZE = 50;

	let allItems = $state<any[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let loadingMore = $state(false);
	let loadError = $state('');
	let hasMore = $state(true);
	let loadId = 0;
	let search = $state('');
	let categoryId = $state('');
	let vendorId = $state('');
	let locationId = $state('');
	let sortBy = $state('itemNumber');
	let sortOrder = $state<'asc' | 'desc'>('asc');
	let locList = $state<any[]>([]);
	let venList = $state<any[]>([]);
	let catList = $state<any[]>([]);

	let viewMode = $state<'table' | 'cards'>('table');
	let debounce: any;

	function observeSentinel(element: HTMLElement) {
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) loadMore();
		}, { rootMargin: '400px' });
		observer.observe(element);
		return { destroy() { observer.disconnect(); } };
	}

	import { onMount } from 'svelte';

	onMount(() => {
		locations.list().then(l => locList = l).catch(() => {});
		vendors.list().then(l => venList = l).catch(() => {});
		itemCategories.list().then(l => catList = l).catch(() => {});
		load();
	});

	async function load(reset = true) {
		const id = ++loadId;
		if (reset) {
			allItems = [];
			hasMore = true;
			loadError = '';
			loading = true;
			loadingMore = false;
		}
		try {
			const r = await items.list(search || undefined, {
				categoryId: categoryId ? Number(categoryId) : undefined,
				vendorId: vendorId ? Number(vendorId) : undefined,
				locationId: locationId ? Number(locationId) : undefined,
				page: reset ? 1 : (Math.floor(allItems.length / PAGE_SIZE) + 1),
				limit: PAGE_SIZE,
				sortBy, sortOrder,
			});
			if (id !== loadId) return;
			allItems = [...allItems, ...r.data];
			total = r.total;
			hasMore = allItems.length < r.total;
		} catch {
			if (id === loadId) {
				loadError = 'Failed to load items';
				hasMore = false;
			}
		} finally {
			if (id === loadId) {
				loading = false;
				loadingMore = false;
			}
		}
	}

	function loadMore() {
		if (!hasMore || loadingMore || loading) return;
		loadingMore = true;
		load(false);
	}

	function onSearchInput() {
		clearTimeout(debounce);
		debounce = setTimeout(load, 300);
	}

	function setSort(col: string) {
		if (sortBy === col) { sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; }
		else { sortBy = col; sortOrder = 'asc'; }
		load();
	}

	async function remove(id: number) {
		items.remove(id).then(load);
	}

	function exportCSV() {
		items.list(search || undefined, { categoryId: categoryId ? Number(categoryId) : undefined, vendorId: vendorId ? Number(vendorId) : undefined, locationId: locationId ? Number(locationId) : undefined, limit: 5000 })
			.then(r => {
				const headers = ['Item #','Description','Category','SubCategory','On Hand','Unit','Unit Price','Location','Vendor'];
				const rows = r.data.map((i: any) => [
					i.itemNumber, i.description, i.category?.name ?? '', i.subCategory?.name ?? '',
					i.onHand, i.unit ?? '', i.unitPrice ? Number(i.unitPrice).toFixed(2) : '',
					i.location?.name ?? '', i.vendor?.name ?? '',
				]);
				const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
				const blob = new Blob([csv], { type: 'text/csv' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url; a.download = 'items-export.csv'; a.click();
				URL.revokeObjectURL(url);
			});
	}

	const sortArrow = (col: string) => sortBy === col ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : '';
</script>

<div class="page-header">
	<h1>Items</h1>
	<div style="display:flex;gap:6px">
		<div class="segmented">
			<button type="button" class="segment" class:active={viewMode === 'table'} onclick={() => viewMode = 'table'}>Table</button>
			<button type="button" class="segment" class:active={viewMode === 'cards'} onclick={() => viewMode = 'cards'}>Cards</button>
		</div>
		<a href="/items/import" class="btn">Import</a>
		<button class="btn" onclick={exportCSV}>Export</button>
		<a href="/items/new" class="btn btn-primary">+ New Item</a>
	</div>
</div>

<div class="card">
	<div class="search-bar" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
		<input type="search" bind:value={search} placeholder="Search items..." oninput={onSearchInput} style="flex:1;min-width:140px" />
		<select bind:value={categoryId} onchange={load} style="width:140px">
			<option value="">All Categories</option>
			{#each catList as c}<option value={c.id}>{c.name}</option>{/each}
		</select>
		<select bind:value={vendorId} onchange={load} style="width:140px">
			<option value="">All Vendors</option>
			{#each venList as v}<option value={v.id}>{v.name}</option>{/each}
		</select>
		<select bind:value={locationId} onchange={load} style="width:140px">
			<option value="">All Locations</option>
			{#each locList as l}<option value={l.id}>{l.name}</option>{/each}
		</select>
	</div>
	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:35%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:28%"></div><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:32%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:13%"></div><div class="sk-cell sk" style="width:36%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:8%"></div></div>
		</div>
	{:else if allItems.length > 0}
		{#if viewMode === 'table'}
			<div class="table-wrap">
				<table style="table-layout:fixed">
					<thead>
						<tr>
							<th role="button" tabindex={0} onclick={() => setSort('itemNumber')} style="cursor:pointer;width:300px">Item #{sortArrow('itemNumber')}</th>
							<th role="button" tabindex={0} onclick={() => setSort('description')} style="cursor:pointer;width:auto">Description{sortArrow('description')}</th>
							<th style="width:120px">Category</th>
							<th role="button" tabindex={0} onclick={() => setSort('onHand')} style="cursor:pointer;width:70px">On Hand{sortArrow('onHand')}</th>
							<th style="width:70px">Unit</th>
							<th role="button" tabindex={0} onclick={() => setSort('unitPrice')} style="cursor:pointer;width:70px">Price{sortArrow('unitPrice')}</th>
							<th style="width:40px"></th>
						</tr>
					</thead>
					<tbody>
						{#each allItems as i}
							<tr onclick={() => goto(`/items/${i.id}`)}>
								<td>
									{#if i.imageUrl}
										<img src={i.imageUrl} alt="" class="item-thumb" />
									{/if}
									<a href="/items/{i.id}" onclick={(e) => e.stopPropagation()}>{i.itemNumber}</a>
								</td>
								<td>{i.description}</td>
								<td>{i.category?.name ?? '-'}</td>
								<td>{i.onHand}</td>
								<td>{i.unit ?? '-'}</td>
								<td>{i.unitPrice ? `$${Number(i.unitPrice).toFixed(2)}` : '-'}</td>
								<td><button class="btn-del btn-sm" onclick={(e) => { e.stopPropagation(); remove(i.id); }}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="card-grid">
				{#each allItems as i}
					<div class="item-card" role="button" tabindex={0} onclick={() => goto(`/items/${i.id}`)} onkeydown={(e) => e.key === 'Enter' && goto(`/items/${i.id}`)}>
						{#if i.imageUrl}
							<img src={i.imageUrl} alt="" class="item-card-img" />
						{/if}
						<div class="item-card-body">
							<div class="item-card-title">{i.itemNumber}</div>
							<div class="item-card-desc">{i.description}</div>
							<div class="item-card-meta">
								<span>On Hand: <strong>{i.onHand}</strong></span>
								<span>{i.category?.name ?? '-'}</span>
								<span>{i.unit ?? '-'}</span>
								<span>{i.unitPrice ? `$${Number(i.unitPrice).toFixed(2)}` : '-'}</span>
							</div>
						</div>
						<button class="btn-del btn-sm item-card-del" onclick={(e) => { e.stopPropagation(); remove(i.id); }}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button>
					</div>
				{/each}
			</div>
		{/if}
		<div style="display:flex;align-items:center;justify-content:center;padding:16px;gap:8px;color:var(--text-secondary);font-size:13px">
			{#if loadingMore}
				<span class="spinner" style="width:16px;height:16px"></span>
				<span>Loading more...</span>
			{:else if loadError}
				<span style="color:var(--red)">{loadError}</span>
			{:else if !hasMore}
				<span>Showing all {total} items</span>
			{/if}
		</div>
		<div use:observeSentinel style="height:1px"></div>
	{:else}
		<div class="empty-state">{loadError || 'No items found.'}</div>
	{/if}
</div>

<style>
	.table-wrap tbody tr:nth-child(even) td {
		background: var(--bg-off);
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 12px;
	}

	.item-card {
		display: flex;
		flex-direction: column;

		background: color-mix(in srgb, var(--bg-secondary), 50% transparent);
		border: 1px solid var(--border-color);
		border-radius: 18px;
		padding: 0;
		overflow: hidden;
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-normal);
		position: relative;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
		width: 100%;
	}

	.item-card:hover {
	background: var(--bg-darker);
	}

	.item-card-img {
		width: 100%;
		height: 140px;
		object-fit: cover;
		border-bottom: 1px solid var(--border-color);
	}

	.item-card-body {
		padding: 12px 14px;
		flex: 1;
	}

	.item-card-title {
		font-size: 15px;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 2px;
	}

	.item-card-desc {
		font-size: 12px;
		color: var(--empty-text-primary);
		margin-bottom: 10px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
		font-size: 12px;
		color: var(--text-secondary);
	}

	.item-card-meta strong {
		color: var(--text-primary);
		font-weight: 500;
	}

	.item-card-del {
		position: absolute;
		top: 8px;
		right: 8px;
	}

	.spinner {
		border: 2px solid var(--border-color);
		border-top-color: var(--text-secondary);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
		display: inline-block;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
