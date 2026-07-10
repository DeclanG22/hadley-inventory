<script lang="ts">
	import { tools, locations, toolCategories } from '$lib/api';
	let { params } = $props();

	let tool = $state<any>(null);
	let checkouts = $state<any[]>([]);
	let maint = $state<any[]>([]);
	let editing = $state(false);
	let locList = $state<any[]>([]);
	let catList = $state<any[]>([]);
	let form = $state<any>({});

	let checkoutForm = $state({ checkedOutBy: '', jobNumber: '', jobSite: '', expectedReturnAt: '', notes: '' });
	let maintForm = $state({ type: 'repair', description: '', date: new Date().toISOString().slice(0,10), performedBy: '', cost: '', notes: '' });

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

	function resetForm(t: any) {
		form = {
			toolNumber: t.toolNumber, name: t.name, description: t.description ?? '',
			brand: t.brand ?? '', model: t.model ?? '', serialNumber: t.serialNumber ?? '',
			qrCode: t.qrCode ?? '', imageUrl: t.imageUrl ?? '', notes: t.notes ?? '',
			categoryId: t.categoryId ?? '', locationId: t.locationId ?? '',
		};
	}

	async function save() {
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
	}

	async function doCheckout() {
		const id = Number(params.id);
		const data: any = { checkedOutBy: checkoutForm.checkedOutBy };
		if (checkoutForm.jobNumber) data.jobNumber = checkoutForm.jobNumber;
		if (checkoutForm.jobSite) data.jobSite = checkoutForm.jobSite;
		if (checkoutForm.expectedReturnAt) data.expectedReturnAt = checkoutForm.expectedReturnAt;
		if (checkoutForm.notes) data.notes = checkoutForm.notes;
		await tools.checkout(id, data);
		checkoutForm = { checkedOutBy: '', jobNumber: '', jobSite: '', expectedReturnAt: '', notes: '' };
		load();
	}

	async function doCheckin() {
		const id = Number(params.id);
		await tools.checkin(id);
		load();
	}

	async function doMaint() {
		const id = Number(params.id);
		const data: any = { type: maintForm.type, date: maintForm.date };
		if (maintForm.description) data.description = maintForm.description;
		if (maintForm.performedBy) data.performedBy = maintForm.performedBy;
		if (maintForm.cost) data.cost = Number(maintForm.cost);
		if (maintForm.notes) data.notes = maintForm.notes;
		await tools.maintenance.create(id, data);
		maintForm = { type: 'repair', description: '', date: new Date().toISOString().slice(0,10), performedBy: '', cost: '', notes: '' };
		load();
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
</script>

{#if !tool}
	<div class="loading">Loading...</div>
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
				<div><label>QR Code</label><input bind:value={form.qrCode} placeholder="Optional QR data" /></div>
				<div><label>Image URL</label><input bind:value={form.imageUrl} placeholder="https://..." /></div>
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
				<span>Category:</span><span>{tool.category?.name ?? '-'}</span>
				<span>Location:</span><span>{tool.location?.name ?? '-'}</span>
				<span>Notes:</span><span>{tool.notes ?? '-'}</span>
			</div>
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
			<form onsubmit={(e) => { e.preventDefault(); doCheckout(); }}>
				<div class="form-grid">
					<div class="full"><label>Checked Out By *</label><input bind:value={checkoutForm.checkedOutBy} required /></div>
					<div><label>Job Number</label><input bind:value={checkoutForm.jobNumber} /></div>
					<div><label>Job Site</label><input bind:value={checkoutForm.jobSite} /></div>
					<div><label>Expected Return</label><input type="date" bind:value={checkoutForm.expectedReturnAt} /></div>
					<div class="full"><label>Notes</label><input bind:value={checkoutForm.notes} /></div>
				</div>
				<button type="submit" style="margin-top:12px" class="btn-primary">Check Out</button>
			</form>
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
					<thead><tr><th>Date Out</th><th>By</th><th>Job</th><th>Site</th><th>Date In</th></tr></thead>
					<tbody>
						{#each filteredCheckouts as c}
							<tr>
								<td>{new Date(c.checkedOutAt).toLocaleString()}</td>
								<td>{c.checkedOutBy}</td>
								<td>{c.jobNumber ?? '-'}</td>
								<td>{c.jobSite ?? '-'}</td>
								<td>{c.checkedInAt ? new Date(c.checkedInAt).toLocaleString() : 'Out'}</td>
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
					<thead><tr><th>Date</th><th>Type</th><th>Description</th><th>By</th><th>Cost</th></tr></thead>
					<tbody>
						{#each filteredMaint as m}
							<tr>
								<td>{new Date(m.date).toLocaleDateString()}</td>
								<td><span class="badge">{m.type}</span></td>
								<td>{m.description ?? '-'}</td>
								<td>{m.performedBy ?? '-'}</td>
								<td>{m.cost ? `$${Number(m.cost).toFixed(2)}` : '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}
