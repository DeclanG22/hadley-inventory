<script lang="ts">
	import { vendors } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';

	let list = $state<any[]>([]);
	let name = $state('');
	let loading = $state(true);

	function load() { loading = true; vendors.list().then(l => list = l).finally(() => loading = false); }
	$effect(load);

	function add() {
		if (!name.trim()) return;
		vendors.create({ name: name.trim() }).then(() => { name = ''; load(); addToast('Vendor added', 'success'); }).catch(e => addToast(e.message, 'error'));
	}

	function remove(id: number) {
		vendors.remove(id).then(() => { load(); addToast('Vendor removed', 'success'); }).catch(e => addToast(e.message, 'error'));
	}
</script>

<div class="page-header">
	<h1>Vendors</h1>
</div>

<div class="card" style="margin-bottom:10px">
	<div class="form-row">
		<input bind:value={name} placeholder="Vendor name" />
		<button onclick={add} class="btn-primary">Add</button>
	</div>
</div>

<div class="card">
	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell" style="width:8%"></div><div class="sk-cell" style="width:40%"></div><div class="sk-cell" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell" style="width:8%"></div><div class="sk-cell" style="width:35%"></div><div class="sk-cell" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell" style="width:8%"></div><div class="sk-cell" style="width:45%"></div><div class="sk-cell" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell" style="width:8%"></div><div class="sk-cell" style="width:30%"></div><div class="sk-cell" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell" style="width:8%"></div><div class="sk-cell" style="width:38%"></div><div class="sk-cell" style="width:12%"></div></div>
		</div>
	{:else if list.length === 0}
		<div class="empty-state">No vendors found.</div>
	{:else}
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
	{/if}
</div>
