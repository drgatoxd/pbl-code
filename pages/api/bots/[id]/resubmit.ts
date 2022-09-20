import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { DiscordUser } from '../../auth/[...nextauth]';
import BotsModel from '../../../../schemas/Bot';
import { connect } from '../../../../lib/database';
import axios from 'axios';

export default async function Handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const {
		method,
		query: { id }
	}: { method?: string; query: { id?: string } } = req;

	switch (method) {
		case 'PATCH': {
			const session = await getSession({ req });
			const profile = session?.['profile'] as DiscordUser | undefined;

			if (!profile?.id) {
				return res.status(403).json({
					error: 'You are not authorized to perform this action',
					success: false,
					data: null
				});
			}

			await connect();
			const bot = await BotsModel.findOne({ id });

			if (!bot) {
				return res.status(404).json({
					error: 'Bot not found',
					success: false,
					data: null
				});
			}

			if (bot.ownerId != profile.id) {
				return res.status(403).json({
					error: 'You are not authorized to perform this action',
					success: false,
					data: null
				});
			}

			bot.state = 'pending';
			await bot.save();

			await axios.post(process.env.WEBHOOK_URL, {
				allowed_mentions: {
					parse: ['users']
				},
				content: `<@&${process.env.ADMIN_ROLEID}> Bot re-enviado para aprobación`,
				embeds: [
					{
						color: 0x5c4aff,
						author: {
							name: bot.tag,
							icon_url: bot.avatarURL,
							url: bot.inviteURL
						},
						description: bot.shortDescription,
						fields: [
							{
								name: 'Owners',
								value: [bot.ownerId, ...bot.coOwners.map(u => u.id)]
									.map(o => `<@${o}> (${o})`)
									.join('\n')
							}
						]
					}
				]
			});

			return res.status(200).json({
				error: null,
				success: true,
				data: null
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
