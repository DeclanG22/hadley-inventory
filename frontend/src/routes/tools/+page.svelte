<script lang="ts">
	import { goto } from '$app/navigation';
	import { tools } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';

	let list = $state<any[]>([]);
	let search = $state('');
	let loading = $state(true);

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
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Tool #</th>
						<th>Name</th>
						<th>Brand</th>
						<th>Model</th>
						<th>Category</th>
						<th>Status</th>
						<th></th>
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
							<td><button class="btn-ghost btn-sm" onclick={(e) => { e.stopPropagation(); remove(t.id); }}>Delete</button></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
