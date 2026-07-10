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
		background: var(--green-bg, #263029);
		color: var(--green, #3d7a52);
		border: 1px solid color-mix(in srgb, var(--green, #3d7a52) 25%, transparent);
	}
	.toast-error {
		background: var(--red-bg, #140a0a);
		color: var(--red, #b83232);
		border: 1px solid color-mix(in srgb, var(--red, #b83232) 25%, transparent);
	}
	.toast-info {
		background: var(--blue-bg, #1f2933);
		color: var(--blue, #3864a8);
		border: 1px solid color-mix(in srgb, var(--blue, #3864a8) 25%, transparent);
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
