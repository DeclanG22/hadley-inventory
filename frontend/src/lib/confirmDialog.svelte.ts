export interface ConfirmState {
	open: boolean;
	title: string;
	message: string;
	confirmLabel: string;
	resolve: ((value: boolean) => void) | null;
}

let state = $state<ConfirmState>({
	open: false,
	title: '',
	message: '',
	confirmLabel: 'Delete',
	resolve: null,
});

export function confirm(title: string, message: string, confirmLabel = 'Delete'): Promise<boolean> {
	return new Promise((resolve) => {
		state = { open: true, title, message, confirmLabel, resolve };
	});
}

export function handleConfirm(value: boolean) {
	const r = state.resolve;
	state = { open: false, title: '', message: '', confirmLabel: 'Delete', resolve: null };
	if (r) r(value);
}

export function getConfirmState() {
	return state;
}
