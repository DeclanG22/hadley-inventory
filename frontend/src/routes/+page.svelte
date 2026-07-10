<script lang="ts">
	import { items, tools, vendors, locations, activity } from '$lib/api';

	let itemCount = $state(0);
	let toolCount = $state(0);
	let vendorCount = $state(0);
	let locationCount = $state(0);
	let checkedOut = $state(0);
	let lowStock = $state(0);
	let recentActivity = $state<any[]>([]);
	let loading = $state(true);
	let page = $state(1);
	const pageSize = 15;
	let totalPages = $derived(Math.max(1, Math.ceil(recentActivity.length / pageSize)));
	let paginated = $derived(recentActivity.slice((page - 1) * pageSize, page * pageSize));

	$effect(() => {
		Promise.all([
			items.list(undefined, { limit: 1 }).then(r => itemCount = r.total),
			items.lowStock().then(l => lowStock = l.length),
			tools.list().then(l => { toolCount = l.length; checkedOut = l.filter((t: any) => t.checkouts?.length > 0).length; }),
			vendors.list().then(l => vendorCount = l.length),
			locations.list().then(l => locationCount = l.length),
			activity.recent(100).then(l => { recentActivity = l; page = 1; }),
		]).finally(() => loading = false);
	});
</script>

<div class="page-header">
	<h1>Dashboard</h1>
</div>

<div class="stat-grid">
	{#if loading}
		<div class="stat-card"><div class="sk-stat"><div class="sk-circle sk"></div><div class="sk-line sk" style="width:60%"></div></div></div>
		<div class="stat-card"><div class="sk-stat"><div class="sk-circle sk"></div><div class="sk-line sk" style="width:70%"></div></div></div>
		<div class="stat-card"><div class="sk-stat"><div class="sk-circle sk"></div><div class="sk-line sk" style="width:50%"></div></div></div>
		<div class="stat-card"><div class="sk-stat"><div class="sk-circle sk"></div><div class="sk-line sk" style="width:65%"></div></div></div>
		<div class="stat-card"><div class="sk-stat"><div class="sk-circle sk"></div><div class="sk-line sk" style="width:55%"></div></div></div>
		<div class="stat-card"><div class="sk-stat"><div class="sk-circle sk"></div><div class="sk-line sk" style="width:60%"></div></div></div>
	{:else}
		<div class="stat-card">
			<span class="stat-value">{itemCount}</span>
			<span class="stat-label">Items</span>
		</div>
		<div class="stat-card warn">
			<span class="stat-value">{lowStock}</span>
			<span class="stat-label">Low Stock Items</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{toolCount}</span>
			<span class="stat-label">Tools</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{checkedOut}</span>
			<span class="stat-label">Checked Out Tools</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{vendorCount}</span>
			<span class="stat-label">Vendors</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{locationCount}</span>
			<span class="stat-label">Locations</span>
		</div>
	{/if}
</div>

<div class="card" style="margin-top:16px">
	<div class="card-header"><h2>Recent Activity</h2></div>
	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:50%"></div><div class="sk-cell sk" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:45%"></div><div class="sk-cell sk" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:55%"></div><div class="sk-cell sk" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:40%"></div><div class="sk-cell sk" style="width:12%"></div></div>
		</div>
	{:else if recentActivity.length === 0}
		<div class="empty-state">No activity yet.		</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead><tr><th>Date</th><th>Event</th><th>Ref</th></tr></thead>
				<tbody>
					{#each paginated as a}
						<tr>
							<td style="white-space:nowrap">{new Date(a.date).toLocaleString()}</td>
							<td>
								{#if a.direction === 'in'}
									<span style="color:var(--green);font-weight:500">In {a.qty}</span>
									<a href={a.link}> x {a.itemRef}</a>
								{:else if a.direction === 'out'}
									<span style="color:var(--red);font-weight:500">Out {a.qty}</span>
									<a href={a.link}> x {a.itemRef}</a>
								{:else if a.type === 'tool_checkout'}
									<span style="color:var(--orange);font-weight:500">Checked out</span>
									<a href={a.link}> {a.itemRef}</a>
								{:else if a.type === 'tool_checkin'}
									<span style="color:var(--green);font-weight:500">Checked in</span>
									<a href={a.link}> {a.itemRef}</a>
								{:else if a.type === 'tool_maintenance'}
									{@const colors: Record<string,string> = { repair: 'var(--red)', service: 'var(--orange)', calibration: 'var(--yellow)', inspection: 'var(--green)' }}
									<span style="color:{colors[a.subType] ?? 'var(--text-secondary)'};font-weight:500">{a.subType}</span>
									<a href={a.link}> {a.itemRef}</a>
								{:else}
									<a href={a.link}>{a.summary}</a>
								{/if}
							</td>
							<td>{a.itemRef}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if recentActivity.length > pageSize}
			<div class="pagination">
				<button class="btn-ghost btn-sm" disabled={page <= 1} onclick={() => page--}>Prev</button>
				<span class="page-indicator">Page {page} of {totalPages}</span>
				<button class="btn-ghost btn-sm" disabled={page >= totalPages} onclick={() => page++}>Next</button>
			</div>
		{/if}
	{/if}
</div>
