<script lang="ts">
	import dashboardImg from '$lib/assets/dashboard.png';
	import scan from '$lib/assets/scan.png';
	import itemdetail from '$lib/assets/itemdetail.png';
	import tooldetail from '$lib/assets/tooldetail.png';
	import itemcosting from '$lib/assets/itemcosting.png';
	import stocktake from '$lib/assets/stocktake.png';
	import qrcode from '$lib/assets/qrcode.png';

	let activeSection = $state('');

	function scrollTo(event: MouseEvent, id: string) {
		event.preventDefault();

		activeSection = id;

		document.getElementById(id)?.scrollIntoView({
			behavior: 'smooth',
			block: 'start'
		});
	}

	$effect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort(
						(a, b) =>
							b.intersectionRatio - a.intersectionRatio
					);

				if (visible[0]) {
					activeSection = visible[0].target.id;
				}
			},
			{
				rootMargin: '-100px 0px -60% 0px',
				threshold: [0, 0.25, 0.5, 1]
			}
		);

		const sections = document.querySelectorAll('.doc-section');

		sections.forEach((section) => {
			observer.observe(section);
		});

		return () => {
			observer.disconnect();
		};
	});
</script>

<div class="page-header">
	<h1>How to Use This System</h1>
</div>

<div class="docs-layout">
	<div class="docs-content">
		<section id="dashboard" class="doc-section">
			<h2>Dashboard</h2>
			<p>The dashboard is your home base. It shows the big picture: total items, low stock alerts, tools, checked-out tools, overdue returns, vendors, and locations all in one place. The activity feed below lists recent item movements, checkouts, and maintenance events so you can see what has been happening at a glance.</p>

			<div class="img-placeholder">
				<img src={dashboardImg} alt="Dashboard screenshot" class="help-img" />
			</div>
		</section>

		<section id="scan" class="doc-section">
			<h2>Scan and Transact</h2>
			<p>This is where you record inventory movement day to day.</p>
			<ul>
				<li><strong>Search</strong> by item number, tool number, or description. You can also scan a bin QR code with a barcode scanner, and it types the code in automatically.</li>
				<li><strong>Items</strong>: pick Out to issue stock or In to receive it, enter the quantity, and hit the button. A job number is optional but recommended so you can track where things went.</li>
				<li><strong>Weight entry</strong>: if the item has a weight per unit set, a weight field appears next to quantity. Change the quantity and the weight updates, or change the weight and the quantity recalculates. This lets you weigh a handful of parts and get an instant count.</li>
				<li><strong>Tools</strong>: type the persons name to check a tool out, or click Check In to return it.</li>
				<li><strong>Total cost</strong>: for items you can enter the total amount paid, and the unit price is figured out for you.</li>
			</ul>


			<div class="img-placeholder">
				<img src={scan} alt="Scan page" class="help-img" />
			</div>

		</section>

		<section id="items" class="doc-section">
			<h2>Items</h2>
			<p>Browse, search, and filter every inventory item. Click any row to open the detail page where you can edit fields like description, unit, price, weight, category, location, vendor, and stock levels.</p>
			<p>Key fields you should know about:</p>
			<ul>
				<li><strong>Min Stock</strong> sets a minimum quantity. When on-hand drops to or below this number, the item shows up on the Low Stock page and the dashboard alert.</li>
				<li><strong>Weight per Unit</strong> is the weight of a single unit in grams. This is used on the Scan page for weight based quantity entry.</li>
				<li><strong>Analysis Code</strong> is a code for categorizing or analyzing costs. It appears on the costing page so you can group and report on spending.</li>
			</ul>
			<p>You can also import items from a spreadsheet using the Import link on the items list page.</p>

			<div class="img-placeholder">
				<img src={itemdetail} alt="Item Detail Page" class="help-img" />
			</div>
		</section>

		<section id="tools" class="doc-section">
			<h2>Tools</h2>
			<p>Tools are unique assets, not consumable items. Each tool has its own number, name, brand and model, and serial number so you can keep track of individual pieces of equipment.</p>
			<ul>
				<li><strong>Check out</strong> a tool to record who has it, what job it is for, and when it is due back.</li>
				<li><strong>Check in</strong> when the tool is returned.</li>
				<li><strong>Maintenance logs</strong> let you add records for repair, service, calibration, or inspection work, including cost and notes. If there is an existing flag that was issued for a log, you can attach that flag to fill out the log faster, and resolve the existing flag when logged.</li>
				<li><strong>Flags</strong> are what you do when a tool needs maintenance. You can issue a repair, service, calibration, or inspection flag. This alerts an admin that the tool needs attention.</li>
			</ul>

			<div class="img-placeholder">
				<img src={tooldetail} alt="Tool Scan Page" class="help-img" />
			</div>
		</section>

		<section id="costing" class="doc-section">
			<h2>Costing</h2>
			<p>There are two costing views to help you track spending:</p>
			<ul>
				<li><strong>Items Costing</strong> is a full ledger of every in and out transaction. It shows date, item, job number, quantity, prices, and analysis code. You can filter by job or date range and export to CSV.</li>
				<li><strong>Tools Costing</strong> combines purchase costs and maintenance costs so you can see the total cost of ownership for each tool.</li>
			</ul>

			<div class="img-placeholder">
				<img src={itemcosting} alt="Item Costing Page" class="help-img" />
			</div>
		</section>

		<section id="stock-take" class="doc-section">
			<h2>Stock Take</h2>
			<p>Create a stock take to record physical counts of everything on the shelf. The system takes a snapshot of current quantities so you can enter what you actually see. When you reconcile, any differences are automatically applied to the on-hand counts.</p>

			<div class="img-placeholder">
				<img src={stocktake} alt="Stocktake page" class="help-img" />
			</div>
		</section>

		<section id="qr-codes" class="doc-section">
			<h2>QR Codes and Labels</h2>
			<p>Every item and tool can have a bin QR code. Use the QR Code Generator page to print labels for anything that has not been printed yet. Items and tools marked as printed are hidden from the generator so you only see what still needs a label.</p>

			<div class="img-placeholder">
				<img src={qrcode} alt="QR Code Generation page" class="help-img" />
			</div>
		</section>

		<section id="shortcuts" class="doc-section">
			<h2>Keyboard Shortcuts</h2>
			<p>Press <kbd>Ctrl+K</kbd> to open the command palette for quick navigation anywhere in the system.</p>
		</section>
	</div>

	<aside class="docs-sidebar">
		<nav class="docs-toc">
			<a href="#dashboard" class="toc-item" class:active={activeSection === 'dashboard'} onclick={() => scrollTo('dashboard')}>
				Dashboard
			</a>
			<a href="#scan" class="toc-item" class:active={activeSection === 'scan'} onclick={() => scrollTo('scan')}>
				Scan and Transact
			</a>
			<a href="#items" class="toc-item" class:active={activeSection === 'items'} onclick={() => scrollTo('items')}>
				Items
			</a>
			<a href="#tools" class="toc-item" class:active={activeSection === 'tools'} onclick={() => scrollTo('tools')}>
				Tools
			</a>
			<a href="#costing" class="toc-item" class:active={activeSection === 'costing'} onclick={() => scrollTo('costing')}>
				Costing
			</a>
			<a href="#stock-take" class="toc-item" class:active={activeSection === 'stock-take'} onclick={() => scrollTo('stock-take')}>
				Stock Take
			</a>
			<a href="#qr-codes" class="toc-item" class:active={activeSection === 'qr-codes'} onclick={() => scrollTo('qr-codes')}>
				QR Codes and Labels
			</a>
			<a href="#shortcuts" class="toc-item" class:active={activeSection === 'shortcuts'} onclick={() => scrollTo('shortcuts')}>
				Keyboard Shortcuts
			</a>
		</nav>
	</aside>
