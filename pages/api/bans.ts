// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { staff } from '../../config';
import { connect } from '../../lib/database';
import BansModel from '../../schemas/Bans';
import axios from 'axios';
import { DiscordUser } from './auth/[...nextauth]';

interface Data {
	error: string | null;
	success: boolean;
	data: Array<Ban> | null;
}

export interface Ban {
	username: string;
	discriminator: string;
	avatar: string;
	id: string;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const { method } = req;
	const session = await getSession({ req });
	const profile = session?.['profile'] as DiscordUser | undefined;

	if (!profile || !staff.includes(profile.id))
		return res.status(403).send({
			error: 'You are not authorized to access this page.',
			success: false,
			data: null
		});

	await connect();
	switch (method) {
		case 'GET': {
			const bans = await Promise.all(
				await BansModel.find().then(docs => {
					return docs.map(async doc => {
						const user = await axios
							.get(`https://japi.rest/discord/v1/user/${doc.id}`)
							.catch(() => null);

						if (!user) return undefined;
						return {
							username: user.data.data.username as string,
							discriminator: user.data.data.discriminator as string,
							avatar: user.data.data.avatarURL as string,
							id: doc.id as string
						};
					});
				})
			);

			return res.status(200).json({
				error: null,
				success: true,
				data: bans.filter(ban => ban !== undefined) as Ban[]
			});
		}
	}
}
