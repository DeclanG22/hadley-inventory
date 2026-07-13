export interface ConfirmState {
	open: boolean;
	title: string;
	message: string;
	resolve: ((value: boolean) => void) | null;
}

let state = $state<ConfirmState>({
	open: false,
	title: '',
	message: '',
	resolve: null,
});

export function confirm(title: string, message: string): Promise<boolean> {
	return new Promise((resolve) => {
		state = { open: true, title, message, resolve };
	});
}

export function handleConfirm(value: boolean) {
	const r = state.resolve;
	state = { open: false, title: '', message: '', resolve: null };
	if (r) r(value);
}

export function getConfirmState() {
	return state;
}
