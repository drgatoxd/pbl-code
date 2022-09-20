import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { DiscordUser } from '../../auth/[...nextauth]';
import BotsModel from '../../../../schemas/Bot';
import { staff } from '../../../../config';
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
			if (!staff.includes((session?.['profile'] as DiscordUser)?.id || '')) {
				return res.status(403).json({
					error: 'You are not authorized to perform this action',
					success: false,
					data: null
				});
			}

			const {
				body: { action, reason }
			}: { body: { action: 'approve' | 'deny'; reason: string } } = req;

			await connect();
			const bot = await BotsModel.findOne({ id });

			if (!bot) {
				return res.status(404).json({
					error: 'Bot not found',
					success: false,
					data: null
				});
			}

			await axios
				.post(process.env.WEBHOOK_URL, {
					allowed_mentions: {
						parse: ['users']
					},
					content: `<@${bot.ownerId}> Bot ${
						action == 'approve' ? 'aprobado' : 'denegado'
					}`,
					embeds: [
						{
							color: action == 'approve' ? 0x00ff00 : 0xff0000,
							author: {
								name: bot.tag,
								icon_url: bot.avatarURL
							},
							fields: [
								{
									name: 'Moderador',
									value: `<@${(session?.['profile'] as DiscordUser)?.id}>`
								}
							],
							description: reason,
							title: 'Razón'
						}
					]
				})
				.then(async () => {
					bot.state = action === 'approve' ? 'approved' : 'rejected';
					await bot.save();

					return res.status(200).json({
						error: null,
						success: true,
						data: null
					});
				})
				.catch(err => {
					console.log(err);

					return res.status(500).json({
						error: err?.response?.data?.message || err?.message,
						success: false,
						data: null
					});
				});
			return;
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
