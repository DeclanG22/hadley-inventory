<script lang="ts">
	import { tools, locations, toolCategories } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';
	import { confirm } from '$lib/confirmDialog.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	let { params } = $props();

	let tool = $state<any>(null);
	let checkouts = $state<any[]>([]);
	let maint = $state<any[]>([]);
	let editing = $state(false);
	let locList = $state<any[]>([]);
	let catList = $state<any[]>([]);
	let form = $state<any>({});

	let maintForm = $state({ type: 'repair', description: '', date: new Date().toISOString().slice(0,10), performedBy: '', cost: '', notes: '', flagId: '' });
	let flagForm = $state({ open: false, type: 'repair', description: '', createdBy: '' });

	let chkDateFrom = $state('');
	let chkDateTo = $state('');
	let chkJob = $state('');

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

	async function doCheckin() {
		try {
			const id = Number(params.id);
			await tools.checkin(id);
			load();
			addToast('Tool checked in', 'success');
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

	async function deleteCheckout(coId: number) {
		const ok = await confirm('Delete Checkout', 'This will permanently remove this checkout record.');
		if (!ok) return;
		try {
			await tools.checkouts.remove(coId);
			load();
			addToast('Checkout deleted', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	async function doFlag() {
		try {
			await tools.maintenanceFlags.create(Number(params.id), { type: flagForm.type, description: flagForm.description || undefined, createdBy: flagForm.createdBy || undefined });
			addToast('Maintenance flag created', 'success');
			flagForm = { open: false, type: 'repair', description: '', createdBy: '' };
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
</script>

{#if !tool}
	<div class="card"><div class="sk-detail">
		<div class="sk-line sk" style="width:30%;height:24px"></div>
		<div class="sk-line sk" style="width:50%"></div>
		<div class="sk-line sk" style="width:40%"></div>
		<div style="height:20px"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:60%"></div>
	</div></div>
{:else}
	<div class="page-header">
		<div>
			<h1>{tool.toolNumber} — {tool.name}</h1>
			<p style="color:var(--empty-text-primary);font-size:13px;margin-top:2px">{tool.brand}{tool.model ? ` ${tool.model}` : ''}{tool.serialNumber ? ` (S/N: ${tool.serialNumber})` : ''}</p>
		</div>
		<div class="page-header-actions">
			{#if openCheckout()}
				<button class="btn btn-sm" onclick={doCheckin}>Check In</button>
			{:else}
				<span class="badge badge-available">Available</span>
			{/if}
			<button class="btn-ghost btn-sm" style="color:var(--orange)" onclick={() => flagForm.open = !flagForm.open}>{flagForm.open ? 'Cancel' : 'Flag'}</button>
			<button class="btn-ghost btn-sm" onclick={() => editing = !editing}>{editing ? 'Cancel' : 'Edit'}</button>
		</div>
	</div>

	{#if editing}
		<form class="card" style="margin-top:0" onsubmit={(e) => { e.preventDefault(); save(); }}>
			<div class="card-header"><h2>Edit Tool</h2></div>
			<div class="form-grid">
				<div class="full"><label>Tool Number</label><input bind:value={form.toolNumber} required /></div>
				<div class="full"><label>Name</label><input bind:value={form.name} required /></div>
				<div class="full"><label>Description</label><input bind:value={form.description} /></div>
				<div><label>Brand</label><input bind:value={form.brand} /></div>
				<div><label>Model</label><input bind:value={form.model} /></div>
				<div><label>Serial Number</label><input bind:value={form.serialNumber} /></div>
				<ImageUpload bind:value={form.imageUrl} label="Image URL" />
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
			<button type="submit" style="margin-top:12px">Save Changes</button>
		</form>
	{:else}
		<div class="card" style="margin-top:0">
			<div class="card-header"><h2>Details</h2></div>
			{#if tool.imageUrl}
				<img src={tool.imageUrl} alt="" class="detail-image" />
			{/if}
			<div class="detail-grid">

<span>
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
        <path d="M0 0h24v24H0z" fill="none" />
        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 3h6m-3-3v6" />
    </svg>
    Category:
</span>
<span>{tool.category?.name ?? '-'}
</span>
<span>
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
       	<path d="M0 0h24v24H0z" fill="none" />
       	<path fill="currentColor" d="M16 10c0-2.21-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4m-6 0c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2" />
       	<path fill="currentColor" d="M11.42 21.81c.17.12.38.19.58.19s.41-.06.58-.19c.3-.22 7.45-5.37 7.42-11.82c0-4.41-3.59-8-8-8s-8 3.59-8 8c-.03 6.44 7.12 11.6 7.42 11.82M12 4c3.31 0 6 2.69 6 6c.02 4.44-4.39 8.43-6 9.74c-1.61-1.31-6.02-5.29-6-9.74c0-3.31 2.69-6 6-6" />
    </svg>
    Location:</span><span>{tool.location?.name ?? '-'}</span>
<span>
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<path fill="currentColor" d="M4 18q-.425 0-.712-.288T3 17t.288-.712T4 16h10q.425 0 .713.288T15 17t-.288.713T14 18zm0-5q-.425 0-.712-.288T3 12t.288-.712T4 11h16q.425 0 .713.288T21 12t-.288.713T20 13zm0-5q-.425 0-.712-.288T3 7t.288-.712T4 6h16q.425 0 .713.288T21 7t-.288.713T20 8z" />
    </svg>

    Notes:</span><span>{tool.notes ?? '-'}</span>
			</div>
		</div>
	{/if}

	{#if flagForm.open}
		<div class="card" style="margin-top:10px">
			<div class="card-header"><h2>Flag for Maintenance</h2></div>
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
				<button type="submit" style="margin-top:12px" class="btn-primary">Create Flag</button>
			</form>
		</div>
	{/if}

	<!-- Checkout / Checkin -->
	<div class="card" style="margin-top:10px">
		<div class="card-header"><h2>Check Out Tool</h2></div>
		{#if openCheckout()}
			<p style="color:var(--empty-text-primary);font-size:13px">
				Currently checked out by <strong style="color:var(--text-primary)">{openCheckout().checkedOutBy}</strong>
				on {new Date(openCheckout().checkedOutAt).toLocaleString()}
			</p>
		{:else}
			{#each tool?.maintenanceFlags ?? [] as f}
				<p style="margin:0 0 6px 0;font-size:11px;font-weight:600;text-transform:uppercase;color:#fff;background:var(--orange);display:inline-block;padding:2px 8px;border-radius:4px">Unresolved {f.type} flag</p>
			{/each}
			<p style="padding:0 0 4px;color:var(--text-secondary);font-size:13px">
				Go to the scan page to check out this tool.
			</p>
			<a href="/scan?code={tool.toolNumber}" class="btn-primary" style="display:inline-flex;align-items:center;gap:6px">
				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M9.5 6.5v3h-3v-3zM11 5H5v6h6zm-1.5 9.5v3h-3v-3zM11 13H5v6h6zm6.5-6.5v3h-3v-3zM19 5h-6v6h6zm-6 8h1.5v1.5H13zm1.5 1.5H16V16h-1.5zM16 13h1.5v1.5H16zm-3 3h1.5v1.5H13zm1.5 1.5H16V19h-1.5zM16 16h1.5v1.5H16zm1.5-1.5H19V16h-1.5zm0 3H19V19h-1.5z"/></svg>
				Scan to Check Out
			</a>
		{/if}
	</div>

	<!-- Checkout History -->
	<div class="card" style="margin-top:10px">
		<div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
			<h2>Checkout History</h2>
			{#if checkouts.length > 0}
				<div style="display:flex;gap:6px">
					<button class="btn-ghost btn-sm" onclick={chkExportSummary}>Export Summary</button>
					<button class="btn-ghost btn-sm" onclick={chkExportCSV}>Export Records</button>
				</div>
			{/if}
		</div>
		<div class="filter-bar" style="margin:0 16px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
			<input type="search" bind:value={chkJob} placeholder="Job #" style="flex:1;min-width:120px" />
			<input type="date" bind:value={chkDateFrom} placeholder="From" title="From date" style="width:130px" />
			<input type="date" bind:value={chkDateTo} placeholder="To" title="To date" style="width:130px" />
		</div>
		{#if filteredCheckouts.length === 0}
			<div class="empty-state">No checkouts match filters.</div>
		{:else}
			<div style="display:flex;justify-content:space-between;align-items:center;padding:0 16px 8px;font-size:13px;color:var(--text-secondary)">
				<span>Showing {filteredCheckouts.length} of {checkouts.length} checkout(s)</span>
			</div>
			<div class="table-wrap">
				<table>
					<thead><tr><th>Date Out</th><th>By</th><th>Job</th><th>Site</th><th>Date In</th><th></th></tr></thead>
					<tbody>
						{#each filteredCheckouts as c}
							<tr>
								<td>{new Date(c.checkedOutAt).toLocaleString()}</td>
								<td>{c.checkedOutBy}</td>
								<td><a href="/jobs/{c.jobNumber ?? '-'}" onclick={(e) => e.stopPropagation()}>{c.jobNumber ?? '-'}</a></td>
								<td>{c.jobSite ?? '-'}</td>
								<td>{c.checkedInAt ? new Date(c.checkedInAt).toLocaleString() : 'Out'}</td>
								<td><button class="btn-del btn-sm" onclick={() => deleteCheckout(c.id)}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Maintenance -->
	<div class="card" style="margin-top:10px">
		<div class="card-header"><h2>Log Maintenance</h2></div>
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
			<button type="submit" style="margin-top:12px" class="btn-primary">Log</button>
		</form>
	</div>

	<div class="card" style="margin-top:10px">
		<div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
			<h2>Maintenance History</h2>
			{#if maint.length > 0}
				<div style="display:flex;gap:6px">
					<button class="btn-ghost btn-sm" onclick={maintExportSummary}>Export Summary</button>
					<button class="btn-ghost btn-sm" onclick={maintExportCSV}>Export Records</button>
				</div>
			{/if}
		</div>
		<div class="filter-bar" style="margin:0 16px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
			<select bind:value={maintType} style="width:130px">
				<option value="">All Types</option>
				<option value="repair">Repair</option>
				<option value="service">Service</option>
				<option value="calibration">Calibration</option>
				<option value="inspection">Inspection</option>
			</select>
			<input type="date" bind:value={maintDateFrom} placeholder="From" title="From date" style="width:130px" />
			<input type="date" bind:value={maintDateTo} placeholder="To" title="To date" style="width:130px" />
		</div>
		{#if filteredMaint.length === 0}
			<div class="empty-state">No maintenance records match filters.</div>
		{:else}
			<div style="display:flex;justify-content:space-between;align-items:center;padding:0 16px 8px;font-size:13px;color:var(--text-secondary)">
				<span>Showing {filteredMaint.length} of {maint.length} record(s)</span>
				<span style="font-weight:600">Total Cost: ${filteredMaint.reduce((s, m) => s + (Number(m.cost) || 0), 0).toFixed(2)}</span>
			</div>
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
{/if}

<style>
    .btn-primary {
        border-radius: 8px;
        padding: 4px 8px;
    }
</style>
