<script lang="ts">
	import { goto } from '$app/navigation';
	import { tools } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';

	let list = $state<any[]>([]);
	let search = $state('');
	let loading = $state(true);
	let viewMode = $state<'table' | 'cards'>('table');

	function load() {
		if (list.length === 0) loading = true;
		tools.list(search || undefined).then(l => list = l).finally(() => loading = false);
	}
	$effect(load);

	function remove(id: number) {
		if (!confirm('Delete this tool?')) return;
		tools.remove(id).then(() => { load(); addToast('Tool deleted', 'success'); }).catch(e => addToast(e.message, 'error'));
	}

	function status(t: any): string {
		return t.checkouts?.length > 0 ? 'Checked Out' : 'Available';
	}
</script>

<div class="page-header">
	<h1>Tools</h1>
	<div style="display:flex;gap:6px">
		<div class="segmented">
			<button type="button" class="segment" class:active={viewMode === 'table'} onclick={() => viewMode = 'table'}>Table</button>
			<button type="button" class="segment" class:active={viewMode === 'cards'} onclick={() => viewMode = 'cards'}>Cards</button>
		</div>
		<a href="/tools/new" class="btn btn-primary">+ New Tool</a>
		<a href="/tools/batch" class="btn">Batch</a>
	</div>
</div>

<div class="card">
	<div class="search-bar">
		<input type="search" bind:value={search} placeholder="Search tools by number, name, brand, or model..." oninput={load} />
	</div>
	{#if loading && list.length === 0}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:25%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:22%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:11%"></div><div class="sk-cell sk" style="width:28%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:13%"></div><div class="sk-cell sk" style="width:26%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:8%"></div></div>
		</div>
	{:else if list.length === 0}
		<div class="empty-state">No tools found.</div>
	{:else if viewMode === 'table'}
		<div class="table-wrap">
			<table style="table-layout:fixed">
				<thead>
					<tr>
						<th style="width:180px">Tool #</th>
						<th style="width:auto">Name</th>
						<th style="width:120px">Brand</th>
						<th style="width:120px">Model</th>
						<th style="width:120px">Category</th>
						<th style="width:100px">Status</th>
						<th style="width:40px"></th>
					</tr>
				</thead>
				<tbody>
					{#each list as t}
						<tr onclick={() => goto(`/tools/${t.id}`)}>
							<td>
								{#if t.imageUrl}
									<img src={t.imageUrl} alt="" class="item-thumb" />
								{/if}
								<a href="/tools/{t.id}" onclick={(e) => e.stopPropagation()}>{t.toolNumber}</a>
							</td>
							<td>{t.name}</td>
							<td>{t.brand ?? '-'}</td>
							<td>{t.model ?? '-'}</td>
							<td>{t.category?.name ?? '-'}</td>
							<td><span class="badge {status(t) === 'Checked Out' ? 'badge-checked-out' : 'badge-available'}">{status(t)}</span></td>
							<td><button class="btn-del btn-sm" onclick={(e) => { e.stopPropagation(); remove(t.id); }}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="card-grid">
			{#each list as t}
				<div class="tool-card" role="button" tabindex={0} onclick={() => goto(`/tools/${t.id}`)} onkeydown={(e) => e.key === 'Enter' && goto(`/tools/${t.id}`)}>
					{#if t.imageUrl}
						<img src={t.imageUrl} alt="" class="tool-card-img" />
					{/if}
					<div class="tool-card-body">
						<div class="tool-card-header">
							<div class="tool-card-title">{t.toolNumber}</div>
							<span class="badge {status(t) === 'Checked Out' ? 'badge-checked-out' : 'badge-available'}">{status(t)}</span>
						</div>
						<div class="tool-card-name">{t.name}</div>
						<div class="tool-card-meta">
							<span>Brand: <strong>{t.brand ?? '-'}</strong></span>
							<span>Model: <strong>{t.model ?? '-'}</strong></span>
							<span>Category: <strong>{t.category?.name ?? '-'}</strong></span>
						</div>
					</div>
					<button class="btn-del btn-sm tool-card-del" onclick={(e) => { e.stopPropagation(); remove(t.id); }}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button>
				</div>
			{/each}
		</div>
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

	.tool-card-name {
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
</style>
