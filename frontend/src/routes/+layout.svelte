<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import Toast from '$lib/ToastNotification.svelte';
	let { children } = $props();
	let path = $derived($page.url.pathname);
</script>

<div class="app-shell">
	<aside class="sidebar">
		<div class="logo">Hadley Inventory</div>
		<nav>
			<a href="/" class="tab-link" class:active={path === '/'}>
			<span class="tab-link-icon" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
				<path d="M0 0h24v24H0z" fill="none" />
				<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 5a2 2 0 0 1 2-2h6v18H4a2 2 0 0 1-2-2zm12-2h6a2 2 0 0 1 2 2v5h-8zm0 11h8v5a2 2 0 0 1-2 2h-6z" />
</svg>

			</span>
			<span>Dashboard</span>

			</a>

			<span class="nav-label">Items</span>
			<a href="/items" class="tab-link" class:active={path === '/items' || (path.startsWith('/items/') && path !== '/items/new' && path !== '/items/low-stock' && path !== '/items/costing' && path !== '/items/import')}>
<span class="tab-link-icon" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<path fill="currentColor" d="M5 22q-.825 0-1.412-.587T3 20V8.725q-.45-.275-.725-.712T2 7V4q0-.825.588-1.412T4 2h16q.825 0 1.413.588T22 4v3q0 .575-.275 1.013T21 8.724V20q0 .825-.587 1.413T19 22zM5 9v11h14V9zM4 7h16V4H4zm6 7h4q.425 0 .713-.288T15 13t-.288-.712T14 12h-4q-.425 0-.712.288T9 13t.288.713T10 14m2 .5" />
    </svg>


</span>
			<span>All Items</span>
			</a>
			<a href="/items/new" class="tab-link" class:active={path === '/items/new'}>
				<span class="tab-link-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
					<path d="M0 0h24v24H0z" fill="none" />
					<path fill="currentColor" d="m21.71 10.12l-7.83-7.83a1 1 0 0 0-1.7.57L11.45 8l-2 2l-.33-.19A1 1 0 0 0 8 11.44l-1.15 1.17l-.33-.19a1 1 0 0 0-1.11 1.63l-1.17 1.16l-.32-.21a1 1 0 0 0-1.37.37a1 1 0 0 0 .25 1.26l-.51.51a.9.9 0 0 0-.21.33a1 1 0 0 0-.08.38V21a1 1 0 0 0 1 1h3.13a1 1 0 0 0 .38-.08a.9.9 0 0 0 .33-.21L8.54 20l.33.19a1 1 0 0 0 1.37-.36a1 1 0 0 0-.24-1.27l1.17-1.16l.33.19a1 1 0 0 0 .49.13a1 1 0 0 0 .6-1.72l1.17-1.16l.33.19a1 1 0 0 0 .49.13a1 1 0 0 0 .62-1.77l.79-.79l5.15-.73a1 1 0 0 0 .81-.68a1 1 0 0 0-.24-1.07M5.72 20H4v-1.72l.57-.57L6.75 19Zm2.49-2.5L6 16.25l1.14-1.14l2.17 1.25Zm2.61-2.6l-2.18-1.26l1.15-1.14L12 13.75Zm2.61-2.61L11.25 11l1.14-1.14l1.72 1.72Zm2.45-1.74l-2.43-2.43l.43-3l5 5Z" />
				</svg>


				</span>
			<span>New Item</span>

			</a>
			<a href="/item-categories" class="tab-link" class:active={path === '/item-categories'}>
			<span class="tab-link-icon" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
				<path d="M0 0h24v24H0z" fill="none" />
				<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 3h6m-3-3v6" />
