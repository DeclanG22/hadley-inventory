<script lang="ts">
	import { goto } from '$app/navigation';
	import { items } from '$lib/api';

	let list = $state<any[]>([]);
	let loading = $state(true);

	function load() { loading = true; items.lowStock().then(l => list = l).finally(() => loading = false); }
	$effect(load);
</script>

<div class="page-header">
	<h1>Low Stock Items</h1>
	<a href="/items" class="btn-ghost btn-sm">All Items</a>
</div>

<div class="card">
	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:35%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:10%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:40%"></div><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:10%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:10%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:38%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:10%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:32%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:10%"></div></div>
		</div>
	{:else if list.length === 0}
		<div class="empty-state">All items are above their minimum stock levels.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Item #</th>
						<th>Description</th>
						<th>Category</th>
						<th>On Hand</th>
						<th>Min Stock</th>
						<th>Unit</th>
					</tr>
				</thead>
				<tbody>
					{#each list as i}
						<tr onclick={() => goto(`/items/${i.id}`)}>
							<td><a href="/items/{i.id}" onclick={(e) => e.stopPropagation()}>{i.itemNumber}</a></td>
							<td>{i.description}</td>
							<td>{i.category?.name ?? '-'}</td>
							<td><span class="badge badge-warning">{i.onHand}</span></td>
							<td>{i.minStock}</td>
							<td>{i.unit ?? '-'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
