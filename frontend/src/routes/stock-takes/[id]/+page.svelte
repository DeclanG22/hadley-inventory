<script lang="ts">
	import { stockTakes } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';
	import { confirm } from '$lib/confirmDialog.svelte';
	let { params } = $props();

	let st = $state<any>(null);
	let loading = $state(true);
	let reconciling = $state(false);
	let search = $state('');

	function load() {
		loading = true;
		stockTakes.get(Number(params.id)).then(d => st = d).finally(() => loading = false);
	}
	$effect(load);

	async function saveItem(itemId: number) {
		const si = st.items.find((i: any) => i.itemId === itemId);
		if (si.physicalQty === null || si.physicalQty === undefined) return;
		const val = Number(si.physicalQty);
		if (isNaN(val) || val < 0) return;
		try {
			await stockTakes.updateItem(st.id, itemId, { physicalQty: val, notes: si.notes || undefined });
			addToast('Count saved', 'success');
		} catch (err: any) { addToast(err.message, 'error'); }
	}

	async function doReconcile() {
		if (!await confirm('Reconcile stock take?', 'Apply all adjustments and mark as completed?')) return;
		reconciling = true;
		try {
			st = await stockTakes.reconcile(st.id);
			addToast('Stock take completed', 'success');
		} catch (err: any) { addToast(err.message, 'error'); }
		finally { reconciling = false; }
	}

	function variance(si: any) {
		if (si.physicalQty === null || si.physicalQty === undefined) return null;
		return si.physicalQty - si.systemQty;
	}

	let filteredItems = $derived(st ? st.items.filter((i: any) => {
		if (!search) return true;
		const q = search.toLowerCase();
		return i.item.itemNumber.toLowerCase().includes(q) || i.item.description.toLowerCase().includes(q);
	}) : []);

	let countedCount = $derived(st ? st.items.filter((i: any) => i.physicalQty !== null).length : 0);
	let hasVariance = $derived(st ? st.items.some((i: any) => {
		if (i.physicalQty === null || i.physicalQty === undefined) return false;
		return i.physicalQty !== i.systemQty;
	}) : false);

	let filteredCounted = $derived(filteredItems.filter((i: any) => i.physicalQty !== null).length);
</script>

{#if !st}
	<div class="card"><div class="sk-detail">
		<div class="sk-line sk" style="width:30%;height:24px"></div>
		<div class="sk-line sk" style="width:50%"></div>
		<div style="height:20px"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:60%"></div>
	</div></div>
{:else}
	<div class="page-header">
		<div>
			<h1>Stock Take — {new Date(st.date).toLocaleDateString()}</h1>
			<p style="color:var(--text-secondary);font-size:13px;margin-top:2px">
				Status: <span class="badge badge-{st.status}">{st.status}</span> &middot;
				{countedCount} of {st.items.length} items counted
				{#if hasVariance}&middot; <span style="color:var(--red)">Variances detected</span>{/if}
			</p>
		</div>
		<div class="page-header-actions" style="display:flex;gap:6px">
			{#if st.status === 'draft'}
				<button class="btn btn-primary" onclick={doReconcile} disabled={reconciling || countedCount === 0}>
					{reconciling ? 'Reconciling...' : 'Reconcile & Apply'}
				</button>
			{/if}
		</div>
	</div>

	{#if st.notes}
		<p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">{st.notes}</p>
	{/if}

	<div class="card" style="margin-top:0">
		<div style="display:flex;gap:8px;align-items:center;padding:0 0 8px">
			<input type="search" bind:value={search} placeholder="Search items by # or description..." style="flex:1;min-width:140px" />
			<span style="font-size:12px;color:var(--text-secondary);white-space:nowrap">{filteredCounted}/{filteredItems.length} counted</span>
		</div>
		{#if filteredItems.length === 0}
			<div class="empty-state">No items match your search.</div>
		{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Item #</th>
						<th>Description</th>
						<th>System Qty</th>
						<th>Physical Qty</th>
						<th>Variance</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredItems as si}
						<tr>
							<td><a href="/items/{si.item.id}">{si.item.itemNumber}</a></td>
							<td>{si.item.description}</td>
							<td>{si.systemQty}</td>
							<td>
								{#if st.status === 'draft'}
									<input type="number" min="0"
										bind:value={si.physicalQty}
										onchange={() => saveItem(si.itemId)}
										style="width:80px"
										placeholder="—"
									/>
								{:else}
									{si.physicalQty ?? '—'}
								{/if}
							</td>
							<td>
								{#if si.physicalQty !== null}
									{@const v = si.physicalQty - si.systemQty}
									{#if v === 0}
										<span style="color:var(--text-secondary)">0</span>
									{:else}
										<span style="color:{v > 0 ? 'var(--green)' : 'var(--red)'};font-weight:500">{v > 0 ? '+' : ''}{v}</span>
									{/if}
								{:else}
									—
								{/if}
							</td>
							<td>
								{#if st.status === 'draft'}
									<input bind:value={si.notes} onchange={() => saveItem(si.itemId)} placeholder="—" style="width:120px" />
								{:else}
									{si.notes ?? '—'}
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{/if}
	</div>
{/if}
