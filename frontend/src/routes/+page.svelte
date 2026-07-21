<script lang="ts">
	import { goto } from '$app/navigation';
	import { items, tools, vendors, locations, activity } from '$lib/api';

	let itemCount = $state(0);
	let toolCount = $state(0);
	let vendorCount = $state(0);
	let locationCount = $state(0);
	let checkedOut = $state(0);
	let lowStock = $state(0);
	let maintenanceFlags = $state(0);
	let recentActivity = $state<any[]>([]);
	let overdueCheckouts = $state<any[]>([]);
	let loading = $state(true);
	let itemSearch = $state('');
	let toolSearch = $state('');

	let itemActivity = $derived(recentActivity.filter(a => {
		if (a.type !== 'item_transaction') return false;
		if (!itemSearch) return true;
		const q = itemSearch.toLowerCase();
		return a.summary?.toLowerCase().includes(q) || a.itemRef?.toLowerCase().includes(q) || new Date(a.date).toLocaleString([], { month:'numeric', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' }).includes(q);
	}));
	let toolActivity = $derived(recentActivity.filter(a => {
		if (a.type === 'item_transaction') return false;
		if (!toolSearch) return true;
		const q = toolSearch.toLowerCase();
		return a.summary?.toLowerCase().includes(q) || a.itemRef?.toLowerCase().includes(q) || new Date(a.date).toLocaleString([], { month:'numeric', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' }).includes(q);
	}));

	$effect(() => {
		Promise.all([
			items.list(undefined, { limit: 1 }).then(r => itemCount = r.total),
			items.lowStock().then(l => lowStock = l.length),
			tools.list().then(l => { toolCount = l.total; checkedOut = l.data.filter((t: any) => t.checkouts?.length > 0).length; }),
			vendors.list().then(l => vendorCount = l.length),
			locations.list().then(l => locationCount = l.length),
			activity.recent(100).then(l => { recentActivity = l; itemSearch = ''; toolSearch = ''; }),
			tools.overdue().then(l => overdueCheckouts = l).catch(() => {}),
			tools.maintenanceFlags.list(true).then(l => maintenanceFlags = l.length).catch(() => {}),
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
		<div class="stat-card"><div class="sk-stat"><div class="sk-circle sk"></div><div class="sk-line sk" style="width:50%"></div></div></div>
	{:else}
		<a href="/items" class="stat-card">
			<span class="stat-value">{itemCount}</span>
			<span class="stat-label">Items</span>
		</a>
		<a href="/items/low-stock" class="stat-card warn">
			<span class="stat-value">{lowStock}</span>
			<span class="stat-label">Low Stock Items</span>
		</a>
		<a href="/tools" class="stat-card">
			<span class="stat-value">{toolCount}</span>
			<span class="stat-label">Tools</span>
		</a>
		<a href="/tools/checked-out" class="stat-card">
			<span class="stat-value">{checkedOut}</span>
			<span class="stat-label">Checked Out Tools</span>
		</a>
		<a href="/tools/checked-out?overdue=true" class="stat-card warn">
			<span class="stat-value">{overdueCheckouts.length}</span>
			<span class="stat-label">Overdue Returns</span>
		</a>
		<a href="/tools/maintenance-flags" class="stat-card warn">
			<span class="stat-value">{maintenanceFlags}</span>
			<span class="stat-label">Maintenance</span>
		</a>
		<a href="/vendors" class="stat-card">
			<span class="stat-value">{vendorCount}</span>
			<span class="stat-label">Vendors</span>
		</a>
		<a href="/locations" class="stat-card">
			<span class="stat-value">{locationCount}</span>
			<span class="stat-label">Locations</span>
		</a>
	{/if}
</div>

	<div class="activity-grid">
	<div class="card">
		<div class="card-header" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
			<h2 style="flex:1">Recent Hardware Activity</h2>
			<input type="search" bind:value={itemSearch} placeholder="Search..." style="min-width:120px;max-width:200px" />
		</div>
		{#if loading}
			<div class="sk-table"><div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:60%"></div></div><div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:50%"></div></div><div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:55%"></div></div></div>
		{:else if itemActivity.length === 0}
			<div class="empty-state">No item activity yet.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead><tr><th>Date</th><th>Event</th></tr></thead>
					<tbody>
						{#each itemActivity as a}
							<tr>
								<td style="white-space:nowrap">{new Date(a.date).toLocaleString([], { month:'numeric', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' })}</td>
								<td>
									{#if a.direction === 'in'}
										<span style="color:var(--green);font-weight:500">In {a.qty}</span>
										<a href={a.link}> x {a.itemRef}</a>
									{:else}
										<span style="color:var(--red);font-weight:500">Out {a.qty}</span>
										<a href={a.link}> x {a.itemRef}</a>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
	<div class="card">
		<div class="card-header" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
			<h2 style="flex:1">Recent Tool Activity</h2>
			<input type="search" bind:value={toolSearch} placeholder="Search..." style="min-width:120px;max-width:200px" />
		</div>
		{#if loading}
			<div class="sk-table"><div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:60%"></div></div><div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:50%"></div></div><div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:55%"></div></div></div>
		{:else if toolActivity.length === 0}
			<div class="empty-state">No tool activity yet.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead><tr><th>Date</th><th>Event</th></tr></thead>
					<tbody>
						{#each toolActivity as a}
							<tr>
								<td style="white-space:nowrap">{new Date(a.date).toLocaleString([], { month:'numeric', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' })}</td>
								<td>
									{#if a.type === 'tool_checkout'}
										<span style="color:var(--orange);font-weight:500">Checked out</span>
										<a href={a.link}> {a.itemRef}</a>
									{:else if a.type === 'tool_checkin'}
										<span style="color:var(--green);font-weight:500">Checked in</span>
										<a href={a.link}> {a.itemRef}</a>
									{:else if a.type === 'tool_maintenance'}
										{@const colors: Record<string,string> = { repair: 'var(--red)', service: 'var(--orange)', calibration: 'var(--yellow)', inspection: 'var(--green)' }}
										<span style="color:{colors[a.subType] ?? 'var(--text-secondary)'};font-weight:500">{a.subType}</span>
										<a href={a.link}> {a.itemRef}</a>
									{:else if a.type === 'flag_created'}
										<span style="color:var(--orange);font-weight:500">Flag {a.subType}</span>
										<a href={a.link}> {a.itemRef}</a>
									{:else if a.type === 'flag_resolved'}
										<span style="color:var(--green);font-weight:500">Flag resolved</span>
										<a href={a.link}> {a.itemRef}</a>
									{:else}
										<a href={a.link}>{a.summary}</a>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.activity-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		margin-top: 16px;
	}
	@media (max-width: 899px) {
		.activity-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

{#if overdueCheckouts.length > 0}
	<div class="card" style="margin-top:16px">
		<div class="card-header"><h2>Overdue Returns</h2></div>
		<div class="table-wrap">
			<table>
				<thead><tr><th>Tool</th><th>Checked Out By</th><th style="width:120px">Job</th><th>Due</th><th>Overdue</th></tr></thead>
				<tbody>
					{#each overdueCheckouts as co}
						{@const days = Math.floor((Date.now() - new Date(co.expectedReturnAt).getTime()) / 86400000)}
						<tr onclick={() => goto(`/tools/${co.tool.id}`)} role="button" tabindex={0}>
							<td><a href="/tools/{co.tool.id}" onclick={(e) => e.stopPropagation()}>{co.tool.name}</a></td>
							<td>{co.checkedOutBy}</td>
							<td><span class="job-pill">{co.jobNumber ?? '-'}</span></td>
							<td style="white-space:nowrap">{new Date(co.expectedReturnAt).toLocaleDateString()}</td>
							<td style="color:var(--red);font-weight:500">{days}d</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
