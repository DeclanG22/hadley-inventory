const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		...options,
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`${res.status} ${res.statusText}: ${text}`);
	}
	if (res.status === 204) return undefined as T;
	return res.json();
}

// Activity
export const activity = {
	recent: (limit = 20) => request<any[]>(`/activity/recent?limit=${limit}`),
};

// Vendors
export const vendors = {
	list: () => request<any[]>('/vendors'),
	create: (data: { name: string }) => request<any>('/vendors', { method: 'POST', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/vendors/${id}`, { method: 'DELETE' }),
	deleted: () => request<any[]>('/vendors/deleted'),
	restore: (id: number) => request<any>(`/vendors/${id}/restore`, { method: 'POST' }),
	permanentRemove: (id: number) => request<void>(`/vendors/${id}/permanent`, { method: 'DELETE' }),
};

// Locations
export const locations = {
	list: () => request<any[]>('/locations'),
	create: (data: { name: string }) => request<any>('/locations', { method: 'POST', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/locations/${id}`, { method: 'DELETE' }),
	deleted: () => request<any[]>('/locations/deleted'),
	restore: (id: number) => request<any>(`/locations/${id}/restore`, { method: 'POST' }),
	permanentRemove: (id: number) => request<void>(`/locations/${id}/permanent`, { method: 'DELETE' }),
};

// Item Categories
export const itemCategories = {
	list: () => request<any[]>('/item-categories'),
	create: (data: { name: string }) => request<any>('/item-categories', { method: 'POST', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/item-categories/${id}`, { method: 'DELETE' }),
	restore: (id: number) => request<any>(`/item-categories/${id}/restore`, { method: 'POST' }),
	permanentRemove: (id: number) => request<void>(`/item-categories/${id}/permanent`, { method: 'DELETE' }),
	deleted: () => request<any[]>('/item-categories/deleted'),
	subCategories: {
		list: (catId: number) => request<any[]>(`/item-categories/${catId}/sub-categories`),
		create: (catId: number, data: { name: string }) =>
			request<any>(`/item-categories/${catId}/sub-categories`, { method: 'POST', body: JSON.stringify(data) }),
		remove: (subId: number) => request<void>(`/item-categories/sub-categories/${subId}`, { method: 'DELETE' }),
		deleted: () => request<any[]>('/item-categories/sub-categories/deleted'),
		restore: (subId: number) => request<any>(`/item-categories/sub-categories/${subId}/restore`, { method: 'POST' }),
		permanentRemove: (subId: number) => request<void>(`/item-categories/sub-categories/${subId}/permanent`, { method: 'DELETE' }),
	},
};

// Stock Takes
export const stockTakes = {
	list: () => request<any[]>('/stock-takes'),
	get: (id: number) => request<any>(`/stock-takes/${id}`),
	create: (data: { date: string; notes?: string }) =>
		request<any>('/stock-takes', { method: 'POST', body: JSON.stringify(data) }),
	update: (id: number, data: any) =>
		request<any>(`/stock-takes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/stock-takes/${id}`, { method: 'DELETE' }),
	updateItem: (stockTakeId: number, itemId: number, data: { physicalQty: number; notes?: string }) =>
		request<any>(`/stock-takes/${stockTakeId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
	reconcile: (id: number) => request<any>(`/stock-takes/${id}/reconcile`, { method: 'POST' }),
};

// Tool Categories
export const toolCategories = {
	list: () => request<any[]>('/tool-categories'),
	create: (data: { name: string }) => request<any>('/tool-categories', { method: 'POST', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/tool-categories/${id}`, { method: 'DELETE' }),
	deleted: () => request<any[]>('/tool-categories/deleted'),
	restore: (id: number) => request<any>(`/tool-categories/${id}/restore`, { method: 'POST' }),
	permanentRemove: (id: number) => request<void>(`/tool-categories/${id}/permanent`, { method: 'DELETE' }),
};

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}

// Items
export const lookup = {
	byCode: (code: string) => request<{ type: 'item' | 'tool'; data: any }>(`/lookup/${encodeURIComponent(code)}`),
};
export const items = {
	list: (q?: string, filters?: { categoryId?: number; vendorId?: number; locationId?: number; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (filters?.categoryId) params.set('categoryId', String(filters.categoryId));
		if (filters?.vendorId) params.set('vendorId', String(filters.vendorId));
		if (filters?.locationId) params.set('locationId', String(filters.locationId));
		if (filters?.page) params.set('page', String(filters.page));
		if (filters?.limit) params.set('limit', String(filters.limit));
		if (filters?.sortBy) params.set('sortBy', filters.sortBy);
		if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);
		const qs = params.toString();
		return request<PaginatedResult<any>>(`/items${qs ? `?${qs}` : ''}`);
	},
	lowStock: () => request<any[]>('/items/low-stock'),
	get: (id: number) => request<any>(`/items/${id}`),
	create: (data: any) => request<any>('/items', { method: 'POST', body: JSON.stringify(data) }),
	update: (id: number, data: any) => request<any>(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/items/${id}`, { method: 'DELETE' }),
	restore: (id: number) => request<any>(`/items/${id}/restore`, { method: 'POST' }),
	permanentRemove: (id: number) => request<void>(`/items/${id}/permanent`, { method: 'DELETE' }),
	deleted: () => request<any[]>('/items/deleted'),
	transactions: {
		all: (filters?: { dateFrom?: string; dateTo?: string; jobNumber?: string }) => {
			const params = new URLSearchParams();
			if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
			if (filters?.dateTo) params.set('dateTo', filters.dateTo);
			if (filters?.jobNumber) params.set('jobNumber', filters.jobNumber);
			const qs = params.toString();
			return request<any[]>(`/items/transactions${qs ? `?${qs}` : ''}`);
		},
		list: (itemId: number) => request<any[]>(`/items/${itemId}/transactions`),
		create: (itemId: number, data: any) =>
			request<any>(`/items/${itemId}/transactions`, { method: 'POST', body: JSON.stringify(data) }),
		remove: (transactionId: number) =>
			request<void>(`/items/transactions/${transactionId}`, { method: 'DELETE' }),
	},
};

export const upload = {
	image: async (file: File): Promise<string> => {
		const form = new FormData();
		form.set('file', file);
		const res = await fetch('/api/upload', { method: 'POST', body: form });
		if (!res.ok) throw new Error(await res.text());
		const data = await res.json();
		return data.url;
	},
};

export const tools = {
	list: (q?: string) => request<any[]>(`/tools${q ? `?q=${encodeURIComponent(q)}` : ''}`),
	get: (id: number) => request<any>(`/tools/${id}`),
	create: (data: any) => request<any>('/tools', { method: 'POST', body: JSON.stringify(data) }),
	batchCreate: (data: any) => request<any[]>('/tools/batch', { method: 'POST', body: JSON.stringify(data) }),
	update: (id: number, data: any) => request<any>(`/tools/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/tools/${id}`, { method: 'DELETE' }),
	restore: (id: number) => request<any>(`/tools/${id}/restore`, { method: 'POST' }),
	permanentRemove: (id: number) => request<void>(`/tools/${id}/permanent`, { method: 'DELETE' }),
	deleted: () => request<any[]>('/tools/deleted'),
	checkout: (id: number, data: any) =>
		request<any>(`/tools/${id}/checkout`, { method: 'POST', body: JSON.stringify(data) }),
	checkin: (id: number, data?: any) =>
		request<any>(`/tools/${id}/checkin`, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
	checkouts: {
		list: (toolId: number) => request<any[]>(`/tools/${toolId}/checkouts`),
		remove: (checkoutId: number) =>
			request<void>(`/tools/checkouts/${checkoutId}`, { method: 'DELETE' }),
	},
	costing: (filters?: { dateFrom?: string; dateTo?: string }) => {
		const params = new URLSearchParams();
		if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
		if (filters?.dateTo) params.set('dateTo', filters.dateTo);
		const qs = params.toString();
		return request<any[]>(`/tools/costing${qs ? `?${qs}` : ''}`);
	},
	maintenance: {
		list: (toolId: number) => request<any[]>(`/tools/${toolId}/maintenance`),
		create: (toolId: number, data: any) =>
			request<any>(`/tools/${toolId}/maintenance`, { method: 'POST', body: JSON.stringify(data) }),
		remove: (maintenanceId: number) =>
			request<void>(`/tools/maintenance/${maintenanceId}`, { method: 'DELETE' }),
	},
};
