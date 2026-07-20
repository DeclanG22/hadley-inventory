<script lang="ts">
	import { jobs } from '$lib/api';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let jobList = $state<any[]>([]);
	let search = $state('');
	let loading = $state(true);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => load());

	async function load(q?: string) {
		loading = true;
		try {
			jobList = await jobs.list(q);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function onSearchInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			load(search.trim() || undefined);
		}, 300);
	}
</script>

<div class="page-header">
	<h1>Jobs</h1>
</div>

<div class="card">
	<div class="search-bar" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
		<input type="search" bind:value={search} placeholder="Search job number..." oninput={onSearchInput} style="flex:1" />
	</div>

	{#if loading}
		<div class="sk-table">
			<div class="sk-row"><div class="sk-cell sk" style="width:20%"></div><div class="sk-cell sk" style="width:12%"></div><div class="sk-cell sk" style="width:12%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:25%"></div><div class="sk-cell sk" style="width:10%"></div><div class="sk-cell sk" style="width:14%"></div></div>
			<div class="sk-row"><div class="sk-cell sk" style="width:18%"></div><div class="sk-cell sk" style="width:14%"></div><div class="sk-cell sk" style="width:10%"></div></div>
		</div>
	{:else if jobList.length === 0}
		<div class="empty-state">No jobs found.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Job Number</th>
						<th>Items Issued</th>
						<th>Tools Issued</th>
					</tr>
				</thead>
				<tbody>
					{#each jobList as j}
						<tr onclick={() => goto(`/jobs/${j.jobNumber}`)}>
							<td><a href="/jobs/{j.jobNumber}" onclick={(e) => e.stopPropagation()}>{j.jobNumber}</a></td>
							<td>{j.itemCount}</td>
							<td>{j.toolCount}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.empty {
		color: #888;
	}
</style>
