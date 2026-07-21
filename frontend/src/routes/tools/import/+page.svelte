<script lang="ts">
	import { tools } from '$lib/api';

	let file = $state<File | null>(null);
	let analysis = $state<any>(null);
	let fields = $state<any[]>([]);
	let columnMap = $state<Record<string, string>>({});
	let uploading = $state(false);
	let importing = $state(false);
	let result = $state<any>(null);
	let error = $state('');
	let fieldsLoading = $state(true);

	$effect(() => {
		tools.import.fields().then(d => fields = d).finally(() => fieldsLoading = false);
	});

	async function analyzeFile() {
		if (!file) return;
		uploading = true;
		error = '';
		analysis = null;
		result = null;

		try {
			const data = await tools.import.analyze(file);
			analysis = data;
			columnMap = {};
			for (const [col, mapped] of Object.entries(data.mapping) as [string, string | null][]) {
				if (mapped) columnMap[col] = mapped;
			}
		} catch (e: any) {
			error = e.message || 'Analysis failed';
		} finally {
			uploading = false;
		}
	}

	async function executeImport() {
		if (!analysis) return;
		importing = true;
		error = '';

		try {
			result = await tools.import.execute(analysis.fileToken, columnMap);
		} catch (e: any) {
			error = e.message || 'Import failed';
		} finally {
			importing = false;
		}
	}

	function onFileDrop(e: DragEvent) {
		const f = e.dataTransfer?.files?.[0];
		if (f) file = f;
	}

	function csvColFor(fieldValue: string): string | undefined {
		for (const [col, mapped] of Object.entries(columnMap)) {
			if (mapped === fieldValue) return col;
		}
		return undefined;
	}

	function autoColFor(fieldValue: string): string | undefined {
		if (!analysis) return undefined;
		for (const [col, mapped] of Object.entries(analysis.mapping) as [string, string | null][]) {
			if (mapped === fieldValue) return col;
		}
		return undefined;
	}

	function setFieldMapping(fieldValue: string, col: string) {
		for (const [c, f] of Object.entries(columnMap)) {
			if (f === fieldValue) delete columnMap[c];
		}
		if (col) columnMap[col] = fieldValue;
		columnMap = { ...columnMap };
	}

	function fieldStatus(fv: string): { label: string; cls: string } {
		const mapped = csvColFor(fv);
		const auto = autoColFor(fv);
		if (mapped && auto === mapped) return { label: 'auto-matched', cls: 'st-auto' };
		if (mapped) return { label: 'mapped', cls: 'st-mapped' };
		return { label: 'no data', cls: 'st-empty' };
	}

	function sampleFor(fieldValue: string): string {
		const col = csvColFor(fieldValue);
		if (col && analysis?.preview[col]) return analysis.preview[col];
		return '';
	}

	function isRequired(val: string): boolean {
		return fields.some(f => f.value === val && f.required);
	}
</script>

<div class="page-header">
	<h1>Import Tools</h1>
	<a href="/tools" class="btn-ghost btn-sm">Back</a>
</div>

