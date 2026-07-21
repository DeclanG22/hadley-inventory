<script lang="ts">
	import { items, vendors, locations, itemCategories } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';

	let vendorsList = $state<any[]>([]);
	let locationsList = $state<any[]>([]);
	let catsList = $state<any[]>([]);
	let loading = $state(true);

	let form = $state({
		itemNumber: '', description: '', unit: '', unitPrice: '',
		weightPerUnit: '', analysisCode: '', headType: '', imageUrl: '', categoryId: '',
		subCategoryId: '', locationId: '', vendorId: '', onHand: '', minStock: '',
	});
	let subCats = $state<any[]>([]);
	let saved = $state(false);

	function loadRefs() {
		loading = true;
		Promise.all([
			vendors.list().then(l => vendorsList = l),
			locations.list().then(l => locationsList = l),
			itemCategories.list().then(l => catsList = l),
		]).finally(() => loading = false);
	}
	$effect(loadRefs);

	function onCategoryChange() {
		const id = Number(form.categoryId);
		if (!id) { subCats = []; form.subCategoryId = ''; return; }
		itemCategories.subCategories.list(id).then(l => subCats = l);
	}

	async function submit() {
		try {
			const data: any = {};
			for (const [k, v] of Object.entries(form)) {
				if (v === '') continue;
				if (['unitPrice','weightPerUnit'].includes(k)) data[k] = Number(v);
				else if (['categoryId','subCategoryId','locationId','vendorId','onHand','minStock'].includes(k)) data[k] = Number(v);
				else data[k] = v;
			}
			await items.create(data);
			saved = true;
			addToast('Item created', 'success');
		} catch (e: any) { addToast(e.message, 'error'); }
	}
</script>

<div class="page-header">
	<h1>New Item</h1>
	<a href="/items" class="btn-ghost btn-sm">Back</a>
</div>

{#if loading}
	<div class="card"><div class="sk-form">
		<div class="sk-line sk" style="width:100%"></div>
		<div class="sk-line sk" style="width:100%"></div>
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div style="display:flex;gap:16px"><div class="sk-line sk" style="width:50%"></div><div class="sk-line sk" style="width:50%"></div></div>
		<div class="sk-line sk" style="width:25%;height:36px;margin-top:12px;border-radius:6px"></div>
	</div></div>
{:else if saved}
	<div class="card success-card">
		<p>Item created!</p>
		<a href="/items" class="btn btn-primary">Back to Items</a>
	</div>
{:else}
	<form class="card" onsubmit={(e) => { e.preventDefault(); submit(); }}>
		<div class="card-header"><h2>Item Details</h2></div>
		<div class="form-grid">
			<div class="full"><label>Item Number *</label><input bind:value={form.itemNumber} required /></div>
			<div class="full"><label>Description *</label><input bind:value={form.description} required /></div>
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
		<button type="submit" style="margin-top:12px" class="btn-primary">Create Item</button>
	</form>
{/if}