</svg>
			</span>
			<span>Categories</span>

			</a>
			<a href="/items/low-stock" class="tab-link" class:active={path === '/items/low-stock'}>
			<span class="tab-link-icon" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
				<path d="M0 0h24v24H0z" fill="none" />
				<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5">
					<path stroke-linejoin="round" d="M12 22c-.818 0-1.6-.33-3.163-.988C4.946 19.373 3 18.554 3 17.175V7.542M12 22c.818 0 1.6-.33 3.163-.988C19.054 19.373 21 18.554 21 17.175V7.542M12 22v-9.97m9-4.488c0 .613-.802 1-2.405 1.773l-2.92 1.41c-1.804.87-2.705 1.304-3.675 1.304m9-4.487c0-.612-.802-.999-2.405-1.772L17 5M3 7.542c0 .613.802 1 2.405 1.773l2.92 1.41c1.804.87 2.705 1.304 3.675 1.304M3 7.542c0-.612.802-.999 2.405-1.772L7 5m-1 8.026l2 .997" />
					<path d="m10 2l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2" />
				</g>
			</svg>

			</span>
			<span>Low Stock</span>

			</a>

			<a href="/items/costing" class="tab-link" class:active={path === '/items/costing'}>
			<span class="tab-link-icon" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
				<path d="M0 0h16v16H0z" fill="none" />
				<path fill="currentColor" d="M4 9h4v2H4z" />
				<path fill="currentColor" d="M16 2h-1V0H5v2H3v1.25L2.4 4H1v1.75L0 7v9h12l4-5zM2 5h8v2H2zm9 10H1V8h10zm1-8h-1V4H4V3h8zm2-2.5l-1 1.25V2H6V1h8z" />
</svg>

			</span>
			<span>Costing</span>

			</a>

			<a href="/stock-takes" class="tab-link" class:active={path === '/stock-takes' || path.startsWith('/stock-takes/')}>
			<span class="tab-link-icon" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
				<path d="M0 0h24v24H0z" fill="none" />
				<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
					<path d="M4 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0m12 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M6 12v-2a6 6 0 1 1 12 0v2" />
					<path d="m15 9l3 3l3-3" />
				</g>
</svg>


			</span>
			<span>Stock Take</span>
			</a>




			<span class="nav-label">Tools</span>
			<a href="/tools" class="tab-link" class:active={path === '/tools' || (path.startsWith('/tools/') && path !== '/tools/new' && path !== '/tools/costing')}>
    <span class="tab-link-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 48 48">
            <path d="M0 0h48v48H0z" fill="none" />
            <g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="3">
                <path d="M3.537 17.102c.228-2.17 1.763-3.879 3.922-4.19C10.456 12.477 15.653 12 24 12s13.544.478 16.54.911c2.16.313 3.695 2.022 3.923 4.191C44.724 19.598 45 23.334 45 28s-.276 8.402-.537 10.898c-.228 2.17-1.763 3.878-3.922 4.19C37.544 43.523 32.347 44 24 44s-13.544-.478-16.54-.911c-2.16-.313-3.695-2.022-3.923-4.191C3.276 36.402 3 32.666 3 28s.276-8.402.537-10.898Z" />
                <path d="M45 27s-4.337.874-18 .988M3 27s4.337.874 18 .988" />
                <path stroke-linecap="round" d="M14 12c.53-2.12 1.735-4.512 2.542-5.97c.49-.888 1.338-1.509 2.34-1.663C20.029 4.19 21.778 4 24 4s3.97.19 5.118.367c1.002.154 1.85.775 2.34 1.663C32.265 7.488 33.47 9.88 34 12" />
                <path d="M24.247 32.5c1.507-.007 2.648-1.035 2.714-2.541c.024-.54.039-1.187.039-1.959s-.015-1.42-.039-1.959c-.066-1.506-1.207-2.535-2.714-2.54h-.494c-1.507.005-2.648 1.034-2.714 2.54c-.024.54-.039 1.187-.039 1.959s.015 1.42.039 1.959c.066 1.506 1.207 2.534 2.714 2.54z" />
            </g>
        </svg>
    </span>
    <span>All Tools</span>
</a>
			<a href="/tools/new" class="tab-link" class:active={path === '/tools/new'}>
			 <span class="tab-link-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
					<path d="M0 0h24v24H0z" fill="none" />
					<path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5" d="M10.691 4.562a6.19 6.19 0 0 1 6.545-1.42c.378.141.45.62.165.906l-2.787 2.787a1.037 1.037 0 0 0 0 1.467l1.084 1.084a1.037 1.037 0 0 0 1.467 0L19.953 6.6c.285-.285.764-.212.905.165a6.187 6.187 0 0 1-7.696 8.058c-.396-.128-.84-.054-1.134.24L6.481 20.61a2.186 2.186 0 1 1-3.09-3.09l5.547-5.548c.294-.294.368-.738.24-1.134a6.19 6.19 0 0 1 1.513-6.276Z" />
