<script lang="ts">
	import { goto } from '$app/navigation';
	import { items } from '$lib/api';

	let txns = $state<any[]>([]);
	let loading = $state(true);

	let jobNumber = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let filterDirection = $state('all');

	let filtered = $derived.by(() => {
		let f = txns;
		if (filterDirection === 'in') f = f.filter((t: any) => t.quantityInOut > 0);
		else if (filterDirection === 'out') f = f.filter((t: any) => t.quantityInOut < 0);
		return f;
	});

	let totalCostSum = $derived.by(() => {
		let sum = 0;
		for (const t of filtered) {
			const up = Number(t.unitPrice ?? t.item?.unitPrice) || 0;
			const cost = t.totalCost ? Number(t.totalCost) : up ? Math.abs(t.quantityInOut) * up : 0;
			sum += cost;
		}
		return sum;
	});

	function load() {
		loading = true;
		items.transactions.all({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, jobNumber: jobNumber || undefined })
			.then(d => txns = d)
			.finally(() => loading = false);
	}
	$effect(load);

	function clearFilters() {
		jobNumber = '';
		dateFrom = '';
		dateTo = '';
		filterDirection = 'all';
		load();
	}

	function exportRecords() {
		const rows = [['Date','Item #','Description','Analysis Code','Job #','Qty In/Out','Unit Price','Total Cost','Notes']];
		for (const t of filtered) {
			const d = new Date(t.date).toLocaleDateString();
			const qty = t.quantityInOut;
			const price = t.unitPrice ? Number(t.unitPrice).toFixed(2) : '';
			const cost = t.totalCost ? Number(t.totalCost).toFixed(2) : '';
			rows.push([d, t.item.itemNumber, t.item.description, t.item.analysisCode ?? '', t.jobNumber ?? '', String(qty), price, cost, t.notes ?? '']);
		}
		const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `costing_records_${new Date().toISOString().slice(0,10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function exportSummary() {
		const jobs = [...new Set(filtered.map((t: any) => t.jobNumber).filter(Boolean))];
		const rows = [['Job #','Date From','Date To','Total Cost']];
		rows.push([jobs.length ? jobs.join(', ') : '(none)', dateFrom || 'Any', dateTo || 'Any', totalCostSum.toFixed(2)]);
		const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `costing_summary_${new Date().toISOString().slice(0,10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="page-header">
	<h1>Costing</h1>
	<div style="display:flex;gap:6px;align-items:center">
		<span style="font-size:18px;font-weight:500;color:var(--text-primary)">
			${(totalCostSum ?? 0).toFixed(2)}
		</span>
		<button class="btn-ghost btn-sm" onclick={exportSummary} disabled={filtered.length === 0}>
			Export Summary
		</button>
		<button class="btn-ghost btn-sm" onclick={exportRecords} disabled={filtered.length === 0}>
			Export Records
		</button>
	</div>
</div>

<div class="card">
	<div class="filter-bar">
		<input type="search" bind:value={jobNumber} placeholder="Job #" style="flex:1;min-width:120px" />
		<input type="date" bind:value={dateFrom} placeholder="From" title="From date" style="width:130px" />
		<input type="date" bind:value={dateTo} placeholder="To" title="To date" style="width:130px" />
		<select bind:value={filterDirection} style="width:75px">
			<option value="all">All</option>
			<option value="in">In</option>
			<option value="out">Out</option>
		</select>
		<button class="btn-ghost btn-sm" onclick={load}>Filter</button>
		<button class="btn-ghost btn-sm" onclick={clearFilters}>Clear</button>
	</div>

	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:28%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:32%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:25%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:22%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:8%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:12%"></div></div>
		</div>
	{:else if txns.length === 0}
		<div class="empty-state">No transactions found.</div>
	{:else if filtered.length === 0}
		<div class="empty-state">No transactions match the filter.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Item #</th>
						<th>Description</th>
						<th>Analysis Code</th>
						<th style="width:120px">Job #</th>
						<th>Qty</th>
						<th>In/Out</th>
						<th>Unit Price</th>
						<th>Total Cost</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as t}
						<tr onclick={() => goto(`/items/${t.item.id}`)}>
							<td style="white-space:nowrap">{new Date(t.date).toLocaleDateString()}</td>
							<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><a href="/items/{t.item.id}" onclick={(e) => e.stopPropagation()}>{t.item.itemNumber}</a></td>
							<td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{t.item.description}</td>
							<td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{t.item.analysisCode ?? '-'}</td>
							<td>
								{#if t.jobNumber}
									<a href="/jobs/{t.jobNumber}" class="job-pill" onclick={(e) => e.stopPropagation()}>{t.jobNumber}</a>
								{:else}-
								{/if}
							</td>
							<td>{Math.abs(t.quantityInOut)}</td>
							<td>
								<span style="color:var({t.quantityInOut > 0 ? '--green' : '--red'});font-weight:500">
									{t.quantityInOut > 0 ? 'In' : 'Out'}
								</span>
							</td>
							<td>{t.unitPrice || t.item?.unitPrice ? `$${Number(t.unitPrice ?? t.item.unitPrice).toFixed(2)}` : '-'}</td>
							<td style="font-weight:500">{t.totalCost ? `$${Number(t.totalCost).toFixed(2)}` : t.unitPrice || t.item?.unitPrice ? `$${(Math.abs(t.quantityInOut) * Number(t.unitPrice ?? t.item.unitPrice)).toFixed(2)}` : '-'}</td>
							<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{t.notes ?? ''}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div style="padding:10px 6px;font-size:13px;color:var(--empty-text-primary);text-align:right">
			{filtered.length} transaction(s) &middot; Total: <strong style="color:var(--text-primary)">${(totalCostSum ?? 0).toFixed(2)}</strong>
		</div>
	{/if}
</div>
