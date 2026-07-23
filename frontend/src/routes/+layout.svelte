<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import Toast from '$lib/ToastNotification.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import logo from '$lib/assets/logo.png';
	let { children } = $props();
	let path = $derived($page.url.pathname);
	let sidebarOpen = $state(false);
	let menuOpen = $state(false);
	let theme = $state<'light' | 'dark'>('light');

	$effect(() => {
		const saved = localStorage.getItem('theme');
		if (saved === 'light' || saved === 'dark') {
			theme = saved;
		} else {
			theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
	});

	$effect(() => {
		document.documentElement.dataset.theme = theme;
		localStorage.setItem('theme', theme);
	});

	$effect(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = (e: MediaQueryListEvent) => {
			if (!localStorage.getItem('theme')) theme = e.matches ? 'dark' : 'light';
		};
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		menuOpen = false;
	}

	$effect(() => {
		if (menuOpen) {
			const handler = (e: MouseEvent) => {
				const target = e.target as HTMLElement;
				if (!target.closest('.ellipsis-wrap')) menuOpen = false;
			};
			document.addEventListener('click', handler, true);
			return () => document.removeEventListener('click', handler, true);
		}
	});
</script>

<div class="app-shell">
	{#if sidebarOpen}
		<div class="sidebar-backdrop" onclick={() => sidebarOpen = false}></div>
	{/if}
	<aside class="sidebar" class:open={sidebarOpen}>
		<div class="sidebar-header">
			<div class="logo"><img src={logo} alt="" class="logo-img" />Hadley Inventory</div>
			<div class="header-right">
				<div class="ellipsis-wrap">
					<button class="ellipsis-btn" onclick={() => menuOpen = !menuOpen} aria-label="Menu">
						<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
							<path d="M0 0h24v24H0z" fill="none" />
							<path fill="currentColor" d="M12 8a2 2 0 1 0 0-4a2 2 0 0 0 0 4m0 6a2 2 0 1 0 0-4a2 2 0 0 0 0 4m0 6a2 2 0 1 0 0-4a2 2 0 0 0 0 4" />
						</svg>
					</button>
					{#if menuOpen}
					<div class="dropdown-menu" onclick={() => menuOpen = false}>
						<a href="/help" class="dropdown-item">
							<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
								<path d="M12 18h.01M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2.5-3 4"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round" />
								<circle
									cx="12"
									cy="12"
									r="10"
									fill="none"
									stroke="currentColor"
									stroke-width="2" />
							</svg>
							Help
						</a>

						<button
							class="dropdown-item"
							onclick={() => window.dispatchEvent(new Event('open-search'))}>
							<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
								<circle
									cx="11"
									cy="11"
									r="7"
									fill="none"
									stroke="currentColor"
									stroke-width="2" />
								<path
									d="m20 20-3.5-3.5"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round" />
							</svg>
							Search <kbd>Ctrl+K</kbd>
                        </button>

						<button class="dropdown-item" onclick={toggleTheme}>
							<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
								{#if theme === 'light'}
									<!-- Moon -->
									<path
										d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round" />
								{:else}
									<!-- Sun -->
									<circle
										cx="12"
										cy="12"
										r="4"
										fill="none"
										stroke="currentColor"
										stroke-width="2" />
									<path
										d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round" />
								{/if}
							</svg>
							Switch to {theme === 'light' ? 'dark' : 'light'} theme
						</button>
					</div>
					{/if}
				</div>
				<button class="sidebar-close" onclick={() => sidebarOpen = false} aria-label="Close sidebar">
					<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
						<path d="M0 0h24v24H0z" fill="none" />
						<path fill="currentColor" fill-rule="evenodd" d="M6.416 4.767a2.65 2.65 0 0 0-2.65 2.65v8.832a2.65 2.65 0 0 0 2.65 2.65h1.461V4.767h-1.46Zm0-1.767A4.416 4.416 0 0 0 2 7.416v8.833a4.416 4.416 0 0 0 4.416 4.417h11.168A4.416 4.416 0 0 0 22 16.248V7.416A4.416 4.416 0 0 0 17.584 3zm3.228 1.767v14.132h7.94a2.65 2.65 0 0 0 2.65-2.65V7.416a2.65 2.65 0 0 0-2.65-2.65h-7.94Z" clip-rule="evenodd" />
					</svg>
				</button>
			</div>
		</div>
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

			<a href="/scan" class="tab-link scan-link" class:active={path === '/scan'}>
				<span class="tab-link-icon" aria-hidden="true">
    				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
    					<path d="M0 0h24v24H0z" fill="none" />
    					<path fill="currentColor" d="M8 21H4a1 1 0 0 1-1-1v-4a1 1 0 0 0-2 0v4a3 3 0 0 0 3 3h4a1 1 0 0 0 0-2m14-6a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 0 0 2h4a3 3 0 0 0 3-3v-4a1 1 0 0 0-1-1M20 1h-4a1 1 0 0 0 0 2h4a1 1 0 0 1 1 1v4a1 1 0 0 0 2 0V4a3 3 0 0 0-3-3M2 9a1 1 0 0 0 1-1V4a1 1 0 0 1 1-1h4a1 1 0 0 0 0-2H4a3 3 0 0 0-3 3v4a1 1 0 0 0 1 1m8-4H6a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1M9 9H7V7h2Zm5 2h4a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1m1-4h2v2h-2Zm-5 6H6a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1m-1 4H7v-2h2Zm5-1a1 1 0 0 0 1-1a1 1 0 0 0 0-2h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1m4-3a1 1 0 0 0-1 1v3a1 1 0 0 0 0 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1m-4 4a1 1 0 1 0 1 1a1 1 0 0 0-1-1" />
    				</svg>
				</span>
				<span>Scan &amp; Transact</span>
			</a>

			<a href="/labels" class="tab-link scan-link" class:active={path === '/labels'}>
				<span class="tab-link-icon" aria-hidden="true">
    				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
    					<path d="M0 0h24v24H0z" fill="none" />
    					<path fill="currentColor" d="M2 1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1m1 2v6h6V3z" />
    					<path fill="currentColor" fill-rule="evenodd" d="M5 5h2v2H5z" />
    					<path fill="currentColor" d="M14 1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1m1 2v6h6V3z" />
    					<path fill="currentColor" fill-rule="evenodd" d="M17 5h2v2h-2z" />
    					<path fill="currentColor" d="M2 13h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1m1 2v6h6v-6z" />
    					<path fill="currentColor" fill-rule="evenodd" d="M5 17h2v2H5z" />
    					<path fill="currentColor" d="M23 19h-4v4h-5a1 1 0 0 1-1-1v-8v5h2v2h2v-6h-2v-2h-1h3v2h2v2h2v-4h1a1 1 0 0 1 1 1zm0 2v1a1 1 0 0 1-1 1h-1v-2z" />
    				</svg>
				</span>
				<span>QR Code Generator</span>
			</a>

			<a href="/trash" class="tab-link" class:active={path === '/trash'}>
				<span class="tab-link-icon" aria-hidden="true">
    				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512">
    					<path d="M0 0h512v512H0z" fill="none" />
    					<path fill="currentColor" d="M96 472a23.82 23.82 0 0 0 23.579 24h272.842A23.82 23.82 0 0 0 416 472V152H96Zm32-288h256v280H128Z" />
    					<path fill="currentColor" d="M168 216h32v200h-32zm72 0h32v200h-32zm72 0h32v200h-32zm16-128V40c0-13.458-9.488-24-21.6-24H205.6C193.488 16 184 26.542 184 40v48H64v32h384V88ZM216 48h80v40h-80Z" />
    				</svg>
				</span>
				<span>Recently Deleted</span>
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

			<a href="/tools" class="tab-link" class:active={path === '/tools' || (path.startsWith('/tools/') && path !== '/tools/new' && path !== '/tools/costing' && path !== '/tools/maintenance-flags')}>
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

			<a href="/tools/maintenance-flags" class="tab-link" class:active={path === '/tools/maintenance-flags'}>
    			<span class="tab-link-icon" aria-hidden="true">
        			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                       	<path d="M0 0h24v24H0z" fill="none" />
                       	<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5">
                      		<path stroke-linejoin="round" d="M12 22h-1.5c-3.771 0-5.657 0-6.828-1.172S2.5 17.771 2.5 14v-4c0-3.771 0-5.657 1.172-6.828S6.729 2 10.5 2h1c3.771 0 5.657 0 6.828 1.172S19.5 6.229 19.5 10v1M7 7h8m-8 5h4.5" />
                      		<path d="M17.5 20.773c1.767 0 3.2-1.465 3.2-3.273c0-1.807-1.433-3.273-3.2-3.273m0 6.546c-1.767 0-3.2-1.465-3.2-3.273c0-1.807 1.433-3.273 3.2-3.273m0 6.546V22m0-7.773V13m-2.909 2.715l-1.09-.67m7.999 4.91l-1.09-.67m-.001-3.57l1.09-.67m-7.999 4.91l1.09-.67" />
                       	</g>
                    </svg>
    			</span>
			<span>Maintenance</span>
			</a>

		<span class="nav-label">Reference</span>

			<a href="/jobs" class="tab-link" class:active={path === '/jobs' || path.startsWith('/jobs/')}>
				<span class="tab-link-icon" aria-hidden="true">
    				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
    					<path d="M0 0h16v16H0z" fill="none" />
    					<path fill="currentColor" fill-rule="evenodd" d="M6 1a1.75 1.75 0 0 0-1.75 1.75V4H3a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.25V2.75A1.75 1.75 0 0 0 10 1zm4.25 3V2.75A.25.25 0 0 0 10 2.5H6a.25.25 0 0 0-.25.25V4zM3 5.5h10a.5.5 0 0 1 .5.5v1h-11V6a.5.5 0 0 1 .5-.5m-.5 3V13a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8.5H9V10H7V8.5z" clip-rule="evenodd" />
    				</svg>
				</span>
				<span>Jobs</span>
			</a>
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
			<span>Locations</span>
			</a>
		</nav>
	</aside>
	<main class="main">
		<button class="menu-toggle" onclick={() => sidebarOpen = true} aria-label="Open sidebar">
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
				<path d="M0 0h24v24H0z" fill="none" />
				<path fill="currentColor" fill-rule="evenodd" d="M6.416 3A4.416 4.416 0 0 0 2 7.416v8.833a4.416 4.416 0 0 0 4.416 4.417h11.168A4.416 4.416 0 0 0 22 16.248V7.416A4.416 4.416 0 0 0 17.584 3zm3.228 1.767v14.132h7.94a2.65 2.65 0 0 0 2.65-2.65V7.416a2.65 2.65 0 0 0-2.65-2.65h-7.94Z" clip-rule="evenodd" />
			</svg>
		</button>
	{@render children()}
</main>
</div>
<Toast />
<ConfirmDialog />
<CommandPalette />

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
	.sidebar nav {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
		padding-bottom: 2rem;
	}
	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-right: 4px;
		flex-shrink: 0;
	}
	.header-right {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.sidebar-close {
		display: none;
		transition: color 0.15s ease;
	}
	.sidebar-close:hover { color: var(--text-primary); }
	.sidebar-backdrop,
	.menu-toggle {
		display: none;
	}
	.logo {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
		padding: 8px 7px;
		margin-bottom: 8px;
		letter-spacing: 0.02em;
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.logo-img {
		height: 18px;
		width: auto;
		display: block;
	}

	.ellipsis-wrap {
		position: relative;
		display: flex;
		margin-bottom: 6px;
	}

	.ellipsis-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--empty-text-primary);
		cursor: pointer;
		padding: 8px;
		border-radius: 8px;
		font-size: 20px;
		transition: color 0.15s ease;
	}
	.ellipsis-btn:hover { color: var(--text-primary); }
	.ellipsis-btn svg { width: 20px; height: 20px; }

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 4px;
		min-width: 180px;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 10px;
		padding: 4px;
		box-shadow: 0 4px 16px rgba(0,0,0,0.12);
		z-index: 1000000000000;
		display: flex;
		flex-direction: column;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		box-sizing: border-box;
		text-align: left;
		padding: 8px 12px;
		font-size: 13px;
		font-weight: 400;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		text-decoration: none;
		font-family: inherit;
		transition: background 0.12s ease;
	}

    .dropdown-item svg {
    	flex-shrink: 0;
    	opacity: 0.8;
    }
	.dropdown-item:hover {
    	background: color-mix(in srgb, var(--empty-text-secondary) 20%, transparent);
        color: var(--text-primary);
	}
	.nav-label {
		font-size: 11px;
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

	@media (max-width: 899px) {
		.sidebar {
			position: fixed;
			left: 0;
			top: 0;
			width: 280px;
			padding: 20px 12px;
			transform: translateX(-100%);
			transition: transform 0.25s ease;
			z-index: 100;
			box-shadow: 4px 0 20px rgba(0,0,0,0.15);
		}
		.sidebar.open {
			transform: translateX(0);
		}
		.sidebar-close {
			display: flex;
			align-items: center;
			justify-content: center;
			background: transparent;
			border: none;
			color: var(--empty-text-primary);
			cursor: pointer;
			padding: 8px;
			border-radius: 8px;
			margin-bottom: 6px;
			font-size: 20px;
			transition: color 0.15s ease;
		}
		.sidebar-close:hover { color: var(--text-primary); }
		.sidebar-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0,0,0,0.35);
			z-index: 99;
		}
		.menu-toggle {
			display: flex;
			align-items: center;
			justify-content: center;
			position: fixed;
			top: 12px;
			left: 12px;
			z-index: 50;
			padding: 8px;
			border-radius: 8px;
			background: transparent;
			color: var(--empty-text-primary);
			border: none;
			cursor: pointer;
			font-size: 20px;
		}
		.tab-link {
			font-size: 15px;
			padding: 8px 10px;
			margin-bottom: 2px;
		}
		.tab-link-icon svg {
			height: 16px;
			width: 16px;
		}
		.nav-label {
			font-size: 10px;
			padding: 6px 10px;
		}
		.main {
			padding: 60px 12px 12px;
		}
	}
	kbd {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		padding: 1px 5px;
		font-size: 12px;
		font-family: inherit;
	}
</style>
