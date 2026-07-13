<script lang="ts">
	import { items, vendors, locations, itemCategories } from '$lib/api';
	import ItemChart from '$lib/ItemChart.svelte';
	import { addToast } from '$lib/toast.svelte';
	import { confirm } from '$lib/confirmDialog.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	let { params } = $props();

	let item = $state<any>(null);
	let txns = $state<any[]>([]);
	let editing = $state(false);
	let vendorsList = $state<any[]>([]);
	let locationsList = $state<any[]>([]);
	let catsList = $state<any[]>([]);
	let subCats = $state<any[]>([]);

	let form = $state<any>({});

	let txnForm = $state({ jobNumber: '', date: new Date().toISOString().slice(0,10), quantityIn: '', quantityOut: '', unitPrice: '', totalCost: '', notes: '' });

	let filterDateFrom = $state('');
	let filterDateTo = $state('');
	let filterJob = $state('');
	let filterDirection = $state('all');

	let filtered = $derived.by(() => {
		let f = txns;
		if (filterDateFrom) {
			const from = new Date(filterDateFrom);
			f = f.filter((t: any) => new Date(t.date) >= from);
		}
		if (filterDateTo) {
			const to = new Date(filterDateTo);
			to.setDate(to.getDate() + 1);
			f = f.filter((t: any) => new Date(t.date) < to);
		}
		if (filterJob) {
			const q = filterJob.toLowerCase();
			f = f.filter((t: any) => (t.jobNumber ?? '').toLowerCase().includes(q));
		}
		if (filterDirection === 'in') {
			f = f.filter((t: any) => t.quantityInOut > 0);
		} else if (filterDirection === 'out') {
			f = f.filter((t: any) => t.quantityInOut < 0);
		}
		return f;
	});

	function exportCsv() {
		const rows = [['Date','In','Out','Job Number','Unit Price','Total Cost','Notes']];
		for (const t of filtered) {
			const d = new Date(t.date).toLocaleDateString();
			const qIn = t.quantityInOut > 0 ? t.quantityInOut : '';
			const qOut = t.quantityInOut < 0 ? -t.quantityInOut : '';
			const price = t.unitPrice ? Number(t.unitPrice).toFixed(2) : '';
			const cost = t.totalCost ? Number(t.totalCost).toFixed(2) : '';
			rows.push([d, qIn, qOut, t.jobNumber ?? '', price, cost, t.notes ?? '']);
		}
		const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${item.itemNumber}_transactions.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	let totalCostSum = $derived.by(() => {
		let sum = 0;
		for (const t of filtered) {
			const up = Number(t.unitPrice) || 0;
			const cost = t.totalCost ? Number(t.totalCost) : up ? Math.abs(t.quantityInOut) * up : 0;
			sum += cost;
		}
		return sum;
	});

	function exportSummary() {
		const jobs = [...new Set(filtered.map((t: any) => t.jobNumber).filter(Boolean))];
		const rows = [['Job #','Date From','Date To','Total Cost']];
		rows.push([jobs.length ? jobs.join(', ') : '(none)', filterDateFrom || 'Any', filterDateTo || 'Any', totalCostSum.toFixed(2)]);
		const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${item.itemNumber}_summary.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function load() {
		const id = Number(params.id);
		items.get(id).then(i => { item = i; resetForm(i); });
		items.transactions.list(id).then(t => txns = t);
		vendors.list().then(l => vendorsList = l);
		locations.list().then(l => locationsList = l);
		itemCategories.list().then(l => catsList = l);
	}
	$effect(load);

	function resetForm(i: any) {
		form = {
			itemNumber: i.itemNumber, description: i.description,
			unit: i.unit ?? '', unitPrice: i.unitPrice ?? '', weightPerUnit: i.weightPerUnit ?? '',
			analysisCode: i.analysisCode ?? '', headType: i.headType ?? '', imageUrl: i.imageUrl ?? '',
			categoryId: i.categoryId ?? '', subCategoryId: i.subCategoryId ?? '',
			locationId: i.locationId ?? '', vendorId: i.vendorId ?? '',
		onHand: i.onHand ?? '', minStock: i.minStock ?? '',
		};
		if (i.categoryId) itemCategories.subCategories.list(i.categoryId).then(l => subCats = l);
	}

	function onCategoryChange() {
		const id = Number(form.categoryId);
		if (!id) { subCats = []; form.subCategoryId = ''; return; }
		itemCategories.subCategories.list(id).then(l => subCats = l);
	}

	async function save() {
		try {
			const id = Number(params.id);
			const data: any = {};
			for (const [k, v] of Object.entries(form)) {
				if (v === '') continue;
				if (['unitPrice','weightPerUnit'].includes(k)) data[k] = Number(v);
				else if (['categoryId','subCategoryId','locationId','vendorId','onHand','minStock'].includes(k)) data[k] = Number(v);
				else data[k] = v;
			}
			await items.update(id, data);
			editing = false;
			items.get(id).then(i => { item = i; resetForm(i); });
			addToast('Item updated', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	async function addTxn() {
		try {
			const id = Number(params.id);
			const qtyIn = Number(txnForm.quantityIn) || 0;
			const qtyOut = Number(txnForm.quantityOut) || 0;
			if (qtyIn === 0 && qtyOut === 0) return;
			const data: any = { date: txnForm.date, quantityInOut: qtyIn - qtyOut };
			if (txnForm.jobNumber) data.jobNumber = txnForm.jobNumber;
			if (txnForm.unitPrice) data.unitPrice = Number(txnForm.unitPrice);
			if (txnForm.totalCost) data.totalCost = Number(txnForm.totalCost);
			if (txnForm.notes) data.notes = txnForm.notes;
			await items.transactions.create(id, data);
			txnForm = { jobNumber: '', date: new Date().toISOString().slice(0,10), quantityIn: '', quantityOut: '', unitPrice: '', totalCost: '', notes: '' };
			items.get(id).then(i => item = i);
			items.transactions.list(id).then(t => txns = t);
			addToast('Transaction added', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	async function deleteTxn(txnId: number) {
		const ok = await confirm('Delete Transaction', 'This will reverse the quantity change. Are you sure?');
		if (!ok) return;
		try {
			await items.transactions.remove(txnId);
			const id = Number(params.id);
			items.get(id).then(i => item = i);
			items.transactions.list(id).then(t => txns = t);
			addToast('Transaction deleted and quantity reversed', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}
</script>

{#if !item}
	<div class="card"><div class="sk-detail">
		<div class="sk-line sk" style="width:35%;height:24px"></div>
		<div class="sk-line sk" style="width:55%"></div>
		<div class="sk-line sk" style="width:45%"></div>
		<div style="height:20px"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:70%"></div>
	</div></div>
{:else}
	<div class="page-header">
		<div>
			<h1>{item.itemNumber}</h1>
			<p style="color:var(--empty-text-primary);font-size:13px;margin-top:2px">{item.description}</p>
		</div>
		<div class="page-header-actions">
			<div class="stat-card" style="padding:8px 16px;min-width:80px">
				<div class="stat-value" style="font-size:22px">{item.onHand}</div>
				<div class="stat-label">On Hand</div>
			</div>
			<button class="btn-ghost btn-sm" onclick={() => editing = !editing}>{editing ? 'Cancel' : 'Edit'}</button>
		</div>
	</div>

	{#if editing}
		<form class="card" style="margin-top:0" onsubmit={(e) => { e.preventDefault(); save(); }}>
			<div class="card-header"><h2>Edit Item</h2></div>
			<div class="form-grid">
				<div class="full"><label>Item Number</label><input bind:value={form.itemNumber} required /></div>
				<div class="full"><label>Description</label><input bind:value={form.description} required /></div>
<div><label>Unit</label><input bind:value={form.unit} placeholder="Each, Box, etc" /></div>
				<div><label>Unit Price</label><input type="number" step="0.01" bind:value={form.unitPrice} /></div>
				<div><label>Weight/Unit (g)</label><input type="number" step="0.0001" bind:value={form.weightPerUnit} /></div>
				<div><label>Analysis Code</label><input bind:value={form.analysisCode} /></div>
				<div><label>Head Type</label><input bind:value={form.headType} /></div>
				<ImageUpload bind:value={form.imageUrl} label="Image URL" />
				<div><label>Category</label>
					<select bind:value={form.categoryId} onchange={onCategoryChange}>
						<option value="">--</option>
						{#each catsList as c}<option value={c.id}>{c.name}</option>{/each}
					</select>
				</div>
				<div><label>Sub-Category</label>
					<select bind:value={form.subCategoryId}>
						<option value="">--</option>
						{#each subCats as s}<option value={s.id}>{s.name}</option>{/each}
					</select>
				</div>
				<div><label>Location</label>
					<select bind:value={form.locationId}>
						<option value="">--</option>
						{#each locationsList as l}<option value={l.id}>{l.name}</option>{/each}
					</select>
				</div>
				<div><label>Vendor</label>
					<select bind:value={form.vendorId}>
						<option value="">--</option>
						{#each vendorsList as v}<option value={v.id}>{v.name}</option>{/each}
					</select>
				</div>
				<div><label>On Hand</label><input type="number" bind:value={form.onHand} /></div>
				<div><label>Min Stock</label><input type="number" bind:value={form.minStock} placeholder="Low stock alert threshold" /></div>
			</div>
			<button type="submit" style="margin-top:12px">Save Changes</button>
		</form>
	{:else}
		<div class="card" style="margin-top:0">
			<div class="card-header"><h2>Details</h2></div>
			{#if item.imageUrl}
				<img src={item.imageUrl} alt="" class="detail-image" />
			{/if}
			<div class="detail-grid">
				<span>Category:</span><span>{item.category?.name ?? '-'}{item.subCategory ? ` / ${item.subCategory.name}` : ''}</span>
				<span>Head Type:</span><span>{item.headType ?? '-'}</span>
				<span>Unit:</span><span>{item.unit ?? '-'}</span>
				<span>Unit Price:</span><span>{item.unitPrice ? `$${Number(item.unitPrice).toFixed(2)}` : '-'}</span>
				<span>Min Stock:</span><span>{item.minStock ?? '-'}</span>
				<span>Vendor:</span><span>{item.vendor?.name ?? '-'}</span>
			<span>Location:</span><span>{item.location?.name ?? '-'}</span>
			</div>
		</div>
	{/if}

	<div class="card" style="margin-top:10px">
		<div class="card-header"><h2>Stock History Chart</h2></div>
		<ItemChart transactions={txns} />
	</div>

	<div class="card" style="margin-top:10px">
		<div class="card-header"><h2>Record Transaction</h2></div>
		<form onsubmit={(e) => { e.preventDefault(); addTxn(); }}>
			<div class="form-grid">
				<div><label>Date *</label><input type="date" bind:value={txnForm.date} required /></div>
				<div><label>Job Number</label><input bind:value={txnForm.jobNumber} /></div>
				<div><label>Qty In</label><input type="number" bind:value={txnForm.quantityIn} /></div>
				<div><label>Qty Out</label><input type="number" bind:value={txnForm.quantityOut} /></div>
				<div><label>Unit Price</label><input type="number" step="0.01" bind:value={txnForm.unitPrice} /></div>
				<div><label>Total Cost</label><input type="number" step="0.01" bind:value={txnForm.totalCost} /></div>
				<div class="full"><label>Notes</label><input bind:value={txnForm.notes} /></div>
			</div>
			<button type="submit" style="margin-top:12px" class="btn-primary">Record</button>
		</form>
	</div>

	<div class="card" style="margin-top:10px">
		<div class="card-header">
			<h2>Transaction History</h2>
			<div class="page-header-actions">
				{#if filtered.length > 0}
					<button class="btn-ghost btn-sm" onclick={exportSummary}>Export Summary</button>
					<button class="btn-ghost btn-sm" onclick={exportCsv}>Export CSV</button>
				{/if}
			</div>
		</div>
		<div class="filter-bar">
			<input type="search" bind:value={filterJob} placeholder="Job #" style="flex:1;min-width:120px" />
			<input type="date" bind:value={filterDateFrom} placeholder="From" title="From date" style="width:130px" />
			<input type="date" bind:value={filterDateTo} placeholder="To" title="To date" style="width:130px" />
			<select bind:value={filterDirection} style="width:75px">
				<option value="all">All</option>
				<option value="in">In</option>
				<option value="out">Out</option>
			</select>
		</div>
		{#if txns.length === 0}
			<div class="empty-state">No transactions recorded.</div>
		{:else if filtered.length === 0}
			<div class="empty-state">No transactions match the filter.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead><tr><th>Date</th><th>In</th><th>Out</th><th>Job</th><th>Unit Price</th><th>Total</th><th>Notes</th><th></th></tr></thead>
					<tbody>
						{#each filtered as t}
							<tr>
								<td>{new Date(t.date).toLocaleDateString()}</td>
								<td>{t.quantityInOut > 0 ? t.quantityInOut : '-'}</td>
								<td>{t.quantityInOut < 0 ? -t.quantityInOut : '-'}</td>
								<td>{t.jobNumber ?? '-'}</td>
								<td>{t.unitPrice ? `$${Number(t.unitPrice).toFixed(2)}` : '-'}</td>
								<td>{t.totalCost ? `$${Number(t.totalCost).toFixed(2)}` : '-'}</td>
								<td>{t.notes ?? ''}</td>
								<td><button class="btn-del btn-sm" onclick={() => deleteTxn(t.id)}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}
