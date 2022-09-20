import { NextApiRequest, NextApiResponse } from 'next';
import { DiscordUser } from '../auth/[...nextauth]';
import UserModel from '../../../schemas/User';
import { connect } from '../../../lib/database';

export default async function Handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const {
		method,
		query: { id }
	}: { method?: string; query: { id?: string } } = req;

	switch (method) {
		case 'GET': {
			await connect();
			const user = await UserModel.findOne({ id });
			if (!user) {
				return res.status(404).json({
					error: 'User not found',
					success: false,
					data: null
				});
			}

			return res.status(200).json({
				error: null,
				success: true,
				data: JSON.parse(JSON.stringify(user))
			});
		}

		default: {
			return res.status(405).json({
				error: 'Method not allowed',
				success: false,
				data: null
			});
		}
	}
}
