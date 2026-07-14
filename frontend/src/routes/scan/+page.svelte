<script lang="ts">
	import { page } from '$app/stores';
	import { lookup, items, tools } from '$lib/api';
	import { addToast } from '$lib/toast.svelte';
	import qrCode from '$lib/assets/qr_code.png';

	let code = $state('');
	let scanning = $state(false);
	let result = $state<{ type: 'item' | 'tool'; data: any } | null>(null);
	let error = $state('');

	let quantity = $state(1);
	let direction = $state<'in' | 'out'>('out');
	let checkedOutBy = $state('');
	let jobNumber = $state('');
	let jobSite = $state('');
	let expectedReturnAt = $state('');
	let totalCost = $state('');
	let submitting = $state(false);
	let resultVisible = $state(false);

	let scanInput: HTMLInputElement;
	let laserEl: HTMLDivElement;
	let trailDownEl: HTMLDivElement;
	let trailUpEl: HTMLDivElement;

	$effect(() => {
		if (resultVisible || !laserEl || !trailDownEl || !trailUpEl) return;

		const TOP = 38;
		const BOTTOM = 222;
		const RANGE = BOTTOM - TOP;
		const SWEEP_MS = 1300;
		const PAUSE_MS = 100;
		let dir = 1;
		let phase: 'sweep' | 'pause' = 'sweep';
		let startTs = 0;
		let frame: number;

		function ease(t: number) {
			return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
		}

		function step(ts: number) {
			if (!startTs) startTs = ts;
			const elapsed = ts - startTs;

			if (phase === 'sweep') {
				const t = Math.min(elapsed / SWEEP_MS, 1);
				const e = ease(t);
				const pos = dir === 1 ? TOP + RANGE * e : TOP + RANGE * (1 - e);

				const v = t < 0.5 ? 12 * t * t : 3 * (2 - 2 * t) * (2 - 2 * t);
				const trailH = (v / 3) * 80;

				laserEl.style.top = `${pos}px`;

				if (dir === 1) {
					trailDownEl.style.top = `${pos - trailH}px`;
					trailDownEl.style.height = `${trailH}px`;
					trailUpEl.style.height = '0px';
				} else {
					trailUpEl.style.top = `${pos + 2}px`;
					trailUpEl.style.height = `${trailH}px`;
					trailDownEl.style.height = '0px';
				}

				if (t >= 1) {
					phase = 'pause';
					startTs = ts;
				}
			} else {
				if (elapsed >= PAUSE_MS) {
					phase = 'sweep';
					startTs = ts;
					dir *= -1;
				}
			}

			frame = requestAnimationFrame(step);
		}

		frame = requestAnimationFrame(step);
		return () => { cancelAnimationFrame(frame); laserEl.style.top = '38px'; trailDownEl.style.top = '38px'; trailDownEl.style.height = '0px'; trailUpEl.style.top = '40px'; trailUpEl.style.height = '0px'; };
	});

	function focusScan() {
		scanInput?.focus();
	}

	$effect(() => {
		const c = $page.url.searchParams.get('code') || ($page.url.hash ? decodeURIComponent($page.url.hash.slice(1)) : '');
		if (c) {
			code = c;
			doLookup();
		}
	});

	function clear() {
		code = '';
		result = null;
		resultVisible = false;
		error = '';
		quantity = 1;
		direction = 'out';
		jobNumber = '';
		jobSite = '';
		expectedReturnAt = '';
		totalCost = '';
		setTimeout(focusScan, 50);
	}

	async function doLookup() {
		const val = code.trim();
		if (!val) return;
		scanning = true;
		error = '';
		result = null;
		resultVisible = false;
		try {
			result = await lookup.byCode(val);
			resultVisible = true;
		} catch (e: any) {
			error = e.message;
		} finally {
			scanning = false;
		}
	}

	function handleScanKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			doLookup();
		}
	}

	async function submitItem() {
		if (submitting) return;
		submitting = true;
		try {
			const qty = direction === 'out' ? -Math.abs(quantity) : Math.abs(quantity);
			const data: any = {
				date: new Date().toISOString().slice(0, 10),
				quantityInOut: qty,
				jobNumber: jobNumber || undefined,
			};
			const tc = parseFloat(totalCost);
			if (tc && quantity > 0) {
				data.totalCost = tc;
				data.unitPrice = parseFloat((tc / quantity).toFixed(4));
			}
			await items.transactions.create(result!.data.id, data);
			addToast(`${direction === 'in' ? 'In' : 'Out'} ${quantity} x ${result!.data.itemNumber}`, 'success');
			clear();
		} catch (e: any) {
			addToast(e.message, 'error');
		} finally {
			submitting = false;
		}
	}

	async function submitToolCheckout() {
		if (submitting) return;
		submitting = true;
		try {
			await tools.checkout(result!.data.id, {
				checkedOutBy,
				jobNumber: jobNumber || undefined,
				jobSite: jobSite || undefined,
				expectedReturnAt: expectedReturnAt || undefined,
			});
			addToast(`Checked out ${result!.data.toolNumber}`, 'success');
			clear();
		} catch (e: any) {
			addToast(e.message, 'error');
		} finally {
			submitting = false;
		}
	}

	async function submitToolCheckin() {
		if (submitting) return;
		submitting = true;
		try {
			await tools.checkin(result!.data.id);
			addToast(`Checked in ${result!.data.toolNumber}`, 'success');
			clear();
		} catch (e: any) {
			addToast(e.message, 'error');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="page-header">
	<h1>Scan &amp; Transact</h1>
</div>

<div class="scan-card">
	<div class="scan-input-row">
		<div class="search-wrap">
			<input
				bind:this={scanInput}
				autofocus
				bind:value={code}
				onkeydown={handleScanKeydown}
				placeholder="Search item or tool..."
				class="scan-input"
			/>
			<button onclick={doLookup} disabled={scanning || !code.trim()} class="scan-btn">
				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
					<path d="M0 0h24v24H0z" fill="none" />
					<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m6-8l-6-6m-6 6l6-6" />
				</svg>
			</button>
		</div>
	</div>
	<div class="divider" class:result-show={resultVisible}>
    <span>Or Scan Item/Tool Bin QR Code</span>
	</div>
	<div class="scan-anim" class:result-shown={resultVisible}>
		<div class="anim-inner">
			<img src={qrCode} alt="" class="qr-image" />
			<div class="corner tl"></div>
			<div class="corner tr"></div>
			<div class="corner bl"></div>
			<div class="corner br"></div>
			<div class="trail-down" bind:this={trailDownEl}></div>
			<div class="trail-up" bind:this={trailUpEl}></div>
			<div class="laser" bind:this={laserEl}></div>
		</div>
	</div>

	{#if error}
		<div class="scan-error">{error}</div>
	{/if}

	{#if result}
		<div class="scan-result">
			{#if result.data.imageUrl}
				<img src={result.data.imageUrl} alt="" class="result-img" />
			{/if}
			<div class="result-header">
				<span class="result-id">{result.type === 'item' ? result.data.itemNumber : result.data.toolNumber}</span>
				<span class="badge badge-{result.type === 'item' ? 'available' : result.data.checkedOut ? 'checked-out' : 'available'}">{result.type === 'item' ? 'Item' : 'Tool'}</span>
			</div>
			<div class="result-desc">{result.type === 'item' ? result.data.description : result.data.name}</div>
			{#if result.type === 'item'}
				<div class="result-meta">
					<span>On Hand: <strong>{result.data.onHand}</strong></span>
					{#if result.data.unit}<span>Unit: <strong>{result.data.unit}</strong></span>{/if}
					{#if result.data.category}<span>Category: <strong>{result.data.category}</strong></span>{/if}
				</div>
			{:else}
				<div class="result-meta">
					{#if result.data.brand || result.data.model}
						<span>{result.data.brand ?? '-'} / {result.data.model ?? '-'}</span>
					{/if}
					{#if result.data.category}<span>Category: <strong>{result.data.category}</strong></span>{/if}
				</div>
			{/if}
		</div>

		<div class="txn-form">
			{#if result.type === 'item'}
				<div class="txn-row">
					<div class="segmented2">
						<button type="button" class="segment2" class:active={direction === 'out'} onclick={() => direction = 'out'}>Out</button>
						<button type="button" class="segment2" class:active={direction === 'in'} onclick={() => direction = 'in'}>In</button>
					</div>
					<input type="number" bind:value={quantity} min="1" class="qty-input" />
				</div>
				<div class="txn-row">
					<input bind:value={jobNumber} placeholder="Job number (optional)" class="txn-field" />
				</div>
				<div class="txn-row">
					<input bind:value={totalCost} type="number" step="0.01" min="0" placeholder="Total cost (optional)" class="txn-field" />
				</div>
				<button onclick={submitItem} disabled={submitting || quantity < 1} class="btn-primary txn-submit">
					{submitting ? 'Recording...' : `${direction === 'in' ? 'Receive' : 'Issue'} ${quantity} unit${quantity !== 1 ? 's' : ''}`}
				</button>
			{:else}
				{#if result.data.checkedOut}
					<div class="txn-info">Checked out by <strong>{result.data.checkedOutBy}</strong> at {new Date(result.data.checkedOutAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
					<button onclick={submitToolCheckin} disabled={submitting} class="btn-primary txn-submit checkin-btn">
						{submitting ? 'Checking in...' : 'Check In'}
					</button>
				{:else}
					<div class="txn-row">
						<input bind:value={checkedOutBy} placeholder="Checked out by (name)" class="txn-field" autofocus={false} />
					</div>
					<div class="txn-row">
						<input bind:value={jobNumber} placeholder="Job number (optional)" class="txn-field" />
					</div>
					<div class="txn-row">
						<input bind:value={jobSite} placeholder="Job site (optional)" class="txn-field" />
					</div>
					<div class="txn-row txn-date-row">
						<span class="txn-label">Expected return date (optional)</span>
						<input bind:value={expectedReturnAt} type="date" class="txn-field" />
					</div>
					<button onclick={submitToolCheckout} disabled={submitting || !checkedOutBy.trim()} class="btn-primary txn-submit">
						{submitting ? 'Checking out...' : 'Check Out'}
					</button>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.scan-card {
		max-width: 520px;
		margin: 0 auto;
	}

	.scan-input-row {
		display: flex;
	}

	.search-wrap {
		position: relative;
		flex: 1;
	}

	.scan-input {
		width: 100%;
		font-size: 18px;
		padding: 10px 48px 10px 14px;
		text-align: left;
		border-radius: 12px;
		border: 1px solid var(--border-color);
		background: var(--bg-primary);
		color: var(--text-primary);
		outline: none;
		box-sizing: border-box;
	}
	.scan-input:focus {
		border-color: var(--accent);
	}

	.scan-btn {
		position: absolute;
		right: 4px;
		top: 50%;
		transform: translateY(-50%);
		width: 36px;
		height: 36px;
		padding: 0 0 0 1px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		font-size: 18px;
		color: white;
		background: var(--accent);
		border: none;
		cursor: pointer;
		transition: all var(--transition-fast) ease;
	}
	.scan-btn:hover:not(:disabled) {
		opacity: 0.85;
	}
	.scan-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.divider {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 44px 0 0px;
	}

	.divider::before {
	content: "";
	position: absolute;
	left: 0;
	right: 0;
	height: 1px;
	background: var(--border-color);
	}

	.divider span {
	position: relative;
	padding: 0 12px;
	background: var(--bg-primary);
	color: var(--empty-text-secondary);
	font-size: 12px;
	font-weight: 400;
	z-index: 1;
	}

	/* Scanner animation */
	.scan-anim {
		margin: 28px auto 0;
		width: 260px;
		height: 260px;
		border-radius: 16px;
		overflow: hidden;
		transition: opacity 0.3s ease, transform 0.3s ease;
	}
	.scan-anim.result-shown {
		opacity: 0;
		transform: scale(0.9);
		pointer-events: none;
		position: absolute;
	}

	.divider.result-show {
	display: none;
	}

	.anim-inner {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 16px;
		overflow: hidden;
		background: var(--bg-primary);
	}

	.qr-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 38px;
		box-sizing: border-box;
		filter: invert(1) brightness(1.5);
	}

	/* Corner brackets */
	.corner {
		position: absolute;
		width: 26px;
		height: 26px;
		border-color: var(--empty-text-primary);
		border-style: solid;
		border-width: 0;
	}
	.corner.tl { top: 30px; left: 30px; border-top-width: 3px; border-left-width: 3px; border-top-left-radius: 18px; }
	.corner.tr { top: 30px; right: 30px; border-top-width: 3px; border-right-width: 3px; border-top-right-radius: 18px; }
	.corner.bl { bottom: 30px; left: 30px; border-bottom-width: 3px; border-left-width: 3px; border-bottom-left-radius: 18px; }
	.corner.br { bottom: 30px; right: 30px; border-bottom-width: 3px; border-right-width: 3px; border-bottom-right-radius: 18px; }

	/* Laser line */
	.laser {
		position: absolute;
		left: 0;
		right: 0;
		top: 38px;
		height: 2px;
		background: color-mix(in srgb, var(--accent) 55%, transparent);
		border-radius: 2px;
		box-shadow: 0 0 5px color-mix(in srgb, var(--accent) 35%, transparent);
		pointer-events: none;
		z-index: 1;
		mask-image: linear-gradient(to right, transparent 8%, black 20%, black 80%, transparent 92%);
		-webkit-mask-image: linear-gradient(to right, transparent 8%, black 20%, black 80%, transparent 92%);
	}

	/* Trail above the laser */
	.trail-down {
		position: absolute;
		left: 0;
		right: 0;
		height: 0;
		pointer-events: none;
		z-index: 0;
		background: linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--accent) 45%, transparent) 100%);
		mask-image: linear-gradient(to bottom, transparent 0%, black 40%, black 100%), linear-gradient(to right, transparent 8%, black 20%, black 80%, transparent 92%);
		-webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 40%, black 100%), linear-gradient(to right, transparent 8%, black 20%, black 80%, transparent 92%);
		mask-composite: intersect;
		-webkit-mask-composite: source-in;
	}

	/* Trail below the laser */
	.trail-up {
		position: absolute;
		left: 0;
		right: 0;
		height: 0;
		pointer-events: none;
		z-index: 0;
		background: linear-gradient(to top, transparent 0%, color-mix(in srgb, var(--accent) 45%, transparent) 100%);
		mask-image: linear-gradient(to top, transparent 0%, black 40%, black 100%), linear-gradient(to right, transparent 8%, black 20%, black 80%, transparent 92%);
		-webkit-mask-image: linear-gradient(to top, transparent 0%, black 40%, black 100%), linear-gradient(to right, transparent 8%, black 20%, black 80%, transparent 92%);
		mask-composite: intersect;
		-webkit-mask-composite: source-in;
	}

	.scan-error {
		margin-top: 10px;
		font-size: 13px;
		color: var(--red);
	}

	.scan-result {
		margin-top: 16px;
		padding: 14px;
		background: color-mix(in srgb, var(--bg-secondary), 40% transparent);
		border: 1px solid var(--border-color);
		border-radius: 12px;
	}

	.result-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.result-id {
		font-size: 16px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.result-desc {
		font-size: 13px;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.result-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
		font-size: 12px;
		color: var(--empty-text-primary);
	}

	.result-meta strong {
		color: var(--text-primary);
		font-weight: 500;
	}

	.result-img {
		margin: -14px -14px 10px -14px;
		width: calc(100% + 28px);
		max-height: 180px;
		object-fit: cover;
		display: block;
		border-radius: 12px 12px 0 0;
	}

	.txn-form {
		margin-top: 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.txn-row {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.qty-input {
		width: 80px;
		font-size: 16px;
		text-align: center;
	}

	.txn-field {
		flex: 1;
	}

	.txn-date-row {
		flex-direction: column;
		align-items: stretch;
		gap: 4px;
	}

	.txn-label {
		font-size: 12px;
		color: var(--empty-text-primary);
		font-weight: 400;
	}

	.txn-info {
		font-size: 13px;
		color: var(--text-secondary);
		padding: 4px 0;
	}

	.txn-submit {
		width: 100%;
		padding: 12px;
		font-size: 15px;
		margin-top: 4px;
	}

	.checkin-btn {
		background: var(--green);
		border-color: transparent;
		color: white;
	}
	.checkin-btn:hover {
		opacity: 0.88;
	}


	.segmented2 {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.segment2 {
  padding: 7px 12px;
  font-weight: 400;
  border: none;
  border-radius: 9px;
  background: transparent;
border: 1px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 11.5px;
  opacity: 0.7;
  transform: scale(0.96);
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
}
.segment2.active {
  background: var(--bg-component);
  border: 1px solid color-mix(in srgb, var(--border-color) 40%, transparent);
  color: var(--text-primary);
  opacity: 1;
}
.segment2:hover {
  opacity: 0.9;
  transform: scale(0.98);
}

	@media (max-width: 899px) {
		.page-header h1 {
			font-size: 18px;
		}
		.scan-card {
			max-width: 100%;
		}
		.scan-input {
			font-size: 16px;
			padding: 13px 48px 13px 12px;
		}
		.scan-btn {
			width: 40px;
			height: 40px;
			font-size: 20px;
		}
		.result-id {
			font-size: 14px;
		}
		.txn-submit {
			font-size: 14px;
			padding: 14px;
		}
		.qty-input {
			width: 70px;
			font-size: 14px;
		}
	}
</style>
