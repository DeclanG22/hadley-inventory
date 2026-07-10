<script lang="ts">
	import { locations } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';

	let list = $state<any[]>([]);
	let name = $state('');
	let loading = $state(true);

	function load() { loading = true; locations.list().then(l => list = l).finally(() => loading = false); }
	$effect(load);

	function add() {
		if (!name.trim()) return;
		locations.create({ name: name.trim() }).then(() => { name = ''; load(); addToast('Location added', 'success'); }).catch(e => addToast(e.message, 'error'));
	}

	function remove(id: number) {
		locations.remove(id).then(() => { load(); addToast('Location removed', 'success'); }).catch(e => addToast(e.message, 'error'));
	}
</script>

<div class="page-header">
	<h1>Locations</h1>
</div>

<div class="card" style="margin-bottom:10px">
	<div class="form-row">
		<input bind:value={name} placeholder="Location name" />
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
		<div class="empty-state">No locations found.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead><tr><th>ID</th><th>Name</th><th></th></tr></thead>
				<tbody>
					{#each list as v}
						<tr>
							<td>{v.id}</td>
							<td>{v.name}</td>
							<td><button class="btn-del btn-sm" onclick={() => remove(v.id)}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"><path d="M0 0h14v14H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z" clip-rule="evenodd" /></svg></button></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