{#if fieldsLoading}
	<div class="card"><div class="sk-form">
		<div class="sk-line sk" style="width:40%;height:24px"></div>
		<div class="sk-line sk" style="width:100%;height:100px;border-radius:8px"></div>
		<div class="sk-line sk" style="width:20%;height:36px;margin-top:12px;border-radius:6px"></div>
	</div></div>
{:else if result}
	<div class="card">
		<div class="card-header"><h2>Import Results</h2></div>
		<div class="result-grid">
			<div class="result-item">
				<span class="result-value">{result.total}</span>
				<span class="result-label">Total Rows</span>
			</div>
			<div class="result-item" style="color:var(--green)">
				<span class="result-value">{result.created}</span>
				<span class="result-label">Created</span>
			</div>
			<div class="result-item">
				<span class="result-value">0</span>
				<span class="result-label">Updated</span>
			</div>
			<div class="result-item" style="color:var(--red)">
				<span class="result-value">{result.errors.length}</span>
				<span class="result-label">Errors</span>
			</div>
		</div>

		{#if result.errors.length > 0}
			<div style="margin-top:16px">
				<h3 style="font-size:14px;margin-bottom:8px;color:var(--red)">Errors</h3>
				<div class="table-wrap">
					<table>
						<thead><tr><th>Row</th><th>Message</th></tr></thead>
						<tbody>
							{#each result.errors as err}
								<tr>
									<td>{err.row}</td>
									<td style="color:var(--red)">{err.message}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<a href="/tools" class="btn btn-primary" style="margin-top:16px">Back to Tools</a>
	</div>

{:else}
	<div class="card">
		<div class="card-header"><h2>1. Select File</h2></div>
		<div
			class="drop-zone"
			class:has-file={file !== null}
			ondragover={(e) => e.preventDefault()}
			ondrop={(e) => { e.preventDefault(); onFileDrop(e); }}
			role="button"
			tabindex="0"
			onclick={() => document.getElementById('file-input')?.click()}
			onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input')?.click(); }}
		>
			{#if file}
				<span class="file-name">{file.name}</span>
				<span class="file-size">{(file.size / 1024).toFixed(1)} KB</span>
			{:else}
				<span class="drop-hint">Drop or click to browse (.xlsx or .csv)</span>
			{/if}
		</div>
		<input id="file-input" type="file" accept=".xlsx,.csv" style="display:none" onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) file = f; }} />
		<button class="btn btn-primary" onclick={analyzeFile} disabled={!file || uploading} style="margin-top:12px">
			{uploading ? 'Analyzing...' : 'Analyze File'}
		</button>
	</div>

	{#if error}
		<div class="card" style="margin-top:10px;border-color:var(--red)">
			<p style="color:var(--red);font-size:13px">{error}</p>
		</div>
	{/if}

	{#if analysis}
		<div class="card" style="margin-top:10px">
			<div class="card-header">
				<h2>2. Column Mapping</h2>
				<span style="font-size:13px;color:var(--empty-text-primary)">
					{analysis.totalRows} rows &middot; {analysis.columns.length} columns found
				</span>
			</div>

			<div class="field-table-wrap">
				<table class="field-table">
					<thead>
						<tr>
							<th style="width:180px">Field</th>
							<th style="min-width:180px">From CSV Column</th>
							<th style="width:200px">Sample Value</th>
							<th style="width:120px">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each fields as f}
							{@const fv = f.value}
							{@const col = csvColFor(fv)}
							{@const auto = autoColFor(fv)}
							{@const status = fieldStatus(fv)}
							{@const preview = sampleFor(fv)}
							<tr class="tr-{status.cls}">
								<td>
									<span class="field-label">{f.label}</span>
									{#if f.required}<span class="req">required</span>{/if}
								</td>
								<td>
									<select
										value={col ?? ''}
										onchange={(e) => setFieldMapping(fv, (e.target as HTMLSelectElement).value)}
									>
										<option value="">— No data —</option>
										{#each analysis.columns as c}
											<option value={c}>{c}</option>
										{/each}
									</select>
								</td>
								<td class="sample" class:has-data={preview !== ''}>
									{preview || '—'}
								</td>
								<td><span class="badge {status.cls}">{status.label}</span></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="import-actions">
				<div>
					{#each fields as f}
						{@const col = csvColFor(f.value)}
						{#if f.required && !col}
							<span style="color:var(--empty-text-primary);font-size:13px">
								Required field <strong>{f.label}</strong> has no data source.
							</span>
						{/if}
					{/each}
				</div>
				<button class="btn btn-primary" onclick={executeImport} disabled={importing || !analysis}>
					{importing ? 'Importing...' : 'Import Tools'}
				</button>
			</div>
		</div>
	{/if}
{/if}

<style>
	.drop-zone {
		border: 2px dashed var(--border-color);
		border-radius: 8px;
		padding: 32px;
		text-align: center;
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.drop-zone:hover { border-color: var(--text-secondary); }
	.drop-zone.has-file { border-color: var(--green); }
	.file-name { display:block;font-size:14px;font-weight:500; }
	.file-size { display:block;font-size:12px;color:var(--text-secondary);margin-top:4px; }
	.drop-hint { color:var(--text-secondary);font-size:14px; }
	.result-grid { display:flex;gap:24px;margin-top:12px; }
	.result-item { display:flex;flex-direction:column;gap:2px; }
	.result-value { font-size:32px;font-weight:700; }
	.result-label { font-size:12px;color:var(--text-secondary); }

	/* Field table */
	.field-table-wrap {
		overflow-x: auto;
	}
	.field-table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		font-size: 13px;
	}
	.field-table th {
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--empty-text-primary);
		padding: 8px 6px;
		text-align: left;
		border-bottom: 1px solid var(--border-color);
	}
	.field-table td {
		padding: 8px 6px;
		border-bottom: 1px solid color-mix(in srgb, var(--border-color) 40%, transparent);
		vertical-align: middle;
	}
	.field-label {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 13px;
	}
	.req {
		font-size: 9px;
		font-weight: 500;
		color: var(--empty-text-primary);
		background: var(--bg-component);
		padding: 2px 6px;
		border-radius: 4px;
		margin-left: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.sample {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--empty-text-primary);
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sample.has-data {
		color: var(--text-primary);
	}

	/* Field status badges */
	.st-auto {
		background: color-mix(in srgb, var(--green) 15%, transparent);
		color: var(--green);
		border-color: color-mix(in srgb, var(--green) 25%, transparent);
	}
	.st-mapped {
		background: color-mix(in srgb, var(--blue) 15%, transparent);
		color: var(--blue);
		border-color: color-mix(in srgb, var(--blue) 25%, transparent);
	}
	.st-empty {
		background: color-mix(in srgb, var(--orange) 12%, transparent);
		color: var(--orange);
		border-color: color-mix(in srgb, var(--orange) 30%, transparent);
	}

	/* Row state tints */
	.tr-st-empty td {
		background: color-mix(in srgb, var(--orange) 4%, transparent);
	}

	/* Action area */
	.import-actions {
		margin-top: 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>
