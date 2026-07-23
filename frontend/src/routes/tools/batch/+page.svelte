<script lang="ts">
	import { tools, locations, vendors } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';

	let locList = $state<any[]>([]);
	let vendorList = $state<any[]>([]);
	let loading = $state(true);

	let form = $state({
		quantity: '',
		name: '', description: '', heNumberStart: '',
		imageUrl: '', notes: '', vendorId: '', locationId: '',
	});
	let saved = $state(false);
	let created = $state<any[]>([]);
	let error = $state('');

	function loadRefs() {
		loading = true;
		Promise.all([
			locations.list().then(l => locList = l),
			vendors.list().then(l => vendorList = l),
		]).finally(() => loading = false);
	}
	$effect(loadRefs);

	async function submit() {
		error = '';
		const qty = Number(form.quantity);
		if (!qty || qty < 1) { error = 'Quantity must be at least 1.'; return; }
		if (!form.name.trim()) { error = 'Name is required.'; return; }
		const data: any = { quantity: qty, name: form.name.trim() };
		if (form.description) data.description = form.description;
		if (form.heNumberStart) data.heNumberStart = Number(form.heNumberStart);
		if (form.imageUrl) data.imageUrl = form.imageUrl;
		if (form.notes) data.notes = form.notes;
		if (form.vendorId) data.vendorId = Number(form.vendorId);
		if (form.locationId) data.locationId = Number(form.locationId);
		try {
			const result = await tools.batchCreate(data);
			created = result;
			saved = true;
			addToast(`Created ${result.length} tools`, 'success');
		} catch (e: any) {
			error = e.message;
			addToast(e.message, 'error');
		}
	}
</script>

<div class="page-header">
	<h1>Batch Create Tools</h1>
	<a href="/tools" class="btn-ghost btn-sm">Back to Tools</a>
</div>

{#if loading}
	<div class="card"><div class="sk-form">
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div class="sk-line sk" style="width:30%;height:36px;margin-top:12px;border-radius:6px"></div>
	</div></div>
{:else if saved}
	<div class="card success-card">
		<p>Created {created.length} tools!</p>
		<div class="table-wrap" style="margin-top:12px">
			<table>
				<thead><tr><th>Name</th><th>HE #</th></tr></thead>
				<tbody>
					{#each created as t}
						<tr><td><a href="/tools/{t.id}">{t.name}</a></td><td>{t.heNumber ?? '-'}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		<a href="/tools" class="btn btn-primary" style="margin-top:28px;display:inline-block">Done</a>
	</div>
{:else}
	<form class="card" onsubmit={(e) => { e.preventDefault(); submit(); }}>
		<div class="card-header"><h2>Batch Details</h2></div>
		{#if error}
			<p style="color:var(--red);font-size:13px;margin-bottom:8px">{error}</p>
		{/if}
		<div class="form-grid">
			<div><label>Quantity *</label><input type="number" min="1" bind:value={form.quantity} required /></div>
			<div><label>HE # Start</label><input type="number" min="0" bind:value={form.heNumberStart} placeholder="e.g. 600" /></div>
			<div class="full"><label>Name *</label><input bind:value={form.name} required /></div>
			<div class="full"><label>Description</label><input bind:value={form.description} /></div>
			<ImageUpload bind:value={form.imageUrl} label="Image URL" />
			<div><label>Vendor</label>
				<select bind:value={form.vendorId}>
					<option value="">--</option>
					{#each vendorList as v}<option value={v.id}>{v.name}</option>{/each}
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

<style>
	.success-card table th,
	.success-card table td {
		padding: 8px 6px;
	}
</style>
