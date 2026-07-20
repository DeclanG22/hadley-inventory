<script lang="ts">
	import { getToasts, isLeaving } from './toast.svelte';

	let toasts = $derived(getToasts());

	function icon(type: string) {
		if (type === 'success') return '✓';
		if (type === 'error') return '✕';
		return 'i';
	}
</script>

{#if toasts.length > 0}
	<div class="toast-container">
		{#each toasts as t (t.id)}
			<div class="toast toast-{t.type}" class:leaving={isLeaving(t.id)}>
				<span class="toast-icon">{icon(t.type)}</span>
				<span class="toast-msg">{t.message}</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 9999;
		display: flex;
		flex-direction: column-reverse;
		gap: 8px;
		pointer-events: none;
	}
	.toast {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 16px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(0,0,0,0.2);
		pointer-events: auto;
		animation: toast-in 0.25s ease-out;
	}
	.toast.leaving {
		animation: toast-out 0.3s ease-in forwards;
	}
	@keyframes toast-in {
		from { opacity: 0; transform: translateY(12px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes toast-out {
		from { opacity: 1; transform: translateY(0); }
		to { opacity: 0; transform: translateY(8px); }
	}
	.toast-success {
		background: #1a3a2a;
		color: #4ade80;
		border: 1px solid rgba(74, 222, 128, 0.35);
	}
	.toast-error {
		background: #3a1a1a;
		color: #f87171;
		border: 1px solid rgba(248, 113, 113, 0.35);
	}
	.toast-info {
		background: #1a2a3a;
		color: #60a5fa;
		border: 1px solid rgba(96, 165, 250, 0.35);
	}
	.toast-icon {
		font-size: 14px;
		font-weight: 700;
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: color-mix(in srgb, currentColor 15%, transparent);
	}
	.toast-msg {
		flex: 1;
	}
</style>
