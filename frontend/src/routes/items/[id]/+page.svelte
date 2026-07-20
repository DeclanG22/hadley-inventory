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

	function exportCsv() {
		const rows = [['Date','In','Out','Job Number','Unit Price','Total Cost','Notes']];
		for (const t of txns) {
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
		for (const t of txns) {
			const up = Number(t.unitPrice) || 0;
			const cost = t.totalCost ? Number(t.totalCost) : up ? Math.abs(t.quantityInOut) * up : 0;
			sum += cost;
		}
		return sum;
	});

	function exportSummary() {
		const jobs = [...new Set(txns.map((t: any) => t.jobNumber).filter(Boolean))];
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
			<span>
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 3h6m-3-3v6" />
         			</svg>
				Category:
</span>
<span>{item.category?.name ?? '-'}{item.subCategory ? ` / ${item.subCategory.name}` : ''}</span>

<span>
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<path fill="currentColor" d="M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9M8.5 12a3.5 3.5 0 1 1 7 0a3.5 3.5 0 0 1-7 0" />
	<path fill="currentColor" d="M10.087 3.5c-.978 0-1.583 0-2.134.174a3.7 3.7 0 0 0-1.318.74c-.432.38-.737.894-1.225 1.717L3.494 9.36c-.487.821-.792 1.335-.913 1.892a3.5 3.5 0 0 0 0 1.494c.121.557.426 1.07.913 1.892l1.916 3.23c.488.823.793 1.337 1.225 1.716c.382.335.831.587 1.318.741c.551.174 1.156.174 2.134.174h3.826c.978 0 1.583 0 2.134-.174a3.7 3.7 0 0 0 1.318-.74c.432-.38.737-.894 1.225-1.717l1.916-3.23c.487-.821.792-1.335.913-1.892a3.5 3.5 0 0 0 0-1.494c-.121-.557-.426-1.07-.913-1.891L18.59 6.13c-.488-.823-.793-1.337-1.225-1.716a3.7 3.7 0 0 0-1.318-.741C15.496 3.5 14.89 3.5 13.913 3.5zM8.255 4.627c.385-.121.825-.127 1.922-.127h3.646c1.097 0 1.537.006 1.922.127c.356.113.684.297.96.54c.299.261.521.625 1.07 1.551l1.823 3.074c.55.927.762 1.295.844 1.674a2.5 2.5 0 0 1 0 1.068c-.082.379-.294.747-.844 1.674l-1.822 3.074c-.55.926-.772 1.29-1.07 1.551a2.7 2.7 0 0 1-.96.54c-.386.121-.826.127-1.923.127h-3.646c-1.097 0-1.537-.006-1.922-.127a2.7 2.7 0 0 1-.96-.54c-.299-.261-.521-.625-1.07-1.551l-1.823-3.074c-.55-.927-.762-1.295-.844-1.674a2.5 2.5 0 0 1 0-1.068c.082-.379.294-.747.844-1.674l1.822-3.074c.55-.926.772-1.29 1.07-1.551c.278-.243.605-.427.96-.54" />
    </svg>

				Head Type:
</span>
<span>{item.headType ?? '-'}</span>

<span>
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48">
	<path d="M0 0h48v48H0z" fill="none" />
	<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4">
		<path d="M9 4h30v40L24 33.429L9 44z" />
		<path d="M9 4h30v12H9z" />
	</g>
    </svg>

				Unit:
</span>
<span>{item.unit ?? '-'}</span>

<span>
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512">
	<path d="M0 0h512v512H0z" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M435.25 48h-122.9a14.46 14.46 0 0 0-10.2 4.2L56.45 297.9a28.85 28.85 0 0 0 0 40.7l117 117a28.85 28.85 0 0 0 40.7 0L459.75 210a14.46 14.46 0 0 0 4.2-10.2v-123a28.66 28.66 0 0 0-28.7-28.8" />
	<path fill="currentColor" d="M384 160a32 32 0 1 1 32-32a32 32 0 0 1-32 32" />
    </svg>



				Unit Price:
</span>
<span>{item.unitPrice ? `$${Number(item.unitPrice).toFixed(2)}` : '-'}</span>

<span>
 			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5">
                   	<path stroke-linejoin="round" d="M12 22c-.818 0-1.6-.33-3.163-.988C4.946 19.373 3 18.554 3 17.175V7.542M12 22c.818 0 1.6-.33 3.163-.988C19.054 19.373 21 18.554 21 17.175V7.542M12 22v-9.97m9-4.488c0 .613-.802 1-2.405 1.773l-2.92 1.41c-1.804.87-2.705 1.304-3.675 1.304m9-4.487c0-.612-.802-.999-2.405-1.772L17 5M3 7.542c0 .613.802 1 2.405 1.773l2.92 1.41c1.804.87 2.705 1.304 3.675 1.304M3 7.542c0-.612.802-.999 2.405-1.772L7 5m-1 8.026l2 .997" />
   					<path d="m10 2l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2" />
                </g>
 			</svg>
				Min Stock:
</span>
<span>{item.minStock ?? '-'}</span>

<span>
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
       	<path d="M0 0h24v24H0z" fill="none" />
       	<path fill="currentColor" d="M18 15h-2v2h2m0-6h-2v2h2m2 6h-8v-2h2v-2h-2v-2h2v-2h-2V9h8M10 7H8V5h2m0 6H8V9h2m0 6H8v-2h2m0 6H8v-2h2M6 7H4V5h2m0 6H4V9h2m0 6H4v-2h2m0 6H4v-2h2m6-10V3H2v18h20V7z" />
    </svg>
				Vendor:
</span>
<span>{item.vendor?.name ?? '-'}</span>

<span>
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
       	<path d="M0 0h24v24H0z" fill="none" />
       	<path fill="currentColor" d="M16 10c0-2.21-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4m-6 0c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2" />
       	<path fill="currentColor" d="M11.42 21.81c.17.12.38.19.58.19s.41-.06.58-.19c.3-.22 7.45-5.37 7.42-11.82c0-4.41-3.59-8-8-8s-8 3.59-8 8c-.03 6.44 7.12 11.6 7.42 11.82M12 4c3.31 0 6 2.69 6 6c.02 4.44-4.39 8.43-6 9.74c-1.61-1.31-6.02-5.29-6-9.74c0-3.31 2.69-6 6-6" />
    </svg>
				Location:
</span>
<span>{item.location?.name ?? '-'}</span>
			</div>
		</div>
	{/if}

	<div class="card" style="margin-top:10px">
		<div class="card-header"><h2>Record Transaction</h2></div>
		<p style="padding:0 0 4px;color:var(--text-secondary);font-size:13px">
			Go to the scan page to transact this item.
		</p>
		<a href="/scan?code={item.itemNumber}" class="btn-primary" style="display:inline-flex;align-items:center;gap:6px">
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M9.5 6.5v3h-3v-3zM11 5H5v6h6zm-1.5 9.5v3h-3v-3zM11 13H5v6h6zm6.5-6.5v3h-3v-3zM19 5h-6v6h6zm-6 8h1.5v1.5H13zm1.5 1.5H16V16h-1.5zM16 13h1.5v1.5H16zm-3 3h1.5v1.5H13zm1.5 1.5H16V19h-1.5zM16 16h1.5v1.5H16zm1.5-1.5H19V16h-1.5zm0 3H19V19h-1.5z"/></svg>
			Transact / Scan
		</a>
	</div>

	<div class="card" style="margin-top:10px">
		<div class="card-header">
			<h2>Transaction History</h2>
			<div class="page-header-actions">
				{#if txns.length > 0}
					<button class="btn-ghost btn-sm" onclick={exportSummary}>Export Summary</button>
					<button class="btn-ghost btn-sm" onclick={exportCsv}>Export CSV</button>
				{/if}
			</div>
		</div>
		{#if txns.length === 0}
			<div class="empty-state">No transactions recorded.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead><tr><th>Date</th><th>In</th><th>Out</th><th>Job</th><th>Unit Price</th><th>Total</th><th>Notes</th><th></th></tr></thead>
					<tbody>
						{#each txns as t}
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

	<div class="card" style="margin-top:10px">
		<div class="card-header"><h2>Stock History Chart</h2></div>
		<ItemChart transactions={txns} />
	</div>
{/if}

<style>
    .btn-primary {
        border-radius: 8px;
        padding: 4px 8px;
    }
</style>
