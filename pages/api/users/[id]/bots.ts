import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../../lib/database';
import BotsModel, { BotApplication } from '../../../../schemas/Bot';
import { DiscordUser } from '../../auth/[...nextauth]';
import UserModel from '../../../../schemas/User';
import { getSession } from 'next-auth/react';
import { staff } from '../../../../config';

interface Data {
	error: string | null;
	success: boolean;
	data: Array<BotApplication & { url: string }> | null;
}

export default async function Handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const { method } = req;

	if (method !== 'GET') {
		return res.status(405).json({
			error: 'Method not allowed',
			success: false,
			data: null
		});
	}

	await connect();
	const user = await UserModel.findOne({ id: req.query.id });
	const session = await getSession({ req });
	const profile = session?.['profile'] as DiscordUser | undefined;

	if (!user) {
		return res.status(404).json({
			error: 'User not found',
			success: false,
			data: null
		});
	}

	const bots = await BotsModel.find({
		ownerId: user.id,
		...(profile && (profile.id == user.id || staff.includes(profile.id))
			? {}
			: { state: 'approved' })
	});

	const coOwnerBots = await BotsModel.find({
		coOwners: { $in: [{ id: user.id }] },
		...(!profile || profile.id == user.id || staff.includes(profile.id)
			? {}
			: { state: 'approved' })
	});

	return res.status(200).json({
		error: null,
		success: true,
		data: coOwnerBots.concat(bots)
	});
}
