<script lang="ts">
	import { goto } from '$app/navigation';
	import { items, locations, vendors, itemCategories } from '$lib/api';
	import type { PaginatedResult } from '$lib/api';

	let result = $state<PaginatedResult<any> | null>(null);
	let loading = $state(true);
	let search = $state('');
	let categoryId = $state('');
	let vendorId = $state('');
	let locationId = $state('');
	let page = $state(1);
	let sortBy = $state('itemNumber');
	let sortOrder = $state<'asc' | 'desc'>('asc');
	let locList = $state<any[]>([]);
	let venList = $state<any[]>([]);
	let catList = $state<any[]>([]);

	let debounce: any;

	function load() {
		loading = true;
		items.list(search || undefined, {
			categoryId: categoryId ? Number(categoryId) : undefined,
			vendorId: vendorId ? Number(vendorId) : undefined,
			locationId: locationId ? Number(locationId) : undefined,
			page, limit: 50, sortBy, sortOrder,
		}).then(r => { result = r; }).finally(() => loading = false);
	}
	$effect(() => {
		locations.list().then(l => locList = l);
		vendors.list().then(l => venList = l);
		itemCategories.list().then(l => catList = l);
		load();
	});

	function onSearchInput() {
		clearTimeout(debounce);
		debounce = setTimeout(() => { page = 1; load(); }, 300);
	}

	function setSort(col: string) {
		if (sortBy === col) { sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; }
		else { sortBy = col; sortOrder = 'asc'; }
		page = 1;
		load();
	}

	function remove(id: number) {
		if (!confirm('Delete this item?')) return;
		items.remove(id).then(load);
	}

	function go(p: number) { page = p; load(); }

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
		<a href="/items/import" class="btn">Import</a>
		<button class="btn" onclick={exportCSV}>Export</button>
		<a href="/items/new" class="btn btn-primary">+ New Item</a>
	</div>
</div>

<div class="card">
	<div class="search-bar" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
		<input type="search" bind:value={search} placeholder="Search items..." oninput={onSearchInput} style="flex:1;min-width:140px" />
		<select bind:value={categoryId} onchange={() => { page = 1; load(); }} style="width:140px">
			<option value="">All Categories</option>
			{#each catList as c}<option value={c.id}>{c.name}</option>{/each}
		</select>
		<select bind:value={vendorId} onchange={() => { page = 1; load(); }} style="width:140px">
			<option value="">All Vendors</option>
			{#each venList as v}<option value={v.id}>{v.name}</option>{/each}
		</select>
		<select bind:value={locationId} onchange={() => { page = 1; load(); }} style="width:140px">
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
	{:else if result && result.data.length > 0}
		<div style="display:flex;justify-content:space-between;align-items:center;padding:0 0 8px;font-size:13px;color:var(--text-secondary)">
			<span>Showing {result.data.length} of {result.total} item(s)</span>
			<div class="pagination" style="display:flex;gap:4px;align-items:center">
				<button class="btn-ghost btn-sm" disabled={page <= 1} onclick={() => go(page - 1)}>Prev</button>
				<span style="font-size:12px;color:var(--text-secondary)">Page {result.page} of {Math.ceil(result.total / result.limit)}</span>
				<button class="btn-ghost btn-sm" disabled={page * result.limit >= result.total} onclick={() => go(page + 1)}>Next</button>
			</div>
		</div>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th role="button" tabindex={0} onclick={() => setSort('itemNumber')} style="cursor:pointer">Item #{sortArrow('itemNumber')}</th>
						<th role="button" tabindex={0} onclick={() => setSort('description')} style="cursor:pointer">Description{sortArrow('description')}</th>
						<th>Category</th>
						<th role="button" tabindex={0} onclick={() => setSort('onHand')} style="cursor:pointer">On Hand{sortArrow('onHand')}</th>
						<th>Unit</th>
						<th role="button" tabindex={0} onclick={() => setSort('unitPrice')} style="cursor:pointer">Price{sortArrow('unitPrice')}</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each result.data as i}
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
							<td><button class="btn-ghost btn-sm" onclick={(e) => { e.stopPropagation(); remove(i.id); }}>Delete</button></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div style="display:flex;justify-content:center;gap:4px;align-items:center;padding:12px 0 0">
			<button class="btn-ghost btn-sm" disabled={page <= 1} onclick={() => go(1)}>First</button>
			<button class="btn-ghost btn-sm" disabled={page <= 1} onclick={() => go(page - 1)}>Prev</button>
			<span style="font-size:13px;color:var(--text-secondary)">Page {result.page} of {Math.ceil(result.total / result.limit)}</span>
			<button class="btn-ghost btn-sm" disabled={page * (result?.limit ?? 1) >= (result?.total ?? 0)} onclick={() => go(page + 1)}>Next</button>
			<button class="btn-ghost btn-sm" disabled={page * (result?.limit ?? 1) >= (result?.total ?? 0)} onclick={() => go(Math.ceil((result?.total ?? 0) / (result?.limit ?? 1)))}>Last</button>
		</div>
	{:else}
		<div class="empty-state">No items found.</div>
	{/if}
</div>
