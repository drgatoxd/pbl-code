// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { BotApplication } from '../../schemas/Bot';
import { getSession } from 'next-auth/react';
import { staff, tags } from '../../config';
import { connect } from '../../lib/database';
import BotsModel from '../../schemas/Bot';
import axios from 'axios';
import { DiscordUser } from './auth/[...nextauth]';

interface Data {
	error: string | null;
	success: boolean;
	data:
		| (BotApplication & { url: string })
		| Array<BotApplication & { url: string }>
		| null;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const { method } = req;
	const session = await getSession({ req });
	await connect();

	switch (method) {
		case 'POST': {
			if (!session) {
				return res.status(403).json({
					error: 'You are not authorized to perform this action',
					success: false,
					data: null
				});
			}

			const { body: bot }: { body: BotApplication } = req;

			if (!bot.id) {
				return res.status(400).send({
					error: 'Bot ID is required',
					success: false,
					data: null
				});
			}

			if (!bot.inviteURL) {
				return res.status(400).send({
					error: 'Invite URL is required',
					success: false,
					data: null
				});
			}

			if (!bot.username) {
				return res.status(400).send({
					error: 'Username is required',
					success: false,
					data: null
				});
			}

			if ((bot.shortDescription?.length || 0) < 25) {
				return res.status(400).send({
					error: 'Short description must be at least 25 characters',
					success: false,
					data: null
				});
			}

			if ((bot.longDescription?.length || 0) < 150) {
				return res.status(400).send({
					error: 'Long description must be at least 150 characters',
					success: false,
					data: null
				});
			}

			if (!(bot.tags || []).filter(x => tags.includes(x))?.length) {
				return res.status(400).send({
					error: 'You must specify at least one valid tag',
					success: false,
					data: null
				});
			}

			if (!bot.prefix || bot.prefix.length > 10) {
				return res.status(400).send({
					error: 'Specify a valid prefix (max 10 characters)',
					success: false,
					data: null
				});
			}

			bot.state = 'pending';

			const existingBot = await BotsModel.findOne({ id: bot.id });
			if (existingBot) {
				return res.status(400).send({
					error: 'Bot with this ID already exists',
					success: false,
					data: null
				});
			}

			const newBot = await BotsModel.create({ ...bot, createdAt: Date.now() });
			axios.post(process.env.WEBHOOK_URL, {
				allowed_mentions: {
					parse: ['roles']
				},
				content: `<@&${process.env.ADMIN_ROLEID}> Nuevo bot: \`${newBot.tag}\``,
				embeds: [
					{
						color: 0x5c4aff,
						author: {
							name: newBot.tag,
							icon_url: newBot.avatarURL,
							url: newBot.inviteURL
						},
						description: newBot.shortDescription,
						fields: [
							{
								name: 'Owners',
								value: [newBot.ownerId, ...newBot.coOwners.map(u => u.id)]
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
				data: { ...newBot, url: `/bots/${newBot.id}` }
			});
		}
		case 'GET': {
			const bots = await BotsModel.find(
				staff.includes((session?.['profile'] as DiscordUser)?.id)
					? {}
					: { state: 'approved' }
			).then(bots => {
				return bots.map(bot => {
					bot.votes = bot.votes.filter(v => v.expires > Date.now());
					return bot;
				});
			});

			return res.status(200).json({
				error: null,
				success: true,
				data: bots
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
