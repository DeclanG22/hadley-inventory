<script lang="ts">
	import { stockTakes } from '$lib/api';

	let date = $state(new Date().toISOString().slice(0, 10));
	let notes = $state('');
	let saved = $state<any>(null);
	let error = $state('');

	async function submit(e: Event) {
		e.preventDefault();
		error = '';
		try {
			saved = await stockTakes.create({ date, notes: notes || undefined });
		} catch (err: any) {
			error = err.message;
		}
	}
</script>

<div class="page-header"><h1>New Stock Take</h1></div>

{#if saved}
	<div class="card" style="margin-top:0">
		<div class="card-header"><h2>Stock Take Created</h2></div>
		<p style="margin:12px 0">Stock take for {new Date(saved.date).toLocaleDateString()} created with {saved.items.length} items.</p>
		<div style="display:flex;gap:8px">
			<a href="/stock-takes/{saved.id}" class="btn btn-primary">Enter Counts</a>
			<a href="/stock-takes" class="btn">Back to List</a>
		</div>
	</div>
{:else}
	<form class="card" style="margin-top:0" onsubmit={submit}>
		<div class="card-header"><h2>Details</h2></div>
		<div class="form-grid">
			<div><label>Date *</label><input type="date" bind:value={date} required /></div>
			<div style="max-width:300px"><label>Notes</label><input bind:value={notes} placeholder="Optional notes..." /></div>
		</div>
		<button type="submit" style="margin-top:12px">Create Stock Take</button>
		{#if error}<p style="color:var(--red);font-size:13px;margin-top:8px">{error}</p>{/if}
	</form>
{/if}
