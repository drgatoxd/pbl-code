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
		case 'POST': {
			const session = await getSession({ req });
			const profile = session?.['profile'] as DiscordUser | undefined;

			if (!profile) {
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

			if (bot.state != 'approved') {
				return res.status(403).json({
					error: 'Bot is not approved yet',
					success: false,
					data: null
				});
			}

			const findVote = bot.votes.find(v => v.userId == profile.id);

			if (findVote && findVote.expires >= Date.now()) {
				return res.status(403).json({
					error: `Ya votaste. Espera ${Math.floor(
						(findVote.expires - Date.now()) / 1000 / 60 / 60
					)} horas para votar de nuevo.`,
					success: false,
					data: null
				});
			}

			bot.votes = bot.votes.filter(v => v.userId != profile.id);
			bot.votes.push({
				userId: profile.id,
				expires: Date.now() + 1000 * 60 * 60 * 12
			});
			await bot.save();

			await axios.post(process.env.WEBHOOK_URL, {
				allowed_mentions: {
					parse: ['users']
				},
				content: `<@${profile.id}> ha votado por <@${bot.id}>`
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
