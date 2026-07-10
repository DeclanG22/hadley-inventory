export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

let nextId = 1;
let toasts = $state<Toast[]>([]);
let leavingIds = $state<Set<number>>(new Set());

export function addToast(message: string, type: ToastType = 'info') {
	const id = nextId++;
	toasts = [...toasts, { id, message, type }];
	setTimeout(() => {
		leavingIds = new Set([...leavingIds, id]);
		setTimeout(() => {
			toasts = toasts.filter(t => t.id !== id);
			leavingIds = new Set([...leavingIds].filter(x => x !== id));
		}, 300);
	}, 3200);
}

export function getToasts() {
	return toasts;
}

export function isLeaving(id: number) {
	return leavingIds.has(id);
}
