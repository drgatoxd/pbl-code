// This is an example of how to access a session from an API route
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';
import banModel from '../../../schemas/Bans';
import { DiscordUser } from '../auth/[...nextauth]';
import { connect } from '../../../lib/database';

export default async function Handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	await connect();

	const session = await getSession({ req });
	const banned = await banModel.findOne({
		id: (session?.['profile'] as DiscordUser).id
	});
	res.send(
		JSON.stringify(
			{
				...session,
				profile: {
					...(session?.['profile'] as DiscordUser),
					banned: banned?.banned
				}
			},
			null,
			2
		)
	);
}
