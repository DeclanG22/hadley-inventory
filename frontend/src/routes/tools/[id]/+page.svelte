<script lang="ts">
	import { tools, locations, toolCategories } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';
	import { confirm } from '$lib/confirmDialog.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import QRCode from 'qrcode';
	let { params } = $props();

	let tool = $state<any>(null);
	let checkouts = $state<any[]>([]);
	let maint = $state<any[]>([]);
	let editing = $state(false);
	let locList = $state<any[]>([]);
	let catList = $state<any[]>([]);
	let form = $state<any>({});

	let activeTab = $state<'details' | 'checkouts' | 'maintenance' | 'flags'>('details');
	let chkJob = $state('');
	let chkDateFrom = $state('');
	let chkDateTo = $state('');

	let maintForm = $state({ type: 'repair', description: '', date: new Date().toISOString().slice(0,10), performedBy: '', cost: '', notes: '', flagId: '' });
	let flagForm = $state({ open: false, type: 'repair', description: '', createdBy: '' });

	let maintDateFrom = $state('');
	let maintDateTo = $state('');
	let maintType = $state('');

	function load() {
		const id = Number(params.id);
		tools.get(id).then(t => { tool = t; resetForm(t); });
		tools.checkouts.list(id).then(c => checkouts = c);
		tools.maintenance.list(id).then(m => maint = m);
		locations.list().then(l => locList = l);
		toolCategories.list().then(l => catList = l);
	}
	$effect(load);

	$effect(() => {
		if (maintForm.flagId && tool?.maintenanceFlags) {
			const flag = tool.maintenanceFlags.find((f: any) => f.id === Number(maintForm.flagId));
			if (flag) {
				maintForm.type = flag.type;
				if (flag.description) maintForm.description = flag.description;
			}
		}
	});

	function resetForm(t: any) {
		form = {
			toolNumber: t.toolNumber, name: t.name, description: t.description ?? '',
			brand: t.brand ?? '', model: t.model ?? '', serialNumber: t.serialNumber ?? '',
			imageUrl: t.imageUrl ?? '', notes: t.notes ?? '',
			categoryId: t.categoryId ?? '', locationId: t.locationId ?? '',
		};
	}

	async function save() {
		try {
			const id = Number(params.id);
			const data: any = {};
			for (const [k, v] of Object.entries(form)) {
				if (v === '') continue;
				if (['categoryId','locationId'].includes(k)) data[k] = Number(v);
				else data[k] = v;
			}
			await tools.update(id, data);
			editing = false;
			tools.get(id).then(t => { tool = t; resetForm(t); });
			addToast('Tool updated', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	async function doMaint() {
		try {
			const id = Number(params.id);
			const data: any = { type: maintForm.type, date: maintForm.date };
			if (maintForm.description) data.description = maintForm.description;
			if (maintForm.performedBy) data.performedBy = maintForm.performedBy;
			if (maintForm.cost) data.cost = Number(maintForm.cost);
			if (maintForm.notes) data.notes = maintForm.notes;
			if (maintForm.flagId) data.flagId = Number(maintForm.flagId);
			await tools.maintenance.create(id, data);
			maintForm = { type: 'repair', description: '', date: new Date().toISOString().slice(0,10), performedBy: '', cost: '', notes: '', flagId: '' };
			load();
			addToast('Maintenance record added', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	async function doFlag() {
		try {
			await tools.maintenanceFlags.create(Number(params.id), { type: flagForm.type, description: flagForm.description || undefined, createdBy: flagForm.createdBy || undefined });
			load();
			addToast('Maintenance flag created', 'success');
			flagForm = { open: false, type: 'repair', description: '', createdBy: '' };
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	async function deleteCheckout(coId: number) {
		const ok = await confirm('Delete Checkout', 'This will permanently remove this checkout record.');
		if (!ok) return;
		try {
			await tools.checkouts.remove(coId);
			load();
			addToast('Checkout deleted', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	async function deleteMaint(maintId: number) {
		const ok = await confirm('Delete Maintenance Record', 'This will permanently remove this maintenance record.');
		if (!ok) return;
		try {
			await tools.maintenance.remove(maintId);
			load();
			addToast('Maintenance record deleted', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	function openCheckout(): any | undefined {
		return checkouts.find(c => !c.checkedInAt);
	}

	let filteredCheckouts = $derived.by(() => {
		let list = [...checkouts];
		if (chkJob) list = list.filter(c => (c.jobNumber ?? '').toLowerCase().includes(chkJob.toLowerCase()));
		if (chkDateFrom) list = list.filter(c => new Date(c.checkedOutAt) >= new Date(chkDateFrom));
		if (chkDateTo) list = list.filter(c => new Date(c.checkedOutAt) <= new Date(chkDateTo + 'T23:59:59'));
		return list;
	});

	function chkExportCSV() {
		const headers = ['Date Out', 'Checked Out By', 'Job Number', 'Job Site', 'Date In'];
		const rows = filteredCheckouts.map(c => [
			new Date(c.checkedOutAt).toISOString(),
			c.checkedOutBy,
			c.jobNumber ?? '',
			c.jobSite ?? '',
			c.checkedInAt ? new Date(c.checkedInAt).toISOString() : ''
		]);
		const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v.replace(/"/g,'""')}"`).join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = `tool-${params.id}-checkouts.csv`; a.click();
		URL.revokeObjectURL(url);
	}

	function chkExportSummary() {
		const total = filteredCheckouts.length;
		const headers = ['Tool ID', 'Job Number', 'Date From', 'Date To', 'Total Checkouts'];
		const rows = [[params.id, chkJob || '-', chkDateFrom || '-', chkDateTo || '-', total]];
		const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = `tool-${params.id}-checkouts-summary.csv`; a.click();
		URL.revokeObjectURL(url);
	}

	let filteredMaint = $derived.by(() => {
		let list = [...maint];
		if (maintType) list = list.filter(m => m.type === maintType);
		if (maintDateFrom) list = list.filter(m => new Date(m.date) >= new Date(maintDateFrom));
		if (maintDateTo) list = list.filter(m => new Date(m.date) <= new Date(maintDateTo + 'T23:59:59'));
		return list;
	});

	function maintExportCSV() {
		const headers = ['Date', 'Type', 'Description', 'Performed By', 'Cost', 'Notes'];
		const rows = filteredMaint.map(m => [
			new Date(m.date).toISOString(),
			m.type,
			m.description ?? '',
			m.performedBy ?? '',
			m.cost ? Number(m.cost).toFixed(2) : '',
			m.notes ?? ''
		]);
		const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v.replace(/"/g,'""')}"`).join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = `tool-${params.id}-maintenance.csv`; a.click();
		URL.revokeObjectURL(url);
	}

	function maintExportSummary() {
		const total = filteredMaint.length;
		const totalCost = filteredMaint.reduce((s, m) => s + (Number(m.cost) || 0), 0);
		const headers = ['Tool ID', 'Type', 'Date From', 'Date To', 'Total Records', 'Total Cost'];
		const rows = [[params.id, maintType || '-', maintDateFrom || '-', maintDateTo || '-', total, totalCost.toFixed(2)]];
		const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = `tool-${params.id}-maintenance-summary.csv`; a.click();
		URL.revokeObjectURL(url);
	}

	async function printQr() {
		let dataUrl = qrCodeUrl;
		if (!dataUrl) {
			const origin = window.location.origin;
			const url = `${origin}/scan?code=${encodeURIComponent(tool.toolNumber)}`;
			dataUrl = await QRCode.toDataURL(url, { width: 250, margin: 1 });
		}
		const win = window.open('', '_blank');
		if (!win) return;
		win.document.write(`<!DOCTYPE html><html><head><title>QR - ${tool.toolNumber}</title>
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body { font-family:Inter,sans-serif;padding:12px;display:flex;justify-content:center;align-items:center;min-height:100vh; }
.label { border:1px solid #ccc;border-radius:8px;padding:8px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px; }
img { width:120px;height:120px;image-rendering:pixelated; }
.code { font-weight:700;font-size:12px; }
.desc { font-size:10px;color:#555;line-height:1.3; }
@media print { @page { margin:8mm; } }
</style></head><body><div class="label"><img src="${dataUrl}" alt="QR"><span class="code">${tool.toolNumber}</span><span class="desc">${tool.name ?? ''}</span></div></body></html>`);
		win.document.close();
		win.focus();
		setTimeout(() => win.print(), 300);
		tools.markPrinted([tool.id]).catch(() => {});
	}

	let qrCodeUrl = $state<string | null>(null);

	$effect(() => {
		if (tool?.labelPrinted) {
			const origin = window.location.origin;
			const url = `${origin}/scan?code=${encodeURIComponent(tool.toolNumber)}`;
			QRCode.toDataURL(url, { width: 250, margin: 1 }).then((dataUrl: string) => {
				qrCodeUrl = dataUrl;
			});
		} else {
			qrCodeUrl = null;
		}
	});
</script>

{#if !tool}
	<div class="sk-container">
		<div class="sk" style="width:35%;height:24px"></div>
		<div class="sk" style="width:55%"></div>
		<div class="sk" style="width:45%"></div>
	</div>
{:else}
	<div class="page-header">
		<div>
			<h1 class="item-title">{tool.name || 'Unnamed Tool'}</h1>
			<p class="item-subtitle">{tool.toolNumber}{tool.brand ? ` — ${tool.brand}` : ''}{tool.model ? ` ${tool.model}` : ''}{tool.serialNumber ? ` (S/N: ${tool.serialNumber})` : ''}</p>
			<div class="header-meta-grid">
				<span class="meta-label">Status</span>
				<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">
					<span class="status-badge {openCheckout() ? 'low-stock' : 'in-stock'}">{openCheckout() ? 'Checked Out' : 'Available'}</span>
					{#each tool.maintenanceFlags ?? [] as f}
						<span class="badge badge-{f.type}">Flagged for {f.type}</span>
					{/each}
				</div>
			</div>
		</div>

		{#if tool.labelPrinted}
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

	<div class="dashboard-grid">
		<div class="content-card">
			<div class="tabs-header-row">
				<div class="tabs-nav">
					<button class="tab-btn" class:active={activeTab === 'details'} onclick={() => activeTab = 'details'}>Details</button>
					<button class="tab-btn" class:active={activeTab === 'checkouts'} onclick={() => activeTab = 'checkouts'}>Checkouts ({checkouts.length})</button>
					<button class="tab-btn" class:active={activeTab === 'maintenance'} onclick={() => activeTab = 'maintenance'}>Maintenance</button>
					<button class="tab-btn" class:active={activeTab === 'flags'} onclick={() => activeTab = 'flags'}>Flags ({(tool?.maintenanceFlags ?? []).length})</button>
				</div>
				{#if activeTab === 'details'}
					<button class="btn-ghost btn-sm" onclick={() => editing = !editing}>
						{editing ? 'Cancel' : 'Edit'}
					</button>
				{/if}
			</div>

			{#if editing}
				<form style="padding:16px" onsubmit={(e) => { e.preventDefault(); save(); }}>
					<div class="form-grid">
						<div class="full"><label>Tool Number</label><input bind:value={form.toolNumber} required /></div>
						<div class="full"><label>Name</label><input bind:value={form.name} required /></div>
						<div class="full"><label>Description</label><input bind:value={form.description} /></div>
						<div><label>Brand</label><input bind:value={form.brand} /></div>
						<div><label>Model</label><input bind:value={form.model} /></div>
						<div><label>Serial Number</label><input bind:value={form.serialNumber} /></div>
						<div class="full"><ImageUpload bind:value={form.imageUrl} label="Image URL" /></div>
						<div><label>Category</label>
							<select bind:value={form.categoryId}>
								<option value="">--</option>
								{#each catList as c}<option value={c.id}>{c.name}</option>{/each}
							</select>
						</div>
						<div><label>Location</label>
							<select bind:value={form.locationId}>
								<option value="">--</option>
								{#each locList as l}<option value={l.id}>{l.name}</option>{/each}
							</select>
						</div>
						<div class="full"><label>Notes</label><textarea bind:value={form.notes}></textarea></div>
					</div>
					<button type="submit" class="btn-primary" style="margin-top:14px">Save Changes</button>
				</form>
			{:else}
				<div class="tab-body">
					{#if activeTab === 'details'}
						<div class="details-grid">
							<span class="detail-label">Category</span><span class="detail-val">{tool.category?.name ?? '-'}</span>
							<span class="detail-label">Location</span><span class="detail-val">{tool.location?.name ?? '-'}</span>
							<span class="detail-label">Brand</span><span class="detail-val">{tool.brand ?? '-'}</span>
							<span class="detail-label">Model</span><span class="detail-val">{tool.model ?? '-'}</span>
							<span class="detail-label">Serial Number</span><span class="detail-val">{tool.serialNumber ?? '-'}</span>
							<span class="detail-label">Description</span><span class="detail-val">{tool.description ?? '-'}</span>
							<span class="detail-label">Notes</span><span class="detail-val">{tool.notes ?? '-'}</span>
						</div>
					{:else if activeTab === 'checkouts'}
						<div class="filter-bar">
							<input type="search" bind:value={chkJob} placeholder="Search job #..." style="flex:1;min-width:120px;max-width:260px" />
							<input type="date" bind:value={chkDateFrom} placeholder="From" title="From date" style="width:120px" />
							<input type="date" bind:value={chkDateTo} placeholder="To" title="To date" style="width:120px" />
							{#if checkouts.length > 0}
								<div style="display:flex;gap:6px;flex-shrink:0">
									<button class="btn-ghost btn-sm" onclick={chkExportSummary}>Export Summary</button>
									<button class="btn-ghost btn-sm" onclick={chkExportCSV}>Export Records</button>
								</div>
							{/if}
						</div>
						{#if checkouts.length === 0}
							<div class="empty-state">No checkouts recorded yet.</div>
						{:else if filteredCheckouts.length === 0}
							<div class="empty-state">No checkouts match the filters.</div>
						{:else}
							<div class="table-wrap">
								<table>
									<thead>
										<tr><th>Date Out</th><th>By</th><th style="width:120px">Job #</th><th>Site</th><th>Date In</th><th></th></tr>
									</thead>
									<tbody>
										{#each filteredCheckouts as c}
											<tr>
												<td>{new Date(c.checkedOutAt).toLocaleString()}</td>
												<td>{c.checkedOutBy}</td>
												<td>
													{#if c.jobNumber}
														<a href="/jobs/{c.jobNumber}" class="job-pill" onclick={(e) => e.stopPropagation()}>{c.jobNumber}</a>
													{:else}<span class="job-pill">-</span>{/if}
												</td>
												<td>{c.jobSite ?? '-'}</td>
												<td>{c.checkedInAt ? new Date(c.checkedInAt).toLocaleString() : 'Out'}</td>
												<td>
													<button class="btn-del btn-sm" onclick={() => deleteCheckout(c.id)}>
														<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg>
													</button>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					{:else if activeTab === 'maintenance'}
						<div style="padding:0 0 16px;border-bottom:1px solid var(--border-color);margin-bottom:16px">
							<h3 style="font-size:15px;font-weight:500;color:var(--text-primary);margin:0 0 12px 0">Log Maintenance</h3>
							<form onsubmit={(e) => { e.preventDefault(); doMaint(); }}>
								<div class="form-grid">
									<div><label>Type *</label>
										<select bind:value={maintForm.type}>
											<option value="repair">Repair</option>
											<option value="service">Service</option>
											<option value="calibration">Calibration</option>
											<option value="inspection">Inspection</option>
										</select>
									</div>
									<div><label>Flag</label>
										<select bind:value={maintForm.flagId}>
											<option value="">-- None --</option>
											{#each (tool?.maintenanceFlags ?? []) as f}
												<option value={f.id}>{f.type}{f.description ? `: ${f.description}` : ''}</option>
											{/each}
										</select>
									</div>
									<div><label>Date *</label><input type="date" bind:value={maintForm.date} required /></div>
									<div class="full"><label>Description</label><input bind:value={maintForm.description} /></div>
									<div><label>Performed By</label><input bind:value={maintForm.performedBy} /></div>
									<div><label>Cost</label><input type="number" step="0.01" bind:value={maintForm.cost} /></div>
									<div class="full"><label>Notes</label><input bind:value={maintForm.notes} /></div>
								</div>
								<button type="submit" class="btn-primary" style="margin-top:14px">Log</button>
							</form>
						</div>
						<div>
							<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
								<h3 style="font-size:15px;font-weight:500;color:var(--text-primary);margin:0">History</h3>
								{#if maint.length > 0}
									<div style="display:flex;gap:6px">
										<button class="btn-ghost btn-sm" onclick={maintExportSummary}>Export Summary</button>
										<button class="btn-ghost btn-sm" onclick={maintExportCSV}>Export Records</button>
									</div>
								{/if}
							</div>
							<div class="filter-bar" style="margin-bottom:12px">
								<select bind:value={maintType} style="width:130px">
									<option value="">All Types</option>
									<option value="repair">Repair</option>
									<option value="service">Service</option>
									<option value="calibration">Calibration</option>
									<option value="inspection">Inspection</option>
								</select>
								<input type="date" bind:value={maintDateFrom} placeholder="From" title="From date" style="width:120px" />
								<input type="date" bind:value={maintDateTo} placeholder="To" title="To date" style="width:120px" />
							</div>
							{#if filteredMaint.length === 0}
								<div class="empty-state">No maintenance records match filters.</div>
							{:else}
								<div class="table-wrap">
									<table>
										<thead><tr><th>Date</th><th>Type</th><th>Description</th><th>By</th><th>Cost</th><th></th></tr></thead>
										<tbody>
											{#each filteredMaint as m}
												<tr>
													<td>{new Date(m.date).toLocaleDateString()}</td>
													<td><span class="badge badge-{m.type}">{m.type}</span></td>
													<td>{m.description ?? '-'}</td>
													<td>{m.performedBy ?? '-'}</td>
													<td>{m.cost ? `$${Number(m.cost).toFixed(2)}` : '-'}</td>
													<td><button class="btn-del btn-sm" onclick={() => deleteMaint(m.id)}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button></td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{:else if activeTab === 'flags'}
						<div style="padding:0 0 16px;border-bottom:1px solid var(--border-color);margin-bottom:16px">
							<h3 style="font-size:15px;font-weight:500;color:var(--text-primary);margin:0 0 12px 0">Flag for Maintenance</h3>
							<form onsubmit={(e) => { e.preventDefault(); doFlag(); }}>
								<div class="form-grid">
									<div><label>Type *</label>
										<select bind:value={flagForm.type}>
											<option value="repair">Repair</option>
											<option value="service">Service</option>
											<option value="calibration">Calibration</option>
											<option value="inspection">Inspection</option>
										</select>
									</div>
									<div class="full"><label>Description</label><input bind:value={flagForm.description} /></div>
									<div><label>Reported By</label><input bind:value={flagForm.createdBy} /></div>
								</div>
								<button type="submit" class="btn-primary" style="margin-top:14px">Create Flag</button>
							</form>
						</div>
						<div>
							<h3 style="font-size:15px;font-weight:500;color:var(--text-primary);margin:0 0 12px 0">Current Flags</h3>
							{#if (tool?.maintenanceFlags ?? []).length === 0}
								<div class="empty-state">No maintenance flags.</div>
							{:else}
								{#each tool.maintenanceFlags as f}
									<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-color)">
				<span class="badge badge-{f.type}">{f.type}</span>
										<span style="flex:1;font-size:13px;color:var(--text-primary)">{f.description ?? '-'}</span>
										<span style="font-size:11px;color:var(--empty-text-secondary)">{f.createdBy ? `by ${f.createdBy}` : ''}</span>
									</div>
								{/each}
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="sidebar-panel">
			<div class="sidebar-card">
				{#if tool.imageUrl}
					<img src={tool.imageUrl} alt={tool.name} class="product-img" />
				{:else}
					<div class="no-img">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
						<span>No image added</span>
					</div>
				{/if}
				<div class="img-sub">
					<h4>{tool.name}</h4>
				</div>
			</div>

			<div class="sidebar-card">
				<div class="metric-block">
					<span class="metric-num">{checkouts.length}</span>
					<span class="metric-label">Total Checkouts</span>
				</div>
				<a href="/scan?code={tool.toolNumber}" class="btn-primary" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;box-sizing:border-box">
					<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M9.5 6.5v3h-3v-3zM11 5H5v6h6zm-1.5 9.5v3h-3v-3zM11 13H5v6h6zm6.5-6.5v3h-3v-3zM19 5h-6v6h6zm-6 8h1.5v1.5H13zm1.5 1.5H16V16h-1.5zM16 13h1.5v1.5H16zm-3 3h1.5v1.5H13zm1.5 1.5H16V19h-1.5zM16 16h1.5v1.5H16zm1.5-1.5H19V16h-1.5zm0 3H19V19h-1.5z"/></svg>
					Check Out
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
	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 20px;
		align-items: start;
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
</style>
