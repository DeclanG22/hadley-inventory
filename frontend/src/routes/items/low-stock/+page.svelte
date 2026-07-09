<script lang="ts">
	import { items } from '$lib/api';

	let list = $state<any[]>([]);

	function load() { items.lowStock().then(l => list = l); }
	$effect(load);
</script>

<div class="page-header">
	<h1>Low Stock Items</h1>
	<a href="/items" class="btn-ghost btn-sm">All Items</a>
</div>

<div class="card">
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
					<tr>
						<td><a href="/items/{i.id}">{i.itemNumber}</a></td>
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
	{#if list.length === 0}
		<div class="empty-state">All items are above their minimum stock levels.</div>
	{/if}
</div>
