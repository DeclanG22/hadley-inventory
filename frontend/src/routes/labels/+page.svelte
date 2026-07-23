<script lang="ts">
	import { items, tools } from '$lib/api';
	import QRCode from 'qrcode';

	const PAGE_SIZE = 50;

	let tab = $state<'items' | 'tools'>('items');
	let filter = $state<'all' | 'labeled' | 'unlabeled'>('unlabeled');
	let allEntities = $state<any[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let loadingMore = $state(false);
	let loadError = $state('');
	let hasMore = $state(true);
	let loadId = 0;
	let loadingAll = $state(false);
	let selected = $state<Set<number>>(new Set());
	let qrImages = $state<Map<number, string>>(new Map());

	function observeSentinel(element: HTMLElement) {
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) loadMore();
		}, { rootMargin: '400px' });
		observer.observe(element);
		return { destroy() { observer.disconnect(); } };
	}

	$effect(() => { tab; filter; load(); });

	async function load(reset = true) {
		loadingAll = false;
		const id = ++loadId;
		if (reset) {
			allEntities = [];
			hasMore = true;
			loadError = '';
			loading = true;
			loadingMore = false;
			selected = new Set();
		}
		try {
			const api = tab === 'items' ? items : tools;
			const filters: any = {
				page: reset ? 1 : (Math.floor(allEntities.length / PAGE_SIZE) + 1),
				limit: PAGE_SIZE,
			};
			if (filter === 'labeled') filters.labelPrinted = true;
			else if (filter === 'unlabeled') filters.labelPrinted = false;
			const r = await api.list(undefined, filters);
			if (id !== loadId) return;
			allEntities = [...allEntities, ...r.data];
			total = r.total;
			hasMore = allEntities.length < r.total;
		} catch {
			if (id === loadId) {
				loadError = 'Failed to load';
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
		if (!hasMore || loadingMore || loading || loadingAll) return;
		loadingMore = true;
		load(false);
	}

	function toggleSelect(id: number) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id); else next.add(id);
		selected = next;
	}

	function deselectAll() { selected = new Set(); }

	async function selectAll() {
		if (loadingAll || loading || loadingMore) return;
		loadingAll = true;
		selected = new Set(allEntities.map((e: any) => e.id));

		const api = tab === 'items' ? items : tools;
		const filters: any = { limit: PAGE_SIZE };
		if (filter === 'labeled') filters.labelPrinted = true;
		else if (filter === 'unlabeled') filters.labelPrinted = false;

		let page = Math.floor(allEntities.length / PAGE_SIZE) + 1;

		while (selected.size < total) {
			if (!loadingAll) return;
			const r = await api.list(undefined, { ...filters, page: page++ });
			allEntities = [...allEntities, ...r.data];
			const next = new Set(selected);
			for (const e of r.data) next.add(e.id);
			selected = next;
		}

		loadingAll = false;
	}

	async function generateAndPrint() {
		const ids = [...selected];
		if (ids.length === 0) return;

		const map = new Map(qrImages);
		const api = tab === 'items' ? items : tools;
		const origin = window.location.origin;

		for (const e of allEntities) {
			if (!selected.has(e.id)) continue;
			if (map.has(e.id)) continue;
			const code = tab === 'items' ? e.itemNumber : e.name;
			const qrUrl = `${origin}/scan?code=${encodeURIComponent(code)}`;
			const dataUrl = await QRCode.toDataURL(qrUrl, { width: 250, margin: 1 });
			map.set(e.id, dataUrl);
		}

		await api.markPrinted(ids).catch(() => {});

		qrImages = map;
		openPrintWindow();
	}

	function openPrintWindow() {
		const win = window.open('', '_blank');
		if (!win) return;
		const rows = allEntities.filter(e => selected.has(e.id));
		win.document.write(`<!DOCTYPE html><html><head><title>QR Code Generator</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Inter, sans-serif; padding: 12px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.label { border: 1px solid #ccc; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; page-break-inside: avoid; break-inside: avoid; }
img { width: 120px; height: 120px; image-rendering: pixelated; }
.code { font-weight: 700; font-size: 12px; }
.desc { font-size: 10px; color: #555; line-height: 1.3; }
@media print { @page { margin: 8mm; } }
</style></head><body><div class="grid">`);
		for (const entity of rows) {
			const code = tab === 'items' ? entity.itemNumber : entity.name;
			const desc = tab === 'items' ? entity.description : entity.name;
			win.document.write(`<div class="label"><img src="${qrImages.get(entity.id)}" alt="QR"><span class="code">${code}</span><span class="desc">${desc ?? ''}</span></div>`);
		}
		win.document.write('</div></body></html>');
		win.document.close();
		win.focus();
		setTimeout(() => win.print(), 300);
	}
