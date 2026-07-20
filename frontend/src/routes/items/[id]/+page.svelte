<script lang="ts">
	import { items, vendors, locations, itemCategories } from '$lib/api';
	import ItemChart from '$lib/ItemChart.svelte';
	import { addToast } from '$lib/toast.svelte';
	import { confirm } from '$lib/confirmDialog.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import QRCode from 'qrcode';
	let { params } = $props();

	let item = $state<any>(null);
	let txns = $state<any[]>([]);
	let editing = $state(false);
	let vendorsList = $state<any[]>([]);
	let locationsList = $state<any[]>([]);
	let catsList = $state<any[]>([]);
	let subCats = $state<any[]>([]);

	// Tab state management
	let activeTab = $state<'details' | 'transactions' | 'chart'>('details');
	let txnSearch = $state('');
	let txnDateFrom = $state('');
	let txnDateTo = $state('');

	let form = $state<any>({});

	let filteredTxns = $derived.by(() => {
		if (!txnSearch && !txnDateFrom && !txnDateTo) return txns;
		return txns.filter(t => {
			if (txnDateFrom && new Date(t.date) < new Date(txnDateFrom)) return false;
			if (txnDateTo && new Date(t.date) > new Date(txnDateTo + 'T23:59:59')) return false;
			if (txnSearch) {
				const q = txnSearch.toLowerCase();
				const job = (t.jobNumber ?? '').toLowerCase();
				const notes = (t.notes ?? '').toLowerCase();
				if (!job.includes(q) && !notes.includes(q)) return false;
			}
			return true;
		});
	});

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
		rows.push([jobs.length ? jobs.join(', ') : '(none)', '(all)', '(all)', totalCostSum.toFixed(2)]);
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

	async function printQr() {
		let dataUrl = qrCodeUrl;
		if (!dataUrl) {
			const origin = window.location.origin;
			const url = `${origin}/scan?code=${encodeURIComponent(item.itemNumber)}`;
			dataUrl = await QRCode.toDataURL(url, { width: 250, margin: 1 });
		}
		const win = window.open('', '_blank');
		if (!win) return;
		win.document.write(`<!DOCTYPE html><html><head><title>QR - ${item.itemNumber}</title>
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body { font-family:Inter,sans-serif;padding:12px;display:flex;justify-content:center;align-items:center;min-height:100vh; }
.label { border:1px solid #ccc;border-radius:8px;padding:8px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px; }
img { width:120px;height:120px;image-rendering:pixelated; }
.code { font-weight:700;font-size:12px; }
.desc { font-size:10px;color:#555;line-height:1.3; }
@media print { @page { margin:8mm; } }
</style></head><body><div class="label"><img src="${dataUrl}" alt="QR"><span class="code">${item.itemNumber}</span><span class="desc">${item.description ?? ''}</span></div></body></html>`);
		win.document.close();
		win.focus();
		setTimeout(() => win.print(), 300);
		items.markPrinted([item.id]).catch(() => {});
	}

	let qrCodeUrl = $state<string | null>(null);

	$effect(() => {
		if (item?.labelPrinted) {
			const origin = window.location.origin;
			const url = `${origin}/scan?code=${encodeURIComponent(item.itemNumber)}`;
			QRCode.toDataURL(url, { width: 250, margin: 1 }).then((dataUrl: string) => {
				qrCodeUrl = dataUrl;
			});
		} else {
			qrCodeUrl = null;
		}
	});
</script>

