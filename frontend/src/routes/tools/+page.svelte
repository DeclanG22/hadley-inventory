<script lang="ts">
	import { goto } from '$app/navigation';
	import { tools, vendors, locations } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';

	const PAGE_SIZE = 50;

	let allTools = $state<any[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let loadingMore = $state(false);
	let loadError = $state('');
	let hasMore = $state(true);
	let loadId = 0;
	let search = $state('');
	let vendorId = $state('');
	let locationId = $state('');
	let statusFilter = $state('');
	let venList = $state<any[]>([]);
	let locList = $state<any[]>([]);
	let sortBy = $state('name');
	let sortOrder = $state<'asc' | 'desc'>('asc');
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
		vendors.list().then(l => venList = l).catch(() => {});
		locations.list().then(l => locList = l).catch(() => {});
		load();
	});

	async function load(reset = true) {
		const id = ++loadId;
		if (reset) {
			allTools = [];
			hasMore = true;
			loadError = '';
			loading = true;
			loadingMore = false;
		}
		try {
			const r = await tools.list(search || undefined, {
				vendorId: vendorId ? Number(vendorId) : undefined,
				locationId: locationId ? Number(locationId) : undefined,
				status: statusFilter || undefined,
				page: reset ? 1 : (Math.floor(allTools.length / PAGE_SIZE) + 1),
				limit: PAGE_SIZE,
				sortBy, sortOrder,
			});
			if (id !== loadId) return;
			allTools = [...allTools, ...r.data];
			total = r.total;
			hasMore = allTools.length < r.total;
		} catch {
			if (id === loadId) {
				loadError = 'Failed to load tools';
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
		tools.remove(id).then(() => { load(); addToast('Tool deleted', 'success'); }).catch(e => addToast(e.message, 'error'));
	}

	function status(t: any): string {
		if (t.decommissionedAt) return 'Decommissioned';
		return t.checkouts?.length > 0 ? 'Checked Out' : 'Available';
	}

	const sortArrow = (col: string) => sortBy === col ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : '';
</script>

<div class="page-header">
	<h1>Tools</h1>
	<div style="display:flex;gap:6px">
		<div class="segmented">
			<button type="button" class="segment" class:active={viewMode === 'table'} onclick={() => viewMode = 'table'}>Table</button>
			<button type="button" class="segment" class:active={viewMode === 'cards'} onclick={() => viewMode = 'cards'}>Cards</button>
		</div>
		<a href="/tools/import" class="btn">
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
			<path d="M0 0h24v24H0z" fill="none" />
			<path fill="currentColor" d="M21 14a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 0-2 0v4a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-4a1 1 0 0 0-1-1m-9.71 1.71a1 1 0 0 0 .33.21a.94.94 0 0 0 .76 0a1 1 0 0 0 .33-.21l4-4a1 1 0 0 0-1.42-1.42L13 12.59V3a1 1 0 0 0-2 0v9.59l-2.29-2.3a1 1 0 1 0-1.42 1.42Z" />
		</svg>
		Import</a>
		<a href="/tools/batch" class="btn">
    		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
    			<path d="M0 0h16v16H0z" fill="none" />
    			<path fill="none" stroke="currentColor" stroke-linejoin="round" d="M2.5 4v9.5H12M11.5 7h-5M9 4.5v5m-4.5-7h9v9h-9z" />
    		</svg>
        Batch Create
		</a>
		<a href="/tools/new" class="btn btn-primary">
		+ Create Tool
		</a>
	</div>
</div>

<div class="card">
	<div class="search-bar" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
		<input type="search" bind:value={search} placeholder="Search tools by name, HE#, or serial#..." oninput={onSearchInput} style="flex:1;min-width:140px" />
		<select bind:value={vendorId} onchange={load} style="width:140px">
			<option value="">All Vendors</option>
			{#each venList as v}<option value={v.id}>{v.name}</option>{/each}
		</select>
		<select bind:value={locationId} onchange={load} style="width:140px">
			<option value="">All Locations</option>
			{#each locList as l}<option value={l.id}>{l.name}</option>{/each}
		</select>
		<select bind:value={statusFilter} onchange={load} style="width:140px">
			<option value="">All Statuses</option>
			<option value="available">Available</option>
			<option value="checked-out">Checked Out</option>
			<option value="decommissioned">Decommissioned</option>
		</select>
	</div>
	{#if loading && allTools.length === 0}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:25%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:22%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:11%"></div><div class="sk-cell sk" style="width:28%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:13%"></div><div class="sk-cell sk" style="width:26%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:8%"></div></div>
		</div>
	{:else if allTools.length === 0}
		<div class="empty-state">{loadError || 'No tools found.'}</div>
	{:else if viewMode === 'table'}
		<div class="table-wrap">
			<table style="table-layout:fixed">
				<thead>
					<tr>
						<th role="button" tabindex={0} onclick={() => setSort('name')} style="cursor:pointer;width:auto">Name{sortArrow('name')}</th>
						<th style="width:auto">Description</th>
						<th style="width:100px">Serial #</th>
						<th role="button" tabindex={0} onclick={() => setSort('heNumber')} style="cursor:pointer;width:100px">HE #{sortArrow('heNumber')}</th>
						<th style="width:120px">Vendor</th>
						<th style="width:100px">Status</th>
						<th style="width:40px"></th>
					</tr>
				</thead>
				<tbody>
					{#each allTools as t}
						<tr onclick={() => goto(`/tools/${t.id}`)}>
							<td>
								{#if t.imageUrl}
									<img src={t.imageUrl} alt="" class="item-thumb" />
								{/if}
								<a href="/tools/{t.id}" onclick={(e) => e.stopPropagation()}>{t.name}</a>
							</td>
							<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{t.description ?? '-'}</td>
							<td>{t.serialNumber ?? '-'}</td>
							<td>{t.heNumber ?? '-'}</td>
							<td>{t.vendor?.name ?? '-'}</td>
							<td><span class="badge {status(t) === 'Checked Out' ? 'badge-checked-out' : status(t) === 'Decommissioned' ? 'badge-decommissioned' : 'badge-available'}">{status(t)}</span></td>
							<td><button class="btn-del btn-sm" onclick={(e) => { e.stopPropagation(); remove(t.id); }}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div style="display:flex;align-items:center;justify-content:center;padding:16px;gap:8px;color:var(--text-secondary);font-size:13px">
			{#if loadingMore}
				<span class="spinner" style="width:16px;height:16px"></span>
				<span>Loading more...</span>
			{:else if loadError}
				<span style="color:var(--red)">{loadError}</span>
			{:else if !hasMore}
				<span>Showing all {total} tools</span>
			{/if}
		</div>
		<div use:observeSentinel style="height:1px"></div>
	{:else}
		<div class="card-grid">
			{#each allTools as t}
				<div class="tool-card" role="button" tabindex={0} onclick={() => goto(`/tools/${t.id}`)} onkeydown={(e) => e.key === 'Enter' && goto(`/tools/${t.id}`)}>
					{#if t.imageUrl}
						<img src={t.imageUrl} alt="" class="tool-card-img" />
					{/if}
					<div class="tool-card-body">
						<div class="tool-card-header">
							<div class="tool-card-title">{t.name}</div>
							<span class="badge {status(t) === 'Checked Out' ? 'badge-checked-out' : status(t) === 'Decommissioned' ? 'badge-decommissioned' : 'badge-available'}">{status(t)}</span>
						</div>
						{#if t.description}<div class="tool-card-desc">{t.description}</div>{/if}
						<div class="tool-card-meta">
							<span>Vendor: <strong>{t.vendor?.name ?? '-'}</strong></span>
							<span>HE #: <strong>{t.heNumber ?? '-'}</strong></span>
						</div>
					</div>
					<button class="btn-del btn-sm tool-card-del" onclick={(e) => { e.stopPropagation(); remove(t.id); }}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button>
				</div>
			{/each}
		</div>
		<div style="display:flex;align-items:center;justify-content:center;padding:16px;gap:8px;color:var(--text-secondary);font-size:13px">
			{#if loadingMore}
				<span class="spinner" style="width:16px;height:16px"></span>
				<span>Loading more...</span>
			{:else if loadError}
				<span style="color:var(--red)">{loadError}</span>
			{:else if !hasMore}
				<span>Showing all {total} tools</span>
			{/if}
		</div>
		<div use:observeSentinel style="height:1px"></div>
	{/if}
</div>

<style>
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 12px;
		margin-top: 10px;
	}

	.tool-card {
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

	.tool-card:hover {
	background: var(--bg-darker);
	}

	.tool-card-img {
		width: 100%;
		height: 140px;
		object-fit: cover;
		border-bottom: 1px solid var(--border-color);
	}

	.tool-card-body {
		padding: 12px 14px;
		flex: 1;
	}

	.tool-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2px;
		padding-right: 30px;
	}

	.tool-card-title {
		font-size: 15px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.tool-card-desc {
		font-size: 12px;
		color: var(--empty-text-primary);
		margin-bottom: 10px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tool-card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
		font-size: 12px;
		color: var(--text-secondary);
	}

	.tool-card-meta strong {
		color: var(--text-primary);
		font-weight: 500;
	}

	.tool-card-del {
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

	.btn {
	display: infline-flex;
	align-items: center;
	gap: 6px;
	}

	.btn svg {
	margin-right: 4px;
	transform: translateY(2px);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
