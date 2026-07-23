<script lang="ts">
	import { goto } from '$app/navigation';
	import { locations } from '$lib/api';
	let { params } = $props();

	let location = $state<any>(null);
	let loading = $state(true);

	$effect(() => {
		locations.get(Number(params.id)).then(l => location = l).finally(() => loading = false);
	});
</script>

<div class="page-header">
	<h1>{location?.name ?? 'Loading...'}</h1>
</div>

{#if loading}
	<div class="sk-table">
		<div class="sk-row"><div class="sk-cell" style="width:10%"></div><div class="sk-cell" style="width:30%"></div><div class="sk-cell" style="width:15%"></div><div class="sk-cell" style="width:15%"></div><div class="sk-cell" style="width:10%"></div></div>
		<div class="sk-row"><div class="sk-cell" style="width:10%"></div><div class="sk-cell" style="width:35%"></div><div class="sk-cell" style="width:12%"></div><div class="sk-cell" style="width:18%"></div><div class="sk-cell" style="width:10%"></div></div>
	</div>
{:else if !location}
	<div class="empty-state">Location not found.</div>
{:else}
<div class="cards">
	<div class="card">
		<div class="card-header"><h2>Items ({location.items.length})</h2></div>
		{#if location.items.length === 0}
			<div class="empty-state">No items at this location.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Item #</th>
							<th>Description</th>
							<th>Category</th>
							<th>Sub-Category</th>
							<th>Vendor</th>
							<th>On Hand</th>
						</tr>
					</thead>
					<tbody>
						{#each location.items as i}
							<tr onclick={() => goto(`/items/${i.id}`)}>
								<td><a href="/items/{i.id}" onclick={(e) => e.stopPropagation()}>{i.itemNumber}</a></td>
								<td>{i.description}</td>
								<td>{i.category?.name ?? '-'}</td>
								<td>{i.subCategory?.name ?? '-'}</td>
								<td>{i.vendor?.name ?? '-'}</td>
								<td>{i.onHand}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<div class="card">
		<div class="card-header"><h2>Tools ({location.tools.length})</h2></div>
		{#if location.tools.length === 0}
			<div class="empty-state">No tools at this location.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Description</th>
							<th>Serial #</th>
							<th>HE #</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each location.tools as t}
							{@const checkedOut = t.checkouts?.length > 0}
							<tr onclick={() => goto(`/tools/${t.id}`)}>
								<td><a href="/tools/{t.id}" onclick={(e) => e.stopPropagation()}>{t.name}</a></td>
								<td>{t.description ?? '-'}</td>
								<td>{t.serialNumber ?? '-'}</td>
								<td>{t.heNumber ?? '-'}</td>
								<td>
									{#if t.decommissionedAt}
										<span class="badge badge-decommissioned">Decommissioned</span>
									{:else if checkedOut}
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
</div>
{/if}

<style>
    .cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
</style>
