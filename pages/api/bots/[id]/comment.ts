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

			const {
				body: { comment, stars }
			}: { body: { comment: string; stars: number } } = req;

			await connect();
			const bot = await BotsModel.findOne({ id });

			if (!bot) {
				return res.status(404).json({
					error: 'Bot not found',
					success: false,
					data: null
				});
			}

			bot.comments.push({
				content: comment,
				stars,
				userId: profile.id,
				avatar: profile.avatar,
				tag: `${profile.username}#${profile.discriminator}`,
				timestamp: Date.now()
			});
			await bot.save();

			await axios.post(process.env.WEBHOOK_URL, {
				allowed_mentions: {
					parse: ['users']
				},
				content: `<@${bot.id}> Nuevo comentario`,
				embeds: [
					{
						color: 0x5e5eff,
						author: {
							name: bot.tag,
							icon_url: bot.avatarURL
						},
						description: comment,
						fields: [
							{
								name: 'Usuario',
								value: `<@${profile.id}>`
							},
							{
								name: 'Estrellas',
								value: `${stars} estrellas`
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
