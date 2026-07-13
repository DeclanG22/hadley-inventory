<script lang="ts">
	import { upload } from '$lib/api';

	let { value = $bindable(''), label = 'Image URL' }: { value?: string; label?: string } = $props();

	let fileInput: HTMLInputElement;
	let uploading = $state(false);

	async function pickFile() {
		fileInput?.click();
	}

	async function onFileSelected() {
		const file = fileInput?.files?.[0];
		if (!file) return;
		uploading = true;
		try {
			value = await upload.image(file);
		} catch {
			// keep old value
		} finally {
			uploading = false;
			fileInput.value = '';
		}
	}
</script>

<div class="img-upload">
	<label>{label}</label>
	<div class="img-input-row">
		<input type="text" bind:value={value} placeholder="https://... or upload an image" />
		<button type="button" onclick={pickFile} disabled={uploading} class="file-btn" aria-label="Upload image">
			{#if uploading}
				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
					<path d="M0 0h24v24H0z" fill="none" />
					<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M12 3v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
					<path d="M0 0h24v24H0z" fill="none" />
					<path fill="currentColor" d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m4-8h-3v-4h-2v4H8l4 4Z" />
				</svg>
			{/if}
		</button>
	</div>
	<input
		type="file"
		accept="image/*"
		bind:this={fileInput}
		onchange={onFileSelected}
		class="file-input-hidden"
	/>
</div>

<style>
	.img-upload {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.img-input-row {
		display: flex;
		gap: 0;
		position: relative;
	}
	.img-input-row input {
		flex: 1;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
	.file-btn {
		width: 38px;
		height: 38px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-left: none;
		font-size: 18px;
		background: var(--bg-component);
		color: var(--empty-text-primary);
		border: 1px solid var(--border-color);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.15s ease, color 0.15s ease;
	}
	.file-btn:hover {
		background: var(--bg-off);
		color: var(--accent);
	}
	.file-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.file-input-hidden {
		display: none;
	}
</style>