{#if !item}
	<div class="sk-container">
		<div class="sk" style="width:35%;height:24px"></div>
		<div class="sk" style="width:55%"></div>
		<div class="sk" style="width:45%"></div>
	</div>
{:else}
	<!-- Top Bar Dashboard Header Layout -->

	<div class="page-header">
		<div>
			<h1 class="item-title">{item.description || 'Unnamed Item'}</h1>
			<p class="item-subtitle">{item.itemNumber}</p>
			<div class="header-meta-grid">
				<span class="meta-label">Status</span>
				<span class="status-badge {item.onHand <= (item.minStock ?? 0) ? 'low-stock' : 'in-stock'}">
					{item.onHand <= (item.minStock ?? 0) ? 'Low Stock' : 'In Stock'}
				</span>
				<span class="meta-label">Price</span>
				<span class="price-value">{item.unitPrice ? `$${Number(item.unitPrice).toFixed(2)}` : 'Missing'}</span>
			</div>
		</div>

		{#if item.labelPrinted}
			<div class="qr-box">
				{#if qrCodeUrl}
					<img src={qrCodeUrl} alt="QR" style="width:80px;height:80px;display:block" />
				{:else}
					<div style="width:80px;height:80px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--empty-text-secondary)">Loading QR…</div>
				{/if}
				<div style="display:flex;flex-direction:column;align-items:center;gap:6px">
					<button class="qr-btn" onclick={printQr} title="Print QR label">
						<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M8 21q-.825 0-1.412-.587T6 19v-2H4q-.825 0-1.412-.587T2 15v-4q0-1.275.875-2.137T5 8h14q1.275 0 2.138.863T22 11v4q0 .825-.587 1.413T20 17h-2v2q0 .825-.587 1.413T16 21zm-4-6h2q0-.825.588-1.412T8 13h8q.825 0 1.413.588T18 15h2v-4q0-.425-.288-.712T19 10H5q-.425 0-.712.288T4 11zm12-7V5H8v3H6V5q0-.825.588-1.412T8 3h8q.825 0 1.413.588T18 5v3zm2 4.5q.425 0 .713-.288T19 11.5t-.288-.712T18 10.5t-.712.288T17 11.5t.288.713t.712.287M16 19v-4H8v4zM4 10h16z" /></svg>
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Main Workspace Split Grid Layout -->
	<div class="dashboard-grid">

		<!-- Left Main Content Area (Tabs & Form Data View) -->
		<div class="content-card">
			<div class="tabs-header-row">
				<div class="tabs-nav">
					<button class="tab-btn" class:active={activeTab === 'details'} onclick={() => activeTab = 'details'}>Details</button>
					<button class="tab-btn" class:active={activeTab === 'transactions'} onclick={() => activeTab = 'transactions'}>Transactions ({txns.length})</button>
					<button class="tab-btn" class:active={activeTab === 'chart'} onclick={() => activeTab = 'chart'}>Stock Chart</button>
				</div>
				{#if activeTab === 'details'}
					<button class="btn-ghost btn-sm" onclick={() => editing = !editing}>
						{editing ? 'Cancel' : 'Edit'}
					</button>
				{/if}
			</div>

			<!-- Dynamic Content Windows inside Tabs -->
			{#if editing}
				<form style="padding:16px" onsubmit={(e) => { e.preventDefault(); save(); }}>
					<div class="form-grid">
						<div class="full"><label>Item Number</label><input bind:value={form.itemNumber} required /></div>
						<div class="full"><label>Description</label><input bind:value={form.description} required /></div>
						<div><label>Unit</label><input bind:value={form.unit} placeholder="Each, Box, etc" /></div>
						<div><label>Unit Price</label><input type="number" step="0.01" bind:value={form.unitPrice} /></div>
						<div><label>Weight/Unit (g)</label><input type="number" step="0.0001" bind:value={form.weightPerUnit} /></div>
						<div><label>Analysis Code</label><input bind:value={form.analysisCode} /></div>
						<div><label>Head Type</label><input bind:value={form.headType} /></div>
						<div class="full"><ImageUpload bind:value={form.imageUrl} label="Image URL" /></div>
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
					<button type="submit" class="btn-primary" style="margin-top:14px">Save Changes</button>
				</form>
			{:else}
				<div class="tab-body">
					{#if activeTab === 'details'}
						<div class="details-grid">
							<span class="detail-label">Category</span><span class="detail-val">{item.category?.name ?? '-'}{item.subCategory ? ` / ${item.subCategory.name}` : ''}</span>
							<span class="detail-label">Head Type</span><span class="detail-val">{item.headType ?? '-'}</span>
							<span class="detail-label">Unit</span><span class="detail-val">{item.unit ?? '-'}</span>
							<span class="detail-label">Unit Price</span><span class="detail-val">{item.unitPrice ? `$${Number(item.unitPrice).toFixed(2)}` : '-'}</span>
							<span class="detail-label">Min Stock Threshold</span><span class="detail-val">{item.minStock ?? '-'}</span>
							<span class="detail-label">Vendor</span><span class="detail-val">{item.vendor?.name ?? '-'}</span>
							<span class="detail-label">Location</span><span class="detail-val">{item.location?.name ?? '-'}</span>
							<span class="detail-label">Analysis Code</span><span class="detail-val">{item.analysisCode ?? '-'}</span>
							<span class="detail-label">Weight per Unit</span><span class="detail-val">{item.weightPerUnit ? `${item.weightPerUnit}g` : '-'}</span>
						</div>
					{:else if activeTab === 'transactions'}
						<div class="filter-bar">
							<input type="search" bind:value={txnSearch} placeholder="Search job or notes..." style="flex:1;min-width:120px;max-width:260px" />
							<input type="date" bind:value={txnDateFrom} placeholder="From" title="From date" style="width:120px" />
							<input type="date" bind:value={txnDateTo} placeholder="To" title="To date" style="width:120px" />
							{#if txns.length > 0}
								<div style="display:flex;gap:6px;flex-shrink:0">
									<button class="btn-ghost btn-sm" onclick={exportSummary}>Export Summary</button>
									<button class="btn-ghost btn-sm" onclick={exportCsv}>Export Records</button>
								</div>
							{/if}
						</div>
						{#if txns.length === 0}
							<div class="empty-state">No transactions recorded yet.</div>
						{:else if filteredTxns.length === 0}
							<div class="empty-state">No transactions match the filters.</div>
						{:else}
							<div class="table-wrap">
								<table>
									<thead>
										<tr><th>Date</th><th>In</th><th>Out</th><th style="width:120px">Job #</th><th>Unit Price</th><th>Total</th><th>Notes</th><th></th></tr>
									</thead>
									<tbody>
										{#each filteredTxns as t}
											<tr>
												<td>{new Date(t.date).toLocaleDateString()}</td>
												<td class="text-success">{t.quantityInOut > 0 ? `+${t.quantityInOut}` : '-'}</td>
												<td class="text-danger">{t.quantityInOut < 0 ? -t.quantityInOut : '-'}</td>
												<td>
													{#if t.jobNumber}
														<a href="/jobs/{t.jobNumber}" class="job-pill" onclick={(e) => e.stopPropagation()}>{t.jobNumber}</a>
													{:else}<span class="job-pill">-</span>{/if}
												</td>
												<td>{t.unitPrice ? `$${Number(t.unitPrice).toFixed(2)}` : '-'}</td>
												<td>{t.totalCost ? `$${Number(t.totalCost).toFixed(2)}` : '-'}</td>
												<td class="notes-cell">{t.notes ?? ''}</td>
												<td>
													<button class="btn-del btn-sm" onclick={() => deleteTxn(t.id)}>
														<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg>
													</button>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					{:else}
						<div class="chart-wrap">
							<ItemChart transactions={txns} />
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Right Media & Action Sidebar Card Panel -->
		<div class="sidebar-panel">
			<div class="sidebar-card">
				{#if item.imageUrl}
					<img src={item.imageUrl} alt={item.description} class="product-img" />
				{:else}
					<div class="no-img">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
						<span>No image added</span>
					</div>
				{/if}
				<div class="img-sub">
					<h4>{item.description}</h4>
				</div>
			</div>

			<div class="sidebar-card">
				<div class="metric-block">
					<span class="metric-num">{item.onHand}</span>
					<span class="metric-label">Units Available</span>
				</div>
				<a href="/scan?code={item.itemNumber}" class="btn-primary" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;box-sizing:border-box">
				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
					<path d="M0 0h24v24H0z" fill="none" />
					<path fill="currentColor" d="M10 5.5a4.5 4.5 0 0 1 6.5-4.032a4.5 4.5 0 1 1 0 8.064A4.5 4.5 0 0 1 10 5.5m8.25 2.488q.123.012.25.012a2.5 2.5 0 1 0-.25-4.988A4.5 4.5 0 0 1 19 5.5a4.5 4.5 0 0 1-.75 2.488M8.435 13.25a1.25 1.25 0 0 0-.885.364l-2.05 2.05V19.5h5.627l5.803-1.45l3.532-1.508a.555.555 0 0 0-.416-1.022l-.02.005L13.614 17H10v-2h3.125a.875.875 0 1 0 0-1.75zm7.552 1.152l3.552-.817a2.56 2.56 0 0 1 3.211 2.47a2.56 2.56 0 0 1-1.414 2.287l-.027.014l-3.74 1.595l-6.196 1.549H0v-7.25h4.086l2.052-2.052a3.25 3.25 0 0 1 2.3-.948h4.687a2.875 2.875 0 0 1 2.862 3.152M3.5 16.25H2v3.25h1.5z" />
</svg>

					Transact
				</a>
			</div>
		</div>

	</div>
{/if}

<style>
	.item-title {
		font-size: 24px;
		font-weight: 400;
		color: var(--text-primary);
		margin: 0 0 2px 0;
	}
	.item-subtitle {
		font-size: 14px;
		color: var(--empty-text-secondary);
		margin: 0 0 12px 0;
	}
	.meta-badges {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.header-meta-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 4px 12px;
		align-items: center;
		justify-items: start;
		font-size: 13px;
	}
	.meta-label {
		color: var(--empty-text-primary);
		font-weight: 400;
	}
	.price-value {
		color: var(--text-primary);
		font-weight: 600;
	}
	.status-badge {
		font-size: 11px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 6px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.status-badge.in-stock {
		background: var(--green);
		color: var(--green-bg-light);
	}
	.status-badge.low-stock {
		background: var(--red);
		color: var(--red-bg-light);
	}
	.qr-box {
	background: color-mix(in srgb, var(--bg-secondary), 50% transparent);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 8px;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.qr-btn {
	background: transparent;
	border: 1px solid transparent;
	margin-left: 2.4rem;
	margin-right: 0.8rem;
	padding: 4px;
	transition: all var(--transition-normal);
	}

	.qr-btn:hover {
	background: var(--bg-primary);
	}
	.qr-text {
		font-size: 11px;
		color: var(--empty-text-secondary);
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 20px;
		align-items: start;
	}

	.btn-primary {
	padding: 6px 8px;
	border-radius: 10px;
	font-size: 20px;
	text-decoration: none;
	}
	.btn-primary:hover {
	opacity: 0.8 ;
	color: white;
	}

	.content-card {
		background: color-mix(in srgb, var(--bg-secondary), 50% transparent);
		border: 1px solid var(--border-color);
		border-radius: 18px;
		overflow: hidden;
	}
	.tabs-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 14px;
		border-bottom: 1px solid var(--border-color);
	}
	.tabs-nav {
		display: flex;
		gap: 2px;
	}
	.tab-btn {
		background: transparent;
		border: none;
		padding: 12px 14px;
		font-size: 13px;
		font-weight: 400;
		color: var(--empty-text-primary);
		cursor: pointer;
		position: relative;
		transition: color 0.2s;
		border-radius: 0;
	}
	.tab-btn:hover { color: var(--text-primary); }
	.tab-btn.active {
		color: var(--text-primary);
		font-weight: 500;
	}
	.tab-btn.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--accent-dark);
	}

	.tab-body { padding: 16px; }

	/* Details grid: 1fr 1fr split */
	.details-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		border: 1px solid var(--border-color);
		border-radius: 12px;
		overflow: hidden;
	}
	.detail-label, .detail-val {
		padding: 10px 12px;
		border-bottom: 1px solid var(--border-color);
		font-size: 13px;
	}
	.detail-label {
		color: var(--empty-text-primary);
		font-weight: 400;
		border-right: 1px solid var(--border-color);
	}
	.detail-val {
		color: var(--text-primary);
		font-weight: 400;
	}
	.detail-label:nth-last-child(2),
	.detail-val:last-child {
		border-bottom: none;
	}

	.text-success { color: var(--green); font-weight: 500; }
	.text-danger { color: var(--red); font-weight: 500; }
	.notes-cell {
		max-width: 160px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--empty-text-secondary);
	}

	/* Sidebar */
	.sidebar-panel {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.sidebar-card {
		background: color-mix(in srgb, var(--bg-secondary), 50% transparent);
		border: 1px solid var(--border-color);
		border-radius: 18px;
		padding: 16px;
	}
	.product-img {
		width: 100%;
		height: 200px;
		object-fit: cover;
		background: var(--bg-primary);
		border-radius: 12px;
	}
	.no-img {
		height: 160px;
		background: var(--bg-primary);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--empty-text-secondary);
		gap: 8px;
		font-size: 13px;
		border: 1px dashed var(--border-color);
		border-radius: 12px;
	}
	.img-sub {
		margin-top: 10px;
		text-align: center;
	}
	.img-sub h4 { margin: 0 0 2px 0; font-size: 14px; font-weight: 500; color: var(--text-primary); }
	.img-sub p { margin: 0; font-size: 12px; color: var(--empty-text-secondary); }

	.metric-block { text-align: center; margin-bottom: 14px; }
	.metric-num { display: block; font-size: 30px; font-weight: 500; color: var(--text-primary); line-height: 1; }
	.metric-label { font-size: 12px; color: var(--empty-text-secondary); font-weight: 400; }

	/* Skeleton */
	.sk-container {
		padding: 40px;
		background: color-mix(in srgb, var(--bg-secondary), 50% transparent);
		border: 1px solid var(--border-color);
		border-radius: 18px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.sk {
		background: linear-gradient(90deg, var(--border-color) 25%, var(--empty-text-secondary) 50%, var(--border-color) 75%);
		opacity: 0.3;
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
		height: 16px;
		border-radius: 4px;
	}
	@keyframes loading {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
	.chart-wrap {
		padding: 8px 0;
	}
</style>
