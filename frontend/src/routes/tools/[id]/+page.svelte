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
			qrCode: t.qrCode ?? '', notes: t.notes ?? '',
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
		<div class="card-header"><h2>Checkout History</h2></div>
		{#if checkouts.length === 0}
			<div class="empty-state">No checkouts recorded.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead><tr><th>Date Out</th><th>By</th><th>Job</th><th>Site</th><th>Date In</th></tr></thead>
					<tbody>
						{#each checkouts as c}
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
		<div class="card-header"><h2>Maintenance History</h2></div>
		{#if maint.length === 0}
			<div class="empty-state">No maintenance recorded.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead><tr><th>Date</th><th>Type</th><th>Description</th><th>By</th><th>Cost</th></tr></thead>
					<tbody>
						{#each maint as m}
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
