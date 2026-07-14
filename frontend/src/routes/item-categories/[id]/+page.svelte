<script lang="ts">
	import { goto } from '$app/navigation';
	import { itemCategories } from '$lib/api';
	let { params } = $props();

	let cat = $state<any>(null);
	let loading = $state(true);
	let filterSubCatId = $state<number | null>(null);

	let sortedItems = $derived(
		cat?.items?.slice().sort((a: any, b: any) => {
			const sa = a.subCategory?.name ?? '';
			const sb = b.subCategory?.name ?? '';
			if (sa && !sb) return -1;
			if (!sa && sb) return 1;
			return sa.localeCompare(sb) || a.itemNumber.localeCompare(b.itemNumber);
		}) ?? []
	);

	let filteredItems = $derived(
		filterSubCatId == null
			? sortedItems
			: sortedItems.filter((i: any) => i.subCategory?.id === filterSubCatId)
	);

	$effect(() => {
		itemCategories.get(Number(params.id)).then(c => cat = c).finally(() => loading = false);
	});
</script>

<div class="page-header">
	<h1>{cat?.name ?? 'Loading...'}</h1>
</div>
<div class="cards">
<div class="card">
	<div class="card-header"><h2>Sub-Categories</h2></div>
	{#if loading}
		<div class="sk-table"><div class="sk-row"><div class="sk-cell sk" style="width:30%"></div></div></div>
	{:else if !cat?.subCategories?.length}
		<div class="empty-state">No sub-categories.</div>
	{:else}
		<div class="sub-list">
			{#each cat.subCategories as sub}
				<button class="sub-item" class:active={filterSubCatId === sub.id} onclick={() => filterSubCatId = filterSubCatId === sub.id ? null : sub.id}>
					{sub.name}
					{#if filterSubCatId === sub.id}<span class="sub-x">✕</span>{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<div class="card">
	<div class="card-header"><h2>Items ({filteredItems?.length ?? 0})</h2></div>
	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell" style="width:12%"></div><div class="sk-cell" style="width:35%"></div><div class="sk-cell" style="width:15%"></div><div class="sk-cell" style="width:15%"></div><div class="sk-cell" style="width:10%"></div></div>
		</div>
	{:else if !filteredItems?.length}
		<div class="empty-state">No items in this category.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Item #</th>
						<th>Description</th>
						<th>Sub-Category</th>
						<th>Location</th>
						<th>Vendor</th>
						<th>On Hand</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredItems as i}
						<tr onclick={() => goto(`/items/${i.id}`)}>
							<td><a href="/items/{i.id}" onclick={(e) => e.stopPropagation()}>{i.itemNumber}</a></td>
							<td>{i.description}</td>
							<td>
								{#if i.subCategory}
									<span class="badge badge-sub">{i.subCategory.name}</span>
								{:else}
									-
								{/if}
							</td>
							<td>{i.location?.name ?? '-'}</td>
							<td>{i.vendor?.name ?? '-'}</td>
							<td>{i.onHand}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
</div>

<style>
	.badge-sub {
		background: color-mix(in srgb, var(--gray) 20%, transparent);
		color: var(--gray);
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
		white-space: nowrap;
	}
	.sub-item.active {
		background: var(--accent);
		color: var(--bg-primary);
		border-color: var(--accent);
	}
	.sub-x {
		margin-left: 4px;
		font-size: 10px;
		opacity: 0.7;
	}
</style>