</script>

<svelte:head>
	<title>QR Code Generator</title>
</svelte:head>

<div class="page-header">
	<h1>QR Code Generator</h1>
</div>

<div class="card">
	<div class="card-header">
		<h2>
			<span class="segmented">
				<button class="segment" class:active={tab === 'items'} onclick={() => tab = 'items'}>Items</button>
				<button class="segment" class:active={tab === 'tools'} onclick={() => tab = 'tools'}>Tools</button>
			</span>
			<span class="segmented" style="margin-left:1rem">
				<button class="segment" class:active={filter === 'all'} onclick={() => filter = 'all'}>All</button>
				<button class="segment" class:active={filter === 'labeled'} onclick={() => filter = 'labeled'}>Labeled</button>
				<button class="segment" class:active={filter === 'unlabeled'} onclick={() => filter = 'unlabeled'}>Unlabeled</button>
			</span>
		</h2>
		<div class="page-header-actions">
			<button class="btn-ghost btn-sm" onclick={selectAll} disabled={allEntities.length === 0 || loadingAll}>
				{#if loadingAll}<span class="spinner" style="width:14px;height:14px;display:inline-block;vertical-align:middle"></span>{/if}
				Select All
			</button>
			<button class="btn-ghost btn-sm" onclick={deselectAll} disabled={selected.size === 0}>Deselect All</button>
			<button class="btn-primary btn-sm" onclick={generateAndPrint} disabled={selected.size === 0}>
				Generate &amp; Print ({loadingAll ? total : selected.size})
			</button>
		</div>
	</div>

	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell" style="width:5%"></div><div class="sk-cell" style="width:20%"></div><div class="sk-cell" style="width:35%"></div><div class="sk-cell" style="width:15%"></div><div class="sk-cell" style="width:15%"></div></div>
			<div class="sk-row"><div class="sk-cell" style="width:5%"></div><div class="sk-cell" style="width:18%"></div><div class="sk-cell" style="width:40%"></div><div class="sk-cell" style="width:12%"></div><div class="sk-cell" style="width:15%"></div></div>
			<div class="sk-row"><div class="sk-cell" style="width:5%"></div><div class="sk-cell" style="width:22%"></div><div class="sk-cell" style="width:30%"></div><div class="sk-cell" style="width:18%"></div><div class="sk-cell" style="width:12%"></div></div>
		</div>
	{:else if allEntities.length === 0}
		<div class="empty-state">No {filter === 'unlabeled' ? 'unlabeled' : filter === 'labeled' ? 'labeled' : ''} items found.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th style="width:40px">
							<input type="checkbox" checked={selected.size === allEntities.length && allEntities.length > 0}
								onchange={(e) => (e.target as HTMLInputElement).checked ? selectAll() : deselectAll()} disabled={loadingAll} style="width:auto" />
						</th>
						<th>{tab === 'items' ? 'Item #' : 'Name'}</th>
						<th>{tab === 'items' ? 'Description' : 'Description'}</th>
						<th>{tab === 'items' ? 'Category' : 'HE #'}</th>
						<th>Location</th>
					</tr>
				</thead>
				<tbody>
					{#each allEntities as e}
						<tr class:selected={selected.has(e.id)}>
							<td><input type="checkbox" checked={selected.has(e.id)} onchange={() => toggleSelect(e.id)} disabled={loadingAll} style="width:auto" /></td>
							<td>{tab === 'items' ? e.itemNumber : e.name}</td>
							<td>{tab === 'items' ? e.description : e.description}</td>
							<td>{tab === 'items' ? (e.category?.name ?? '-') : (e.heNumber ?? '-')}</td>
							<td>{e.location?.name ?? '-'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="load-status">
			{#if loadingMore}
				<span class="spinner" style="width:16px;height:16px"></span>
				<span>Loading more...</span>
			{:else if loadError}
				<span style="color:var(--red)">{loadError}</span>
			{:else if !hasMore}
				<span>Showing all {total} {tab}</span>
			{/if}
		</div>
		<div use:observeSentinel style="height:1px"></div>
	{/if}
</div>

<style>
	tr.selected td {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}
</style>
