<script lang="ts">
	import { items, tools, vendors, locations, activity } from '$lib/api';

	let itemCount = $state(0);
	let toolCount = $state(0);
	let vendorCount = $state(0);
	let locationCount = $state(0);
	let checkedOut = $state(0);
	let lowStock = $state(0);
	let recentActivity = $state<any[]>([]);

	$effect(() => {
		items.list().then(l => itemCount = l.length);
		items.lowStock().then(l => lowStock = l.length);
		tools.list().then(l => { toolCount = l.length; checkedOut = l.filter((t: any) => t.checkouts?.length > 0).length; });
		vendors.list().then(l => vendorCount = l.length);
		locations.list().then(l => locationCount = l.length);
		activity.recent(30).then(l => recentActivity = l);
	});
</script>

<div class="page-header">
	<h1>Dashboard</h1>
</div>

<div class="stat-grid">
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
</div>

<div class="card" style="margin-top:16px">
	<div class="card-header"><h2>Recent Activity</h2></div>
	{#if recentActivity.length === 0}
		<div class="empty-state">No activity yet.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead><tr><th>Date</th><th>Event</th><th>Ref</th></tr></thead>
				<tbody>
					{#each recentActivity as a}
						<tr>
							<td style="white-space:nowrap">{new Date(a.date).toLocaleString()}</td>
							<td>
								{#if a.direction === 'in'}
									<span style="color:var(--green);font-weight:500">In {a.qty}</span>
									<a href={a.link}> x {a.itemRef}</a>
								{:else if a.direction === 'out'}
									<span style="color:var(--red);font-weight:500">Out {a.qty}</span>
									<a href={a.link}> x {a.itemRef}</a>
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
	{/if}
</div>
