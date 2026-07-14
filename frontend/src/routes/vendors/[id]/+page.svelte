<script lang="ts">
	import { goto } from '$app/navigation';
	import { vendors, items } from '$lib/api';
	let { params } = $props();

	let vendor = $state<any>(null);
	let loading = $state(true);

	$effect(() => {
		vendors.get(Number(params.id)).then(v => vendor = v).finally(() => loading = false);
	});
</script>

<div class="page-header">
	<h1>{vendor?.name ?? 'Loading...'}</h1>
</div>

<div class="card">
	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell" style="width:10%"></div><div class="sk-cell" style="width:30%"></div><div class="sk-cell" style="width:20%"></div><div class="sk-cell" style="width:15%"></div><div class="sk-cell" style="width:10%"></div><div class="sk-cell" style="width:15%"></div></div>
			<div class="sk-row"><div class="sk-cell" style="width:10%"></div><div class="sk-cell" style="width:35%"></div><div class="sk-cell" style="width:15%"></div><div class="sk-cell" style="width:18%"></div><div class="sk-cell" style="width:10%"></div><div class="sk-cell" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell" style="width:10%"></div><div class="sk-cell" style="width:25%"></div><div class="sk-cell" style="width:22%"></div><div class="sk-cell" style="width:12%"></div><div class="sk-cell" style="width:10%"></div><div class="sk-cell" style="width:16%"></div></div>
		</div>
	{:else if !vendor}
		<div class="empty-state">Vendor not found.</div>
	{:else if vendor.items.length === 0}
		<div class="empty-state">No items from this vendor.</div>
	{:else}
		<div class="card-header"><h2>Items ({vendor.items.length})</h2></div>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Item #</th>
						<th>Description</th>
						<th>Category</th>
						<th>Location</th>
						<th>On Hand</th>
					</tr>
				</thead>
				<tbody>
					{#each vendor.items as i}
						<tr onclick={() => goto(`/items/${i.id}`)}>
							<td><a href="/items/{i.id}" onclick={(e) => e.stopPropagation()}>{i.itemNumber}</a></td>
							<td>{i.description}</td>
							<td>{i.category?.name ?? '-'}</td>
							<td>{i.location?.name ?? '-'}</td>
							<td>{i.onHand}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
