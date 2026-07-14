<script lang="ts">
	import { page } from '$app/stores';
	import { itemCategories } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';

	let list = $state<any[]>([]);
	let catName = $state('');
	let subName = $state('');
	let selectedCat = $state<number | null>(null);
	let loading = $state(true);

	let highlightId = $derived(Number($page.url.searchParams.get('highlight')) || 0);

	function load() { loading = true; itemCategories.list().then(l => list = l).finally(() => loading = false); }
	$effect(load);

	$effect(() => {
		if (!loading && highlightId) {
			const el = document.querySelector(`[data-id="${highlightId}"]`);
			if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
		}
	});

	function addCat() {
		if (!catName.trim()) return;
		itemCategories.create({ name: catName.trim() }).then(() => { catName = ''; load(); addToast('Category added', 'success'); }).catch(e => addToast(e.message, 'error'));
	}

	function removeCat(id: number) {
		itemCategories.remove(id).then(() => { load(); addToast('Category removed', 'success'); }).catch(e => addToast(e.message, 'error'));
	}

	async function addSub() {
		if (!subName.trim() || selectedCat === null) return;
		itemCategories.subCategories.create(selectedCat, { name: subName.trim() }).then(() => { subName = ''; load(); addToast('Sub-category added', 'success'); }).catch(e => addToast(e.message, 'error'));
	}

	function removeSub(id: number) {
		itemCategories.subCategories.remove(id).then(() => { load(); addToast('Sub-category removed', 'success'); }).catch(e => addToast(e.message, 'error'));
	}
</script>

<div class="page-header">
	<h1>Item Categories</h1>
</div>

<div class="card" style="margin-bottom:10px">
	<div class="form-row">
		<input bind:value={catName} placeholder="Category name" />
		<button onclick={addCat} class="btn-primary">Add Category</button>
	</div>
</div>

{#if loading}
	<div class="card"><div class="sk-card"><div class="sk-line sk" style="width:30%"></div><div class="sk-line sk" style="width:60%"></div></div></div>
	<div class="card"><div class="sk-card"><div class="sk-line sk" style="width:40%"></div><div class="sk-line sk" style="width:50%"></div></div></div>
	<div class="card"><div class="sk-card"><div class="sk-line sk" style="width:25%"></div><div class="sk-line sk" style="width:55%"></div></div></div>
{:else if list.length === 0}
	<div class="card">
		<div class="empty-state">No categories found.</div>
	</div>
{:else}
	{#each list as cat}
		<div class="card cat-card" data-id={cat.id} class:highlight={cat.id === highlightId}>
			<div class="cat-header">
				<strong>{cat.name}</strong>
				<button class="btn-del btn-sm" onclick={() => removeCat(cat.id)}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button>
			</div>

			<div class="form-row" style="margin-top:10px">
				<input bind:value={subName} placeholder="Sub-category name" />
				<button class="btn-sm" onclick={() => { selectedCat = cat.id; addSub(); }}>Add Sub</button>
			</div>

			{#if cat.subCategories?.length}
				<div class="sub-list">
					{#each cat.subCategories as sub}
						<span class="sub-item">
							{sub.name}
							<button class="btn-del btn-sm" onclick={() => removeSub(sub.id)}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button>
						</span>
					{/each}
				</div>
{/if}

<style>
	.card.highlight {
		animation: glow 2s ease-out;
	}
	@keyframes glow {
		0% { background: color-mix(in srgb, var(--accent) 30%, transparent); }
		100% { background: transparent; }
	}
</style>
		</div>
	{/each}
{/if}
