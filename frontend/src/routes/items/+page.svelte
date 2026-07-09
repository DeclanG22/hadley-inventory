<script lang="ts">
	import { items } from '$lib/api';

	let list = $state<any[]>([]);
	let search = $state('');

	function load() { items.list(search || undefined).then(l => list = l); }
	$effect(load);

	function remove(id: number) {
		if (!confirm('Delete this item?')) return;
		items.remove(id).then(load);
	}
</script>

<div class="page-header">
	<h1>Items</h1>
	<a href="/items/new" class="btn btn-primary">+ New Item</a>
</div>

<div class="card">
	<div class="search-bar">
		<input type="search" bind:value={search} placeholder="Search items by number or description..." oninput={load} />
	</div>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Item #</th>
					<th>Description</th>
					<th>Category</th>
					<th>On Hand</th>
					<th>Unit</th>
					<th>Price</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each list as i}
					<tr>
						<td>
							{#if i.imageUrl}
								<img src={i.imageUrl} alt="" class="item-thumb" />
							{/if}
							<a href="/items/{i.id}">{i.itemNumber}</a>
						</td>
						<td>{i.description}</td>
						<td>{i.category?.name ?? '-'}</td>
						<td>{i.onHand}</td>
						<td>{i.unit ?? '-'}</td>
						<td>{i.unitPrice ? `$${Number(i.unitPrice).toFixed(2)}` : '-'}</td>
						<td><button class="btn-ghost btn-sm" onclick={() => remove(i.id)}>Delete</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if list.length === 0}
		<div class="empty-state">No items found.</div>
	{/if}
</div>
