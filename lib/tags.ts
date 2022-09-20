import { tags } from '../config';

export function getAllTagIds() {
	return tags.map(tag => ({
		params: {
			id: tag,
			fallback: true
		}
	}));
}
