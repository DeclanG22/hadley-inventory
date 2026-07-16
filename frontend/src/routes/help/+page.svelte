<div class="page-header">
	<h1>How to Use This System</h1>
</div>

<div class="help-grid">
	<div class="card">
		<h3>Dashboard</h3>
		<p>The dashboard shows key numbers at a glance: total items, low stock alerts, tools, checked-out tools, overdue returns, vendors, and locations. The activity feed below shows recent item movements, checkouts, and maintenance events.</p>
	</div>

	<div class="card">
		<h3>Scan &amp; Transact</h3>
		<p>This is the main page for recording inventory movement.</p>
		<ul>
			<li><strong>Search</strong> by item number, tool number, or description. You can also scan a bin QR code with a barcode scanner — it types the code in automatically.</li>
			<li><strong>Items</strong>: choose Out (issue) or In (receive), enter quantity, then click the button. A job number is optional but recommended for tracking.</li>
			<li><strong>Weight mode</strong>: if the item has a unit weight set, a weight field appears. Change quantity and weight updates; change weight and quantity updates. This lets you weigh a handful of parts and get the count.</li>
			<li><strong>Tools</strong>: enter the person's name to check out, or click Check In to return it.</li>
			<li><strong>Total Cost</strong>: for items, you can enter the total cost paid. The unit price is derived automatically.</li>
		</ul>
	</div>

	<div class="card">
		<h3>Items</h3>
		<p>Browse, search, and filter all inventory items. Click any row to view details and edit fields like description, unit, price, weight, category, location, vendor, and stock levels.</p>
		<p>Key fields:</p>
		<ul>
			<li><strong>Min Stock</strong> — set a minimum quantity. When on-hand drops to or below this, the item appears on the Low Stock page and dashboard alert.</li>
			<li><strong>Weight/Unit</strong> — the weight of one unit in grams. Used on the Scan page for weight-based quantity entry.</li>
			<li><strong>Analysis Code</strong> — a code for categorising or analysing costs (shown on the costing page).</li>
		</ul>
		<p>Import items from a spreadsheet via the <strong>Import</strong> link on the items list.</p>
	</div>

	<div class="card">
		<h3>Tools</h3>
		<p>Tools are unique assets (not consumable items). Each has its own number, name, brand/model, and serial number.</p>
		<ul>
			<li><strong>Check out</strong> a tool to track who has it, what job, and when it's due back.</li>
			<li><strong>Check in</strong> when it's returned.</li>
			<li><strong>Maintenance logs</strong> — on the tool detail page you can add maintenance records (repair, service, calibration, inspection) with cost and notes.</li>
			<li><strong>Flags</strong> — if a tool needs attention but you're not logging maintenance yet, create a flag. This is visible on the Maintenance page so a supervisor can review and schedule the work.</li>
		</ul>
	</div>

	<div class="card">
		<h3>Costing</h3>
		<p>Two costing views exist:</p>
		<ul>
			<li><strong>Items Costing</strong> — a full ledger of every in/out transaction with date, item, job number, quantity, prices, and analysis code. Use the filters to narrow down by job or date range. Export to CSV.</li>
			<li><strong>Tools Costing</strong> — combines purchase costs and maintenance costs for a complete cost-of-ownership view.</li>
		</ul>
	</div>

	<div class="card">
		<h3>Stock Take</h3>
		<p>Create a stock take to record physical counts of all items. The system snapshots current quantities so you can enter what's actually on the shelf. When you reconcile, variances are automatically applied to on-hand counts.</p>
	</div>

	<div class="card">
		<h3>QR Codes &amp; Labels</h3>
		<p>Each item and tool can have a bin QR code. Use the <strong>QR Code Generator</strong> page to print labels. Items and tools marked as "printed" won't show up again on the generator.</p>
	</div>

	<div class="card">
		<h3>Keyboard Shortcut</h3>
		<p>Press <kbd>Ctrl+K</kbd> (or <kbd>Cmd+K</kbd> on Mac) to open the command palette for quick navigation.</p>
	</div>
</div>

<style>
	.help-grid {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.help-grid h3 {
		margin-bottom: 6px;
		font-size: 15px;
	}
	.help-grid p {
		font-size: 13px;
		color: var(--text-secondary);
		margin-bottom: 6px;
		line-height: 1.5;
	}
	.help-grid ul {
		font-size: 13px;
		color: var(--text-secondary);
		padding-left: 18px;
		line-height: 1.6;
	}
	.help-grid kbd {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		padding: 1px 5px;
		font-size: 12px;
		font-family: inherit;
	}
</style>
