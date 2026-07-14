<script lang="ts">
	import { goto } from '$app/navigation';
	import { toolCategories } from '$lib/api';
	let { params } = $props();

	let cat = $state<any>(null);
	let loading = $state(true);

	$effect(() => {
		toolCategories.get(Number(params.id)).then(c => cat = c).finally(() => loading = false);
	});
</script>

<div class="page-header">
	<h1>{cat?.name ?? 'Loading...'}</h1>
</div>

<div class="card">
	<div class="card-header"><h2>Tools ({cat?.tools?.length ?? 0})</h2></div>
	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell" style="width:12%"></div><div class="sk-cell" style="width:30%"></div><div class="sk-cell" style="width:15%"></div><div class="sk-cell" style="width:15%"></div><div class="sk-cell" style="width:10%"></div></div>
		</div>
	{:else if !cat?.tools?.length}
		<div class="empty-state">No tools in this category.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Tool #</th>
						<th>Name</th>
						<th>Brand</th>
						<th>Location</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each cat.tools as t}
						{@const checkedOut = t.checkouts?.length > 0}
						<tr onclick={() => goto(`/tools/${t.id}`)}>
							<td><a href="/tools/{t.id}" onclick={(e) => e.stopPropagation()}>{t.toolNumber}</a></td>
							<td>{t.name}</td>
							<td>{t.brand ?? '-'}</td>
							<td>{t.location?.name ?? '-'}</td>
							<td>
								{#if checkedOut}
									<span class="badge badge-checked-out">Checked Out</span>
								{:else}
									<span class="badge badge-available">Available</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
