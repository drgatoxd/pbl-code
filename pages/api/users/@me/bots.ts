// This is an example of how to access a session from an API route
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../../lib/database';
import BotsModel, { BotApplication } from '../../../../schemas/Bot';
import { DiscordUser } from '../../auth/[...nextauth]';

interface Data {
	error: string | null;
	success: boolean;
	data: Array<BotApplication & { url: string }> | null;
}

export default async function Handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const session = await getSession({ req });
	if (!session) {
		return res.status(403).json({
			error: 'You are not authorized to perform this action',
			success: false,
			data: null
		});
	}

	await connect();

	const bots = await BotsModel.find({
		ownerId: (session['profile'] as DiscordUser).id
	});

	const coOwnerBots = await BotsModel.find({
		'coOwners.id': (session['profile'] as DiscordUser).id
	});

	return res.status(200).json({
		error: null,
		success: true,
		data: coOwnerBots.concat(bots)
	});
}