</div>

<style>
	.docs-layout {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	.docs-content {
		flex: 1;
		min-width: 0;
		padding-bottom: 80vh;
	}

	.doc-section {
		margin-bottom: 40px;
	}

	.doc-section h2 {
		font-size: 17px;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 10px;
	}

	.doc-section p {
		font-size: 13px;
		color: var(--text-secondary);
		margin-bottom: 8px;
		line-height: 1.6;
	}

	.doc-section ul {
		font-size: 13px;
		color: var(--text-secondary);
		padding-left: 18px;
		line-height: 1.7;
		margin-bottom: 12px;
	}

	.doc-section kbd {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		padding: 1px 5px;
		font-size: 12px;
		font-family: inherit;
	}

	/* Image placeholder */
	.img-placeholder {
		margin: 16px 0 8px;
	}

	.placeholder-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 40px 20px;
		background: var(--bg-secondary);
		border: 1px dashed var(--border-color);
		border-radius: 12px;
		color: var(--empty-text-secondary);
		font-size: 13px;
	}

	.placeholder-box svg {
		opacity: 0.4;
	}

	.help-img {
		width: 100%;
		border-radius: 12px;
		border: 1px solid var(--border-color);
		display: block;
		box-shadow: var(--shadow-sm);
	}

	.caption {
		font-size: 12px !important;
		color: var(--empty-text-primary) !important;
		margin-top: 6px !important;
		margin-bottom: 0 !important;
		font-style: italic;
	}

	/* Right sidebar TOC */
	.docs-sidebar {
		width: 90px;
		flex-shrink: 0;
		position: sticky;
		top: 24px;
		align-self: flex-start;
	}

	.docs-toc {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.toc-item {
		display: block;
		padding: 4px 6px;
		font-size: 11px;
		color: var(--empty-text-primary);
		text-decoration: none;
		border-radius: 6px;
		transition: background 0.12s ease, color 0.12s ease;
		line-height: 1.2;
		word-break: break-word;
	}

	.toc-item:hover {
		background: color-mix(in srgb, var(--empty-text-secondary) 15%, transparent);
		color: var(--text-secondary);
	}

	.toc-item.active {
		background: color-mix(in srgb, var(--accent-dark) 12%, transparent);
		color: var(--accent-dark);
		font-weight: 500;
	}

	@media (max-width: 899px) {
		.docs-layout {
			flex-direction: column;
		}

		.docs-sidebar {
			display: none;
		}
	}
</style>
