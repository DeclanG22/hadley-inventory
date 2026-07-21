<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tools } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';

	let flags = $state<any[]>([]);
	let loading = $state(true);

	let highlightId = $derived(Number($page.url.searchParams.get('highlight')) || 0);

	function load() {
		loading = true;
		tools.maintenanceFlags.list().then(l => flags = l).finally(() => loading = false);
	}
	$effect(load);

	$effect(() => {
		if (!loading && highlightId) {
			const el = document.querySelector(`[data-id="${highlightId}"]`);
			if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
		}
	});

	async function resolveFlag(flagId: number) {
		try {
			await tools.maintenanceFlags.resolve(flagId, 'admin');
			addToast('Flag resolved', 'success');
			load();
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	async function removeFlag(flagId: number) {
		try {
			await tools.maintenanceFlags.remove(flagId);
			addToast('Flag removed', 'success');
			load();
		} catch (e: any) { addToast(e.message, 'error'); }
	}

	const typeColors: Record<string, string> = {
		repair: 'var(--red)',
		service: 'var(--orange)',
		calibration: 'var(--yellow)',
		inspection: 'var(--green)',
	};
</script>

<div class="page-header">
	<h1>Maintenance</h1>
	<a href="/tools" class="btn-ghost btn-sm">All Tools</a>
</div>

<div class="card">
	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:20%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:28%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:16%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:22%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:30%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:25%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:18%"></div></div>
		</div>
	{:else if flags.length === 0}
		<div class="empty-state">No maintenance flags. Tools looking good!</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Tool</th>
						<th>Type</th>
						<th>Description</th>
						<th>Reported By</th>
						<th>Date</th>
						<th>Status</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each flags as f}
						<tr data-id={f.id} class:highlight={f.id === highlightId}>
							<td><a href="/tools/{f.tool.id}">{f.tool.name}</a></td>
							<td><span style="color:{typeColors[f.type] ?? 'var(--text-secondary)'};font-weight:500">{f.type}</span></td>
							<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{f.description ?? '-'}</td>
							<td>{f.createdBy ?? '-'}</td>
							<td style="white-space:nowrap">{new Date(f.createdAt).toLocaleDateString()}</td>
							<td>
								{#if f.resolvedAt}
									<span class="badge badge-available">Resolved</span>
								{:else}
									<span class="badge badge-warning">Open</span>
								{/if}
							</td>
							<td>
								{#if !f.resolvedAt}
									<button class="btn-ghost btn-sm" style="color:var(--green)" onclick={() => resolveFlag(f.id)}>Resolve</button>
								{/if}
								<button class="btn-ghost btn-sm" style="color:var(--red)" onclick={() => removeFlag(f.id)}>Delete</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div style="padding:10px 6px;font-size:13px;color:var(--empty-text-primary)">
			{flags.filter(f => !f.resolvedAt).length} open &middot; {flags.filter(f => f.resolvedAt).length} resolved
		</div>
	{/if}
</div>

<style>
	tr.highlight {
		animation: glow 2s ease-out;
	}
	@keyframes glow {
		0% { background: color-mix(in srgb, var(--accent) 30%, transparent); }
		100% { background: transparent; }
	}
</style>
