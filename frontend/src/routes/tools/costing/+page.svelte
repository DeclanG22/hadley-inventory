<script lang="ts">
	import { goto } from '$app/navigation';
	import { tools } from '$lib/api';

	let records = $state<any[]>([]);
	let loading = $state(true);

	let dateFrom = $state('');
	let dateTo = $state('');

	let totalCostSum = $derived.by(() => {
		let sum = 0;
		for (const r of records) {
			if (r.cost) sum += Number(r.cost);
		}
		return sum;
	});

	function load() {
		loading = true;
		tools.costing({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
			.then(d => records = d)
			.finally(() => loading = false);
	}
	$effect(load);

	function clearFilters() {
		dateFrom = '';
		dateTo = '';
		load();
	}

	function exportRecords() {
		const rows = [['Date','Tool #','Name','Type','Description','By','Cost']];
		for (const r of records) {
			const d = new Date(r.date).toLocaleDateString();
			const cost = r.cost ? Number(r.cost).toFixed(2) : '';
			rows.push([d, r.toolNumber, r.toolName, r.type, r.description, r.performedBy ?? '', cost]);
		}
		const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `tool_costing_${new Date().toISOString().slice(0,10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function exportSummary() {
		const rows = [['Date From','Date To','Total Cost']];
		rows.push([dateFrom || 'Any', dateTo || 'Any', totalCostSum.toFixed(2)]);
		const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `tool_costing_summary_${new Date().toISOString().slice(0,10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="page-header">
	<h1>Costing</h1>
	<div style="display:flex;gap:6px;align-items:center">
		<span style="font-size:18px;font-weight:500;color:var(--text-primary)">
			${totalCostSum.toFixed(2)}
		</span>
		<button class="btn-ghost btn-sm" onclick={exportSummary} disabled={records.length === 0}>
			Export Summary
		</button>
		<button class="btn-ghost btn-sm" onclick={exportRecords} disabled={records.length === 0}>
			Export Records
		</button>
	</div>
</div>

<div class="card">
	<div class="filter-bar">
		<input type="date" bind:value={dateFrom} placeholder="From" title="From date" style="width:130px" />
		<input type="date" bind:value={dateTo} placeholder="To" title="To date" style="width:130px" />
		<button class="btn-ghost btn-sm" onclick={load}>Filter</button>
		<button class="btn-ghost btn-sm" onclick={clearFilters}>Clear</button>
	</div>

	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:20%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:25%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:22%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:28%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:13%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:35%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:24%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:22%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div></div>
		</div>
	{:else if records.length === 0}
		<div class="empty-state">No records found.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Tool #</th>
						<th>Name</th>
						<th>Type</th>
						<th>Description</th>
						<th>By</th>
						<th>Cost</th>
					</tr>
				</thead>
				<tbody>
					{#each records as r}
						<tr onclick={() => goto(`/tools/${r.toolId}`)}>
							<td style="white-space:nowrap">{new Date(r.date).toLocaleDateString()}</td>
							<td><a href="/tools/{r.toolId}" onclick={(e) => e.stopPropagation()}>{r.toolNumber}</a></td>
							<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{r.toolName}</td>
							<td>
								<span style="color:var(--{r.type === 'purchase' ? 'blue' : r.type === 'repair' ? 'red' : r.type === 'service' ? 'orange' : r.type === 'calibration' ? 'yellow' : 'green'});font-weight:500">
									{r.type}
								</span>
							</td>
							<td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{r.description}</td>
							<td>{r.performedBy ?? '-'}</td>
							<td style="font-weight:500">{r.cost ? `$${Number(r.cost).toFixed(2)}` : '-'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div style="padding:10px 6px;font-size:13px;color:var(--empty-text-primary);text-align:right">
			{records.length} records &middot; Total: <strong style="color:var(--text-primary)">${totalCostSum.toFixed(2)}</strong>
		</div>
	{/if}
</div>
