import { tags } from '../../../config';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function Handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { method } = req;

	switch (method) {
		case 'GET': {
			return res.status(200).json({
				success: true,
				error: '',
				data: tags[~~(Math.random() * tags.length)]
			});
		}

		default:
			return res.status(405).json({
				success: false,
				error: 'Method not allowed',
				data: {}
			});
	}
}
