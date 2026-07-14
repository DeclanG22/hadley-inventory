<script lang="ts">
	import { goto } from '$app/navigation';
	import { items, tools, vendors, locations, activity } from '$lib/api';

	let itemCount = $state(0);
	let toolCount = $state(0);
	let vendorCount = $state(0);
	let locationCount = $state(0);
	let checkedOut = $state(0);
	let lowStock = $state(0);
	let recentActivity = $state<any[]>([]);
	let overdueCheckouts = $state<any[]>([]);
	let loading = $state(true);

	const PAGE_SIZE = 15;
	let displayCount = $state(PAGE_SIZE);
	let loadingMore = $state(false);

	let hasMore = $derived(displayCount < recentActivity.length);
	let paginated = $derived(recentActivity.slice(0, displayCount));

	function observeSentinel(element: HTMLElement) {
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) loadMore();
		}, { rootMargin: '400px' });
		observer.observe(element);
		return { destroy() { observer.disconnect(); } };
	}

	function loadMore() {
		if (!hasMore || loadingMore || loading) return;
		loadingMore = true;
		displayCount = Math.min(displayCount + PAGE_SIZE, recentActivity.length);
		loadingMore = false;
	}

	$effect(() => {
		Promise.all([
			items.list(undefined, { limit: 1 }).then(r => itemCount = r.total),
			items.lowStock().then(l => lowStock = l.length),
			tools.list().then(l => { toolCount = l.total; checkedOut = l.data.filter((t: any) => t.checkouts?.length > 0).length; }),
			vendors.list().then(l => vendorCount = l.length),
			locations.list().then(l => locationCount = l.length),
			activity.recent(100).then(l => { recentActivity = l; displayCount = PAGE_SIZE; }),
			tools.overdue().then(l => overdueCheckouts = l).catch(() => {}),
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
		<div style="display:flex;align-items:center;justify-content:center;padding:16px;gap:8px;color:var(--text-secondary);font-size:13px">
			{#if !hasMore && recentActivity.length > 0}
				<span>Showing all {recentActivity.length} events</span>
			{/if}
		</div>
		<div use:observeSentinel style="height:1px"></div>
	{/if}
</div>

{#if overdueCheckouts.length > 0}
	<div class="card" style="margin-top:16px">
		<div class="card-header"><h2>Overdue Returns</h2></div>
		<div class="table-wrap">
			<table>
				<thead><tr><th>Tool</th><th>Checked Out By</th><th>Job</th><th>Due</th><th>Overdue</th></tr></thead>
				<tbody>
					{#each overdueCheckouts as co}
						{@const days = Math.floor((Date.now() - new Date(co.expectedReturnAt).getTime()) / 86400000)}
						<tr onclick={() => goto(`/tools/${co.tool.id}`)} role="button" tabindex={0}>
							<td><a href="/tools/{co.tool.id}" onclick={(e) => e.stopPropagation()}>{co.tool.toolNumber} — {co.tool.name}</a></td>
							<td>{co.checkedOutBy}</td>
							<td>{co.jobNumber ?? '-'}</td>
							<td style="white-space:nowrap">{new Date(co.expectedReturnAt).toLocaleDateString()}</td>
							<td style="color:var(--red);font-weight:500">{days}d</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
