<script lang="ts">
	import { toolCategories } from '$lib/api';

	let list = $state<any[]>([]);
	let name = $state('');

	function load() { toolCategories.list().then(l => list = l); }
	$effect(load);

	function add() {
		if (!name.trim()) return;
		toolCategories.create({ name: name.trim() }).then(() => { name = ''; load(); });
	}

	function remove(id: number) {
		toolCategories.remove(id).then(load);
	}
</script>

<div class="page-header">
	<h1>Tool Categories</h1>
</div>

<div class="card" style="margin-bottom:10px">
	<div class="form-row">
		<input bind:value={name} placeholder="Category name" />
		<button onclick={add} class="btn-primary">Add</button>
	</div>
</div>

<div class="card">
	<div class="table-wrap">
		<table>
			<thead><tr><th>ID</th><th>Name</th><th></th></tr></thead>
			<tbody>
				{#each list as v}
					<tr>
						<td>{v.id}</td>
						<td>{v.name}</td>
						<td><button class="btn-ghost btn-sm" onclick={() => remove(v.id)}>Delete</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if list.length === 0}
		<div class="empty-state">No categories found.</div>
	{/if}
</div>
