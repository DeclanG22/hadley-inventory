<script lang="ts">
	import { tools } from '$lib/api';

	let list = $state<any[]>([]);
	let search = $state('');

	function load() { tools.list(search || undefined).then(l => list = l); }
	$effect(load);

	function remove(id: number) {
		if (!confirm('Delete this tool?')) return;
		tools.remove(id).then(load);
	}

	function status(t: any): string {
		return t.checkouts?.length > 0 ? 'Checked Out' : 'Available';
	}
</script>

<div class="page-header">
	<h1>Tools</h1>
	<div style="display:flex;gap:6px">
		<a href="/tools/new" class="btn btn-primary">+ New Tool</a>
		<a href="/tools/batch" class="btn">Batch</a>
	</div>
</div>

<div class="card">
	<div class="search-bar">
		<input type="search" bind:value={search} placeholder="Search tools by number, name, brand, or model..." oninput={load} />
	</div>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Tool #</th>
					<th>Name</th>
					<th>Brand</th>
					<th>Model</th>
					<th>Category</th>
					<th>Status</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each list as t}
					<tr>
						<td>
							{#if t.imageUrl}
								<img src={t.imageUrl} alt="" class="item-thumb" />
							{/if}
							<a href="/tools/{t.id}">{t.toolNumber}</a>
						</td>
						<td>{t.name}</td>
						<td>{t.brand ?? '-'}</td>
						<td>{t.model ?? '-'}</td>
						<td>{t.category?.name ?? '-'}</td>
						<td><span class="badge {status(t) === 'Checked Out' ? 'badge-checked-out' : 'badge-available'}">{status(t)}</span></td>
						<td><button class="btn-ghost btn-sm" onclick={() => remove(t.id)}>Delete</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if list.length === 0}
		<div class="empty-state">No tools found.</div>
	{/if}
</div>