</svg>

				</span>
			<span>New Tool</span>

			</a>
			<a href="/tools/costing" class="tab-link" class:active={path === '/tools/costing'}>
			<span class="tab-link-icon" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
				<path d="M0 0h16v16H0z" fill="none" />
				<path fill="currentColor" d="M4 9h4v2H4z" />
				<path fill="currentColor" d="M16 2h-1V0H5v2H3v1.25L2.4 4H1v1.75L0 7v9h12l4-5zM2 5h8v2H2zm9 10H1V8h10zm1-8h-1V4H4V3h8zm2-2.5l-1 1.25V2H6V1h8z" />
			</svg>
			</span>
			<span>Costing</span>
			</a>

			<a href="/tool-categories" class="tab-link" class:active={path === '/tool-categories'}>
			<span class="tab-link-icon" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
				<path d="M0 0h24v24H0z" fill="none" />
				<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 3h6m-3-3v6" />
</svg>
			</span>
			<span>Categories</span>

			</a>

			<span class="nav-label">Reference</span>
			<a href="/vendors" class="tab-link" class:active={path === '/vendors' || path.startsWith('/vendors/')}>
<span class="tab-link-icon" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<path fill="currentColor" d="M18 15h-2v2h2m0-6h-2v2h2m2 6h-8v-2h2v-2h-2v-2h2v-2h-2V9h8M10 7H8V5h2m0 6H8V9h2m0 6H8v-2h2m0 6H8v-2h2M6 7H4V5h2m0 6H4V9h2m0 6H4v-2h2m0 6H4v-2h2m6-10V3H2v18h20V7z" />
    </svg>

</span>
			<span>Vendors</span>
			</a>
			<a href="/locations" class="tab-link" class:active={path === '/locations' || path.startsWith('/locations/')}>
<span class="tab-link-icon" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<path fill="currentColor" d="M16 10c0-2.21-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4m-6 0c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2" />
	<path fill="currentColor" d="M11.42 21.81c.17.12.38.19.58.19s.41-.06.58-.19c.3-.22 7.45-5.37 7.42-11.82c0-4.41-3.59-8-8-8s-8 3.59-8 8c-.03 6.44 7.12 11.6 7.42 11.82M12 4c3.31 0 6 2.69 6 6c.02 4.44-4.39 8.43-6 9.74c-1.61-1.31-6.02-5.29-6-9.74c0-3.31 2.69-6 6-6" />
    </svg>

</span>
			<span>Locations</span></a>
		</nav>
	</aside>
	<main class="main">
		{@render children()}
	</main>
</div>
<Toast />

<style>
	.app-shell {
		display: flex;
		height: 100dvh;
		overflow: hidden;
	}
	.sidebar {
		width: 220px;
		flex-shrink: 0;
		padding: 16px 8px;
		border-right: 1px solid var(--border-color);
		background: color-mix(in srgb, var(--bg-secondary) 95%, var(--bg-primary) 35%);
		display: flex;
		flex-direction: column;
		gap: 2px;
		height: 100dvh;
	}
	.logo {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
		padding: 8px 7px;
		margin-bottom: 8px;
		letter-spacing: 0.02em;
	}
	.nav-label {
		font-size: 9px;
		font-weight: 500;
		letter-spacing: -0.04em;
		color: var(--empty-text-secondary);
		padding: 5px 7px;
		margin-top: 5px;
	}
	.tab-link {
		display: block;
		border: 0;
		background: transparent;
		color: var(--empty-text-primary);
		font-weight: 400;
		text-align: left;
		font-size: 13px;
		padding: 5px 7px;
		margin-bottom: 1px;
		border-radius: 8px;
		cursor: pointer;
		text-decoration: none;
		transition: background 0.15s ease, color 0.15s ease;
	}
	.tab-link:hover {
		background: color-mix(in srgb, var(--empty-text-secondary) 20%, transparent);
		color: var(--text-secondary);
	}
	.tab-link.active {
	background: color-mix(in srgb, var(--empty-text-secondary) 20%, transparent);
	color: var(--text-secondary);
	}

	.tab-link-icon svg{
	height: 13px;
	width: 13px;
	margin-right: 2px;
	color: var(--empty-text-primary);
	transform: translateY(1px);
	}
	.main {
		flex: 1;
		padding: 24px;
		max-width: 1280px;
		overflow-x: auto;
		overflow-y: auto;
		height: 100dvh;
		box-sizing: border-box;
	}
</style>
