<script lang="ts">
	import { itemCategories } from '$lib/api';

	let list = $state<any[]>([]);
	let catName = $state('');
	let subName = $state('');
	let selectedCat = $state<number | null>(null);

	function load() { itemCategories.list().then(l => list = l); }
	$effect(load);

	function addCat() {
		if (!catName.trim()) return;
		itemCategories.create({ name: catName.trim() }).then(() => { catName = ''; load(); });
	}

	function removeCat(id: number) {
		itemCategories.remove(id).then(load);
	}

	function addSub() {
		if (!subName.trim() || selectedCat === null) return;
		itemCategories.subCategories.create(selectedCat, { name: subName.trim() }).then(() => { subName = ''; load(); });
	}

	function removeSub(id: number) {
		itemCategories.subCategories.remove(id).then(load);
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

{#each list as cat}
	<div class="card cat-card">
		<div class="cat-header">
			<strong>{cat.name}</strong>
			<button class="btn-ghost btn-sm" onclick={() => removeCat(cat.id)}>Delete</button>
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
						<button class="btn-ghost btn-sm" onclick={() => removeSub(sub.id)}>x</button>
					</span>
				{/each}
			</div>
		{/if}
	</div>
{/each}

{#if list.length === 0}
	<div class="card">
		<div class="empty-state">No categories found.</div>
	</div>
{/if}
