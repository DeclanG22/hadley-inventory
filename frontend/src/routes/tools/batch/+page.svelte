<script lang="ts">
	import { tools, locations, toolCategories } from '$lib/api';

	let locList = $state<any[]>([]);
	let catList = $state<any[]>([]);

	let form = $state({
		quantity: '',
		toolNumberPrefix: '',
		name: '', description: '', brand: '', model: '',
		serialNumber: '', qrCode: '', notes: '', categoryId: '', locationId: '',
	});
	let saved = $state(false);
	let created = $state<any[]>([]);
	let error = $state('');

	function loadRefs() {
		locations.list().then(l => locList = l);
		toolCategories.list().then(l => catList = l);
	}
	$effect(loadRefs);

	async function submit() {
		error = '';
		const qty = Number(form.quantity);
		if (!qty || qty < 1) { error = 'Quantity must be at least 1.'; return; }
		if (!form.toolNumberPrefix.trim()) { error = 'Tool number prefix is required.'; return; }
		if (!form.name.trim()) { error = 'Name is required.'; return; }
		const data: any = { quantity: qty, toolNumberPrefix: form.toolNumberPrefix.trim(), name: form.name.trim() };
		if (form.description) data.description = form.description;
		if (form.brand) data.brand = form.brand;
		if (form.model) data.model = form.model;
		if (form.serialNumber) data.serialNumber = form.serialNumber;
		if (form.qrCode) data.qrCode = form.qrCode;
		if (form.notes) data.notes = form.notes;
		if (form.categoryId) data.categoryId = Number(form.categoryId);
		if (form.locationId) data.locationId = Number(form.locationId);
		try {
			const result = await tools.batchCreate(data);
			created = result;
			saved = true;
		} catch (e: any) {
			error = e.message;
		}
	}
</script>

<div class="page-header">
	<h1>Batch Create Tools</h1>
	<a href="/tools" class="btn-ghost btn-sm">Back to Tools</a>
</div>

{#if saved}
	<div class="card success-card">
		<p>Created {created.length} tools!</p>
		<div class="table-wrap" style="margin-top:12px">
			<table>
				<thead><tr><th>Tool #</th><th>Name</th></tr></thead>
				<tbody>
					{#each created as t}
						<tr><td><a href="/tools/{t.id}">{t.toolNumber}</a></td><td>{t.name}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		<a href="/tools" class="btn btn-primary" style="margin-top:12px">Done</a>
	</div>
{:else}
	<form class="card" onsubmit={(e) => { e.preventDefault(); submit(); }}>
		<div class="card-header"><h2>Batch Details</h2></div>
		{#if error}
			<p style="color:var(--red);font-size:13px;margin-bottom:8px">{error}</p>
		{/if}
		<div class="form-grid">
			<div><label>Quantity *</label><input type="number" min="1" bind:value={form.quantity} required /></div>
			<div><label>Tool # Prefix *</label><input bind:value={form.toolNumberPrefix} placeholder="e.g. HAM" required /></div>
			<div class="full"><label>Name *</label><input bind:value={form.name} required /></div>
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
		<button type="submit" style="margin-top:12px" class="btn-primary">Create {form.quantity || '?'} Tools</button>
	</form>
{/if}
