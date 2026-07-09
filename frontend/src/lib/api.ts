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
};

// Locations
export const locations = {
	list: () => request<any[]>('/locations'),
	create: (data: { name: string }) => request<any>('/locations', { method: 'POST', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/locations/${id}`, { method: 'DELETE' }),
};

// Item Categories
export const itemCategories = {
	list: () => request<any[]>('/item-categories'),
	create: (data: { name: string }) => request<any>('/item-categories', { method: 'POST', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/item-categories/${id}`, { method: 'DELETE' }),
	subCategories: {
		list: (catId: number) => request<any[]>(`/item-categories/${catId}/sub-categories`),
		create: (catId: number, data: { name: string }) =>
			request<any>(`/item-categories/${catId}/sub-categories`, { method: 'POST', body: JSON.stringify(data) }),
		remove: (subId: number) => request<void>(`/item-categories/sub-categories/${subId}`, { method: 'DELETE' }),
	},
};

// Tool Categories
export const toolCategories = {
	list: () => request<any[]>('/tool-categories'),
	create: (data: { name: string }) => request<any>('/tool-categories', { method: 'POST', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/tool-categories/${id}`, { method: 'DELETE' }),
};

// Items
export const items = {
	list: () => request<any[]>('/items'),
	get: (id: number) => request<any>(`/items/${id}`),
	create: (data: any) => request<any>('/items', { method: 'POST', body: JSON.stringify(data) }),
	update: (id: number, data: any) => request<any>(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/items/${id}`, { method: 'DELETE' }),
	transactions: {
		list: (itemId: number) => request<any[]>(`/items/${itemId}/transactions`),
		create: (itemId: number, data: any) =>
			request<any>(`/items/${itemId}/transactions`, { method: 'POST', body: JSON.stringify(data) }),
	},
};

// Tools
export const tools = {
	list: () => request<any[]>('/tools'),
	get: (id: number) => request<any>(`/tools/${id}`),
	create: (data: any) => request<any>('/tools', { method: 'POST', body: JSON.stringify(data) }),
	batchCreate: (data: any) => request<any[]>('/tools/batch', { method: 'POST', body: JSON.stringify(data) }),
	update: (id: number, data: any) => request<any>(`/tools/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	remove: (id: number) => request<void>(`/tools/${id}`, { method: 'DELETE' }),
	checkout: (id: number, data: any) =>
		request<any>(`/tools/${id}/checkout`, { method: 'POST', body: JSON.stringify(data) }),
	checkin: (id: number, data?: any) =>
		request<any>(`/tools/${id}/checkin`, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
	checkouts: {
		list: (toolId: number) => request<any[]>(`/tools/${toolId}/checkouts`),
	},
	maintenance: {
		list: (toolId: number) => request<any[]>(`/tools/${toolId}/maintenance`),
		create: (toolId: number, data: any) =>
			request<any>(`/tools/${toolId}/maintenance`, { method: 'POST', body: JSON.stringify(data) }),
	},
};
