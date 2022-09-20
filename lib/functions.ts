export function UpperCase(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function replaceAccentMark(str: string) {
	return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
