<script lang="ts">
	import { tools, locations, vendors } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';

	let locList = $state<any[]>([]);
	let vendorList = $state<any[]>([]);
	let loading = $state(true);

	let form = $state({
		name: '', description: '', heNumber: '',
		serialNumber: '', imageUrl: '', notes: '', vendorId: '', locationId: '',
	});
	let saved = $state(false);

	function loadRefs() {
		loading = true;
		Promise.all([
			locations.list().then(l => locList = l),
			vendors.list().then(l => vendorList = l),
		]).finally(() => loading = false);
	}
	$effect(loadRefs);

	async function submit() {
		try {
			const data: any = {};
			for (const [k, v] of Object.entries(form)) {
				if (v === '') continue;
				if (['vendorId','locationId'].includes(k)) data[k] = Number(v);
				else data[k] = v;
			}
			await tools.create(data);
			saved = true;
			addToast('Tool created', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}
</script>

<div class="page-header">
	<h1>New Tool</h1>
	<a href="/tools" class="btn-ghost btn-sm">Back</a>
</div>

{#if loading}
	<div class="card"><div class="sk-form">
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div class="sk-line sk" style="width:30%;height:36px;margin-top:12px;border-radius:6px"></div>
	</div></div>
{:else if saved}
	<div class="card success-card">
		<p>Tool created!</p>
		<a href="/tools" class="btn btn-primary">Back to Tools</a>
	</div>
{:else}
	<form class="card" onsubmit={(e) => { e.preventDefault(); submit(); }}>
		<div class="card-header"><h2>Tool Details</h2></div>
		<div class="form-grid">
			<div class="full"><label>Name *</label><input bind:value={form.name} required /></div>
			<div class="full"><label>Description</label><input bind:value={form.description} /></div>
			<div><label>HE #</label><input bind:value={form.heNumber} /></div>
			<div><label>Serial Number</label><input bind:value={form.serialNumber} /></div>
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
		<button type="submit" style="margin-top:12px" class="btn-primary">Create Tool</button>
	</form>
{/if}