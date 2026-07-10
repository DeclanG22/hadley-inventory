<script lang="ts">
	import { goto } from '$app/navigation';
	import { stockTakes } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';

	let list = $state<any[]>([]);
	let loading = $state(true);

	function load() {
		loading = true;
		stockTakes.list().then(l => list = l).finally(() => loading = false);
	}
	$effect(load);

	async function remove(id: number) {
		if (!confirm('Delete this stock take?')) return;
		try {
			await stockTakes.remove(id);
			load();
			addToast('Stock take deleted', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}
</script>

<div class="page-header">
	<h1>Stock Takes</h1>
	<a href="/stock-takes/new" class="btn btn-primary">+ New Stock Take</a>
</div>

<div class="card">
	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:35%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:40%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:8%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:38%"></div><div class="sk-cell sk" style="width:8%"></div></div>
		</div>
	{:else if list.length === 0}
		<div class="empty-state">No stock takes yet.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead><tr><th>Date</th><th>Status</th><th>Items Counted</th><th>Notes</th><th></th></tr></thead>
				<tbody>
					{#each list as st}
						<tr onclick={() => goto(`/stock-takes/${st.id}`)}>
							<td><a href="/stock-takes/{st.id}" onclick={(e) => e.stopPropagation()}>{new Date(st.date).toLocaleDateString()}</a></td>
							<td><span class="badge badge-{st.status}">{st.status}</span></td>
							<td>{st._count.items}</td>
							<td>{st.notes ?? '-'}</td>
							<td><button class="btn-del btn-sm" onclick={(e) => { e.stopPropagation(); remove(st.id); }}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
