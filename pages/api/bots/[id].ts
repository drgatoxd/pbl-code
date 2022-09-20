import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { connect } from '../../../lib/database';
import BotsModel, { BotApplication } from '../../../schemas/Bot';
import { DiscordUser } from '../auth/[...nextauth]';

export default async function Handler(
	req: NextApiRequest,
	res: NextApiResponse<{
		error?: string | null;
		success: boolean;
		data: BotApplication | null;
	}>
) {
	const { method } = req;
	const session = await getSession({ req });
	const profile = session?.['profile'] as DiscordUser | undefined;

	switch (method) {
		case 'GET': {
			const { id } = req.query;
			await connect();

			const bot = await BotsModel.findOne({ id });

			if (bot && bot.votes.some(v => v.expires >= Date.now())) {
				bot.votes = bot.votes.filter(v => v.expires >= Date.now());
				await bot.save();
			}

			if (bot && (bot.state == 'approved' || bot.ownerId == profile?.id)) {
				return res.status(200).json({
					success: true,
					data: bot
				});
			} else {
				return res.status(404).json({
					success: false,
					data: null
				});
			}
		}

		case 'DELETE': {
			const { id } = req.query;
			await connect();
			const bot = await BotsModel.findOne({ id });
			if (!bot) {
				return res.status(404).json({
					error: 'Bot not found',
					success: false,
					data: null
				});
			}
			if (bot.ownerId != profile?.id) {
				return res.status(403).json({
					error: 'You are not authorized to perform this action',
					success: false,
					data: null
				});
			}

			await bot.deleteOne();

			await axios.post(process.env.WEBHOOK_URL, {
				allowed_mentions: {
					parse: ['users']
				},
				content: `<@${bot.ownerId}> Bot eliminado`,
				embeds: [
					{
						color: 0x222222,
						author: {
							name: `${bot.tag} ha sido eliminado`,
							icon_url: bot.avatarURL
						}
					}
				]
			});

			return res.status(200).json({
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
