<script lang="ts">
	import { fade } from 'svelte/transition';

	let { transactions = [] }: { transactions: any[] } = $props();

	type ViewMode = 'hourly' | 'daily' | 'monthly';

	let viewMode = $state<ViewMode>('hourly');
	let timeOffset = $state(0);
	let chartAreaWidth = $state(600);
	let chartScrollEl = $state<HTMLElement | null>(null);
	let scrollbarTrackEl = $state<HTMLElement | null>(null);

	const columnGap = 8;

	type Bucket = {
		label: string;
		inQty: number;
		outQty: number;
		total: number;
	};

	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	const now = $derived(new Date());

	const timeWindow = $derived.by(() => {
		let start: Date;
		let end: Date;
		let numSlots: number;
		let slotLabels: string[];

		if (viewMode === 'hourly') {
			const day = new Date(now);
			day.setDate(day.getDate() + timeOffset);
			day.setHours(0, 0, 0, 0);
			start = day;
			end = new Date(day);
			end.setDate(end.getDate() + 1);
			numSlots = 24;
			slotLabels = Array.from({ length: 24 }, (_, i) => {
				const h = i % 12 || 12;
				const ampm = i < 12 ? 'AM' : 'PM';
				return `${h} ${ampm}`;
			});
		} else if (viewMode === 'daily') {
			const weekStart = new Date(now);
			weekStart.setDate(weekStart.getDate() + timeOffset * 7);
			weekStart.setDate(weekStart.getDate() - weekStart.getDay());
			weekStart.setHours(0, 0, 0, 0);
			start = weekStart;
			end = new Date(weekStart);
			end.setDate(end.getDate() + 7);
			numSlots = 7;
			slotLabels = dayNames.map((name, i) => {
				const d = new Date(weekStart);
				d.setDate(d.getDate() + i);
				return `${name} ${d.getMonth() + 1}/${d.getDate()}`;
			});
		} else {
			const year = now.getFullYear() + timeOffset;
			start = new Date(year, 0, 1);
			end = new Date(year + 1, 0, 1);
			numSlots = 12;
			slotLabels = monthNames;
		}

		return { start, end, numSlots, slotLabels };
	});

	const buckets = $derived.by(() => {
		const { start, end, numSlots, slotLabels } = timeWindow;
		const slotMs = (end.getTime() - start.getTime()) / numSlots;

		const inMap = new Map<number, number>();
		const outMap = new Map<number, number>();

		for (const t of transactions) {
			const d = new Date(t.createdAt);
			const ms = d.getTime();
			if (ms < start.getTime() || ms >= end.getTime()) continue;
			let idx: number;
			if (viewMode === 'monthly') {
				idx = d.getMonth();
			} else {
				idx = Math.floor((ms - start.getTime()) / slotMs);
				if (idx >= numSlots) idx = numSlots - 1;
			}
			if (t.quantityInOut > 0) {
				inMap.set(idx, (inMap.get(idx) ?? 0) + t.quantityInOut);
			} else {
				outMap.set(idx, (outMap.get(idx) ?? 0) + Math.abs(t.quantityInOut));
			}
		}

		const result: Bucket[] = [];
		for (let i = 0; i < numSlots; i++) {
			const inQty = inMap.get(i) ?? 0;
			const outQty = outMap.get(i) ?? 0;
			result.push({
				label: slotLabels[i],
				inQty,
				outQty,
				total: inQty + outQty,
			});
		}
		return result;
	});

	const maxTotal = $derived(Math.max(...buckets.map((b) => b.total), 1));
	const bars = $derived(buckets.map((b) => ({ ...b, percent: (b.total / maxTotal) * 100 })));

	const numBars = $derived(bars.length);
	const visibleLimit = $derived(viewMode === 'hourly' ? 10 : viewMode === 'daily' ? 7 : 12);
	const isScrollable = $derived(numBars > visibleLimit);
	const visibleBars = $derived(isScrollable ? visibleLimit : numBars);

	const columnWidth = $derived(
		Math.max(36, (chartAreaWidth - (visibleBars - 1) * columnGap) / visibleBars)
	);

	function prevPeriod() {
		timeOffset -= 1;
	}

	function nextPeriod() {
		timeOffset += 1;
	}

	function formatPeriodLabel(): string {
		if (viewMode === 'hourly') {
			const d = new Date(now);
			d.setDate(d.getDate() + timeOffset);
			return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
		} else if (viewMode === 'daily') {
			const ws = new Date(now);
			ws.setDate(ws.getDate() + timeOffset * 7);
			ws.setDate(ws.getDate() - ws.getDay());
			const we = new Date(ws);
			we.setDate(we.getDate() + 6);
			return `${ws.getMonth() + 1}/${ws.getDate()} – ${we.getMonth() + 1}/${we.getDate()}, ${we.getFullYear()}`;
		} else {
			return String(now.getFullYear() + timeOffset);
		}
	}

	function updateThumb() {
		if (!chartScrollEl || !scrollbarTrackEl) return;
		const maxScroll = chartScrollEl.scrollWidth - chartScrollEl.clientWidth;
		const ratio = chartScrollEl.clientWidth / chartScrollEl.scrollWidth;
		const thumb = scrollbarTrackEl.querySelector('.scrollbar-thumb') as HTMLElement;
		if (!thumb) return;
		const thumbW = Math.max(20, ratio * scrollbarTrackEl.clientWidth);
		thumb.style.width = `${thumbW}px`;
		const leftPx =
			maxScroll > 0
				? (chartScrollEl.scrollLeft / maxScroll) * (scrollbarTrackEl.clientWidth - thumbW)
				: 0;
		thumb.style.left = `${leftPx}px`;
	}

	$effect(() => {
		if (!chartScrollEl) return;
		const el = chartScrollEl;
		el.addEventListener('scroll', updateThumb);
		return () => el.removeEventListener('scroll', updateThumb);
	});

	$effect(() => {
		bars;
		chartScrollEl;
		scrollbarTrackEl;
		if (!chartScrollEl || !scrollbarTrackEl) return;
		requestAnimationFrame(updateThumb);
	});

	function onTrackMouseDown(e: MouseEvent) {
		if (!chartScrollEl || !scrollbarTrackEl) return;
		if ((e.target as HTMLElement).classList.contains('scrollbar-thumb')) return;
		const rect = scrollbarTrackEl.getBoundingClientRect();
		const clickRatio = (e.clientX - rect.left) / rect.width;
		chartScrollEl.scrollLeft = clickRatio * (chartScrollEl.scrollWidth - chartScrollEl.clientWidth);
	}

	function onThumbMouseDown(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!chartScrollEl) return;
		const startX = e.clientX;
		const startScroll = chartScrollEl.scrollLeft;

		function onMove(ev: MouseEvent) {
			if (!chartScrollEl) return;
			const dx = ev.clientX - startX;
			const ratio = dx / chartScrollEl.clientWidth;
			chartScrollEl.scrollLeft = Math.max(
				0,
				Math.min(
					startScroll + ratio * chartScrollEl.clientWidth,
					chartScrollEl.scrollWidth - chartScrollEl.clientWidth
				)
			);
		}

		function onUp() {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
		}

		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
	}

	function onChartWheel(e: WheelEvent) {
		if (!chartScrollEl || !isScrollable) return;
		chartScrollEl.scrollLeft = Math.max(
			0,
			Math.min(
				chartScrollEl.scrollLeft + e.deltaY,
				chartScrollEl.scrollWidth - chartScrollEl.clientWidth
			)
		);
	}

	function scrollToCurrent() {
		if (!chartScrollEl || viewMode !== 'hourly') return;
		const currentHour = new Date().getHours();
		const barTotal = columnWidth + columnGap;
		const target = currentHour * barTotal + columnWidth / 2 - chartScrollEl.clientWidth / 2;
		chartScrollEl.scrollLeft = Math.max(
			0,
			Math.min(target, chartScrollEl.scrollWidth - chartScrollEl.clientWidth)
		);
		updateThumb();
	}

	$effect(() => {
		bars;
		viewMode;
		chartScrollEl;
		if (!chartScrollEl) return;
		requestAnimationFrame(scrollToCurrent);
	});
