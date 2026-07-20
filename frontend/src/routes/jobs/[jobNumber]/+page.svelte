<script lang="ts">
	import { goto } from '$app/navigation';
	import { jobs } from '$lib/api';
	let { params } = $props();

	let data = $state<any>(null);
	let loading = $state(true);

	$effect(() => {
		loading = true;
		jobs.get(params.jobNumber).then(d => data = d).finally(() => loading = false);
	});

	let totalCost = $derived(data?.itemTxns?.reduce((s: number, t: any) => {
		const up = Number(t.unitPrice ?? t.item?.unitPrice) || 0;
		return s + (t.totalCost ? Number(t.totalCost) : up ? Math.abs(t.quantityInOut) * up : 0);
	}, 0) ?? 0);
</script>

<div class="page-header">
	<div>
		<h1>Job {params.jobNumber}</h1>
		<p style="color:var(--text-secondary);font-size:13px;margin-top:2px">
			{data?.itemTxns?.length ?? 0} item transaction(s) &middot;
			{data?.toolCheckouts?.length ?? 0} tool checkout(s)
		</p>
	</div>
</div>

{#if loading}
	<div class="card" style="margin-top:0"><div class="sk-table">
		<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div></div>
		<div class="sk-row"><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:22%"></div><div class="sk-cell sk" style="width:25%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div></div>
		<div class="sk-row"><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:20%"></div><div class="sk-cell sk" style="width:28%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div></div>
	</div></div>
{:else}
	<!-- Item Transactions -->
	<div class="card" style="margin-top:0">
		<div class="card-header"><h2>Item Transactions</h2></div>
		{#if data.itemTxns.length === 0}
			<div class="empty-state">No item transactions for this job.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead><tr><th>Date</th><th>Item #</th><th>Description</th><th>Qty</th><th>In/Out</th><th>Total Cost</th></tr></thead>
					<tbody>
						{#each data.itemTxns as t}
							<tr onclick={() => goto(`/items/${t.item.id}`)}>
								<td style="white-space:nowrap">{new Date(t.date).toLocaleDateString()}</td>
								<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><a href="/items/{t.item.id}" onclick={(e) => e.stopPropagation()}>{t.item.itemNumber}</a></td>
								<td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{t.item.description}</td>
								<td>{Math.abs(t.quantityInOut)}</td>
								<td>
									<span style="color:var({t.quantityInOut > 0 ? '--green' : '--red'});font-weight:500">
										{t.quantityInOut > 0 ? 'In' : 'Out'}
									</span>
								</td>
								<td style="font-weight:500">{t.totalCost ? `$${Number(t.totalCost).toFixed(2)}` : '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div style="padding:10px 6px;font-size:13px;color:var(--text-secondary);text-align:right">
				Item total: <strong style="color:var(--text-primary)">${totalCost.toFixed(2)}</strong>
			</div>
		{/if}
	</div>

	<!-- Tool Checkouts -->
	<div class="card" style="margin-top:10px">
		<div class="card-header"><h2>Tool Checkouts</h2></div>
		{#if data.toolCheckouts.length === 0}
			<div class="empty-state">No tool checkouts for this job.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead><tr><th>Tool #</th><th>Name</th><th>Checked Out By</th><th>Checked Out</th><th>Returned</th></tr></thead>
					<tbody>
						{#each data.toolCheckouts as co}
							<tr onclick={() => goto(`/tools/${co.tool.id}`)}>
								<td><a href="/tools/{co.tool.id}" onclick={(e) => e.stopPropagation()}>{co.tool.toolNumber}</a></td>
								<td>{co.tool.name}</td>
								<td>{co.checkedOutBy}</td>
								<td style="white-space:nowrap">{new Date(co.checkedOutAt).toLocaleDateString()}</td>
								<td style="white-space:nowrap">{co.checkedInAt ? new Date(co.checkedInAt).toLocaleDateString() : 'Out'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}
