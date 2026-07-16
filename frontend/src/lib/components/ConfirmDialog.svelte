<script lang="ts">
	import { getConfirmState, handleConfirm } from '$lib/confirmDialog.svelte';

	let state = $derived(getConfirmState());
</script>

{#if state.open}
	<div class="backdrop" onclick={() => handleConfirm(false)} onkeydown={(e) => e.key === 'Escape' && handleConfirm(false)} role="presentation">
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			<h3 class="modal-title">{state.title}</h3>
			<p class="modal-message">{state.message}</p>
			<div class="modal-actions">
				<button class="btn-ghost" onclick={() => handleConfirm(false)}>Cancel</button>
				<button class="btn-danger" onclick={() => handleConfirm(true)}>{state.confirmLabel}</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 20px;
	}
	.modal {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 14px;
		padding: 24px;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 8px 32px rgba(0,0,0,0.18);
	}
	.modal-title {
		font-size: 16px;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0 0 8px;
	}
	.modal-message {
		font-size: 13px;
		color: var(--text-secondary);
		margin: 0 0 20px;
		line-height: 1.4;
	}
	.modal-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}
	.btn-danger {
		padding: 8px 18px;
		border-radius: 8px;
		border: none;
		background: var(--red);
		color: white;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}
	.btn-danger:hover {
		opacity: 0.85;
	}
</style>