</script>

<div class="item-chart">
	<div class="chart-header">
		<div class="chart-tabs">
			<button type="button" class="nav-arrow" onclick={prevPeriod} aria-label="Previous">
				<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 32 32">
					<path d="M0 0h32v32H0z" fill="none" />
					<path fill="currentColor" d="M20.834 8.037L9.64 14.5c-1.43.824-1.43 2.175 0 3l11.194 6.463c1.43.826 2.598.15 2.598-1.5V9.537c0-1.65-1.17-2.326-2.598-1.5" />
				</svg>
			</button>
			{#key formatPeriodLabel()}
				<div class="chart-period-label" in:fade={{ duration: 150 }}>
					{formatPeriodLabel()}
				</div>
			{/key}
			<div class="toggle-divider"></div>
			<button
				type="button"
				class="chart-tab"
				class:active={viewMode === 'hourly'}
				onclick={() => { viewMode = 'hourly'; timeOffset = 0; }}
			>
				Hourly
			</button>
			<div class="toggle-divider"></div>
			<button
				type="button"
				class="chart-tab"
				class:active={viewMode === 'daily'}
				onclick={() => { viewMode = 'daily'; timeOffset = 0; }}
			>
				Daily
			</button>
			<div class="toggle-divider"></div>
			<button
				type="button"
				class="chart-tab"
				class:active={viewMode === 'monthly'}
				onclick={() => { viewMode = 'monthly'; timeOffset = 0; }}
			>
				Monthly
			</button>
			<div class="toggle-divider"></div>
			<button type="button" class="nav-arrow" onclick={nextPeriod} aria-label="Next">
				<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 32 32">
					<path d="M0 0h32v32H0z" fill="none" />
					<path fill="currentColor" d="M11.166 23.963L22.36 17.5c1.43-.824 1.43-2.175 0-3L11.165 8.037c-1.43-.826-2.598-.15-2.598 1.5v12.926c0 1.65 1.17 2.326 2.598 1.5z" />
				</svg>
			</button>
		</div>
	</div>

	<div class="chart-area" bind:clientWidth={chartAreaWidth}>
		<div
			class="chart-scroll"
			class:scrollable={isScrollable}
			bind:this={chartScrollEl}
			onwheel={onChartWheel}
		>
			{#each bars as bar (bar.label)}
				<div class="bar-column" style="width: {columnWidth}px">
					<div class="bar-track">
						<div class="bar-fill" style="height: {bar.percent}%">
							{#if bar.inQty > 0}
								<div class="bar-segment in" style="flex-grow: {bar.inQty}"></div>
							{/if}
							{#if bar.outQty > 0}
								<div class="bar-segment out" style="flex-grow: {bar.outQty}"></div>
							{/if}
						</div>
					</div>
					<div class="bar-label">{bar.label}</div>
					<div class="bar-count">
						{#if bar.inQty > 0}
							<span class="bar-count--in">+{bar.inQty}</span>
						{/if}
						{#if bar.outQty > 0}
							<span class="bar-count--out">-{bar.outQty}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
		{#if isScrollable}
			<div class="custom-scrollbar" bind:this={scrollbarTrackEl} onmousedown={onTrackMouseDown}>
				<div class="scrollbar-thumb" onmousedown={onThumbMouseDown}></div>
			</div>
		{/if}
	</div>
</div>

<style>
	.item-chart {
		margin-top: 0;
		padding-top: 0;
	}

	.chart-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 8px;
	}

	.chart-tabs {
		display: flex;
		align-items: center;
		padding: 2px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
	}

	.nav-arrow {
		padding: 0.2rem 0.35rem;
		font-size: 0.8rem;
		font-weight: 400;
		border: none;
		border-radius: 9px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.2s ease;
		line-height: 1;
		user-select: none;
	}

	.nav-arrow:hover {
		opacity: 1;
	}

	.nav-arrow:active {
		transform: scale(0.88);
		opacity: 0.85;
		transition:
			opacity 0.08s ease,
			transform 0.08s ease;
	}

	.chart-tab {
		padding: 0.2rem 0.45rem;
		font-weight: 400;
		border: none;
		border-radius: 9px;
		background: color-mix(in srgb, var(--bg-secondary), 50% transparent);
		color: var(--text-secondary);
		border: 1px solid transparent;
		cursor: pointer;
		font-size: 0.855rem;
		opacity: 0.7;
		transform: scale(0.96);
		transition:
			background-color 0.2s ease,
			color 0.2s ease,
			border-color 0.2s ease,
			opacity 0.2s ease,
			transform 0.2s ease;
	}

	.chart-tab.active {
		background: var(--bg-primary);
		border-color: color-mix(in srgb, var(--border-color) 40%, transparent);
		color: var(--text-primary);
		opacity: 1;
		animation: tab-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.chart-tab:not(.active):hover {
		opacity: 0.9;
		transform: scale(0.98);
	}

	.chart-tab:active {
		transform: scale(0.95);
	}

	@keyframes tab-bounce {
		0% { transform: scale(0.96) translateY(0); }
		50% { transform: scale(1.04) translateY(0); }
		100% { transform: scale(1) translateY(0); }
	}

	.toggle-divider {
		width: 2px;
		height: 22px;
		margin: 0 3px;
		background: var(--empty-text-secondary);
		opacity: 0.3;
		border-radius: 1px;
	}

	.chart-period-label {
		font-size: 12px;
		color: var(--text-secondary);
		opacity: 0.7;
		white-space: nowrap;
		flex-shrink: 0;
		margin: 0 4px;
	}

	.chart-empty {
		padding: 24px 0;
		font-size: 13px;
		color: var(--text-secondary);
	}

	.chart-area {
		width: 100%;
		overflow: visible;
		margin-top: 20px;
		position: relative;
}

.chart-area::before,
.chart-area::after {
		content: "";
		position: absolute;
		top: 0;
		bottom: 0;
		width: 48px; /* adjust fade width */
		pointer-events: none;
		z-index: 1;
}

.chart-area::before {
		left: 0;
		background: linear-gradient(
			to right,
			var(--bg-alt) 0%,
			transparent 100%
		);
}


.chart-area::after {
		right: 0;
		background: linear-gradient(
			to left,
			var(--bg-alt) 0%,
			transparent 100%
		);
}

	.chart-scroll {
		display: flex;
		gap: 8px;
		overflow-x: hidden;
		overflow-y: hidden;
		padding-bottom: 0;
	}

	.chart-scroll.scrollable {
		overflow-x: scroll;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.chart-scroll.scrollable::-webkit-scrollbar {
		display: none;
	}

	.bar-column {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
	}

	.bar-track {
		width: 100%;
		height: 180px;
		border-radius: 18px;
		position: relative;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--border-color) 25%, transparent);
		background: repeating-linear-gradient(
			45deg,
			transparent 0px,
			transparent 5px,
			color-mix(in srgb, var(--border-color) 30%, transparent) 5px,
			color-mix(in srgb, var(--border-color) 30%, transparent) 9px
		);
	}

	.bar-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column-reverse;
		border-radius: 18px;
		overflow: hidden;
		transition: height 300ms ease;
		min-height: 0;
	}

	.bar-segment {
		width: 100%;
		min-height: 2px;
		transition: filter 150ms ease;
	}

	.bar-segment.in {
		background: var(--green);
		opacity: 0.65;
	}

	.bar-segment.out {
		background: var(--red);
		opacity: 0.65;
	}

	.bar-segment:hover {
		filter: brightness(1.2);
	}

	.bar-label {
		font-size: 11px;
		color: var(--text-primary);
		margin-top: 6px;
		margin-left: 2px;
		font-weight: 400;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.bar-count {
		font-size: 11px;
		margin-left: 2px;
		font-weight: 400;
		color: var(--empty-text-secondary);
		opacity: 1;
		letter-spacing: 0.02em;
		display: flex;
		gap: 4px;
		opacity: 0.6;
	}

	.bar-count--in {
		color: var(--green);
	}

	.bar-count--out {
		color: var(--red);
		opacity: 0.85;
	}

	.custom-scrollbar {
		width: 100%;
		height: 10px;
		background: color-mix(in srgb, var(--border-color) 20%, transparent);
		border-radius: 5px;
		margin-top: 6px;
		cursor: pointer;
		position: relative;
		overflow: visible;
		flex-shrink: 0;
	}

	.custom-scrollbar:hover .scrollbar-thumb {
		background: color-mix(in srgb, var(--border-color) 80%, transparent);
	}

	.scrollbar-thumb {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: var(--border-color);
		border-radius: 5px;
		cursor: grab;
		min-width: 20px;
		transition: background-color 120ms ease;
		user-select: none;
	}

	.scrollbar-thumb:active {
		cursor: grabbing;
		background: var(--text-secondary);
	}
</style>
