<script lang="ts">
	import { items, tools, vendors, locations, itemCategories, toolCategories } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';
	import { confirm } from '$lib/confirmDialog.svelte';

	let deletedItems = $state<any[]>([]);
	let deletedTools = $state<any[]>([]);
	let deletedVendors = $state<any[]>([]);
	let deletedLocations = $state<any[]>([]);
	let deletedItemCats = $state<any[]>([]);
	let deletedToolCats = $state<any[]>([]);
	let deletedSubCats = $state<any[]>([]);
	let loading = $state(true);

	function load() {
		loading = true;
		Promise.all([
			items.deleted().then(d => deletedItems = d).catch(() => {}),
			tools.deleted().then(d => deletedTools = d).catch(() => {}),
			vendors.deleted().then(d => deletedVendors = d).catch(() => {}),
			locations.deleted().then(d => deletedLocations = d).catch(() => {}),
			itemCategories.deleted().then(d => deletedItemCats = d).catch(() => {}),
			toolCategories.deleted().then(d => deletedToolCats = d).catch(() => {}),
			itemCategories.subCategories.deleted().then(d => deletedSubCats = d).catch(() => {}),
		]).finally(() => loading = false);
	}
	$effect(load);

	async function restore(api: any, id: number, label: string) {
		try {
			await api.restore(id);
			addToast(`${label} restored`, 'success');
			load();
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	async function permanentDelete(api: any, id: number, label: string) {
		const ok = await confirm(`Permanently delete ${label}? This cannot be undone.`);
		if (!ok) return;
		try {
			await api.permanentRemove(id);
			addToast(`${label} permanently deleted`, 'success');
			load();
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	function count(api: any, id: number) {
		return 0;
	}

	const sections = $derived([
		{ label: 'Items', data: deletedItems, api: items, name: (d: any) => `${d.itemNumber} — ${d.description}`, sub: (d: any) => d.location?.name },
		{ label: 'Tools', data: deletedTools, api: tools, name: (d: any) => `${d.toolNumber} — ${d.name}`, sub: (d: any) => d.location?.name },
		{ label: 'Vendors', data: deletedVendors, api: vendors, name: (d: any) => d.name, sub: () => '' },
		{ label: 'Locations', data: deletedLocations, api: locations, name: (d: any) => d.name, sub: () => '' },
		{ label: 'Item Categories', data: deletedItemCats, api: itemCategories, name: (d: any) => d.name, sub: () => '' },
		{ label: 'Item Sub-Categories', data: deletedSubCats, api: itemCategories.subCategories, name: (d: any) => `${d.name} (${d.itemCategory?.name ?? '?'})`, sub: () => '' },
		{ label: 'Tool Categories', data: deletedToolCats, api: toolCategories, name: (d: any) => d.name, sub: () => '' },
	].filter(s => s.data.length > 0));
</script>

<div class="page-header">
	<h1>Recently Deleted</h1>
</div>

{#if loading}
	<div class="card"><div class="sk-table">
		<div class="sk-row"><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:40%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:15%"></div></div>
		<div class="sk-row"><div class="sk-cell sk" style="width:25%"></div><div class="sk-cell sk" style="width:45%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:15%"></div></div>
		<div class="sk-row"><div class="sk-cell sk" style="width:35%"></div><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:20%"></div></div>
	</div></div>
{:else if sections.length === 0}
	<div class="card"><div class="empty-state">No recently deleted items.</div></div>
{:else}
	{#each sections as sec}
		<div class="card">
			<div class="card-header"><h2>{sec.label} ({sec.data.length})</h2></div>
			<div class="table-wrap">
				<table>
					<thead><tr><th>Name</th><th>Deleted</th><th></th></tr></thead>
					<tbody>
						{#each sec.data as d}
							<tr>
								<td>
									{sec.name(d)}
									{#if sec.sub(d)}<span style="font-size:12px;color:var(--empty-text-primary);display:block">{sec.sub(d)}</span>{/if}
								</td>
								<td style="white-space:nowrap">{new Date(d.deletedAt).toLocaleDateString()}</td>
								<td style="text-align:right;white-space:nowrap">
									<button class="btn-ghost btn-sm" onclick={() => restore(sec.api, d.id, sec.label)}>Restore</button>
									<button class="btn-ghost btn-sm" style="color:var(--red)" onclick={() => permanentDelete(sec.api, d.id, sec.label)}>Delete Forever</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/each}
{/if}
