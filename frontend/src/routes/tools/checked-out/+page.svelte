<script lang="ts">
	import { goto } from '$app/navigation';
	import { tools } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';

	let allTools = $state<any[]>([]);
	let loading = $state(true);

	let checked = $derived(allTools.filter((t: any) => t.checkouts?.length > 0));

	$effect(() => {
		loading = true;
		tools.list().then(l => allTools = l).finally(() => loading = false);
	});

	async function checkin(toolId: number) {
		try {
			await tools.checkin(toolId);
			addToast('Tool checked in', 'success');
			tools.list().then(l => allTools = l);
		} catch (e: any) { addToast(e.message, 'error'); }
	}
</script>

<div class="page-header">
	<h1>Checked Out Tools</h1>
	<a href="/tools" class="btn-ghost btn-sm">All Tools</a>
</div>

<div class="card">
	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:22%"></div><div class="sk-cell sk" style="width:16%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:25%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:10%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:20%"></div><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:15%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:10%"></div></div>
		</div>
	{:else if checked.length === 0}
		<div class="empty-state">No tools are currently checked out.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Tool #</th>
						<th>Name</th>
						<th>Checked Out By</th>
						<th>Job #</th>
						<th>Job Site</th>
						<th>Checked Out</th>
						<th>Expected Return</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each checked as t}
						{@const co = t.checkouts[0]}
						<tr onclick={() => goto(`/tools/${t.id}`)}>
							<td><a href="/tools/{t.id}" onclick={(e) => e.stopPropagation()}>{t.toolNumber}</a></td>
							<td>{t.name}</td>
							<td>{co.checkedOutBy}</td>
							<td>{co.jobNumber ?? '-'}</td>
							<td>{co.jobSite ?? '-'}</td>
							<td style="white-space:nowrap">{new Date(co.checkedOutAt).toLocaleDateString()}</td>
							<td style="white-space:nowrap">{co.expectedReturnAt ? new Date(co.expectedReturnAt).toLocaleDateString() : '-'}</td>
							<td><button class="btn btn-sm" style="background:var(--green);color:white;border:none" onclick={(e) => { e.stopPropagation(); checkin(t.id); }}>Check In</button></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
