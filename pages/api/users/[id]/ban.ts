import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { DiscordUser } from '../../auth/[...nextauth]';
import BansModel from '../../../../schemas/Bans';
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
	await connect();

	switch (method) {
		case 'PUT': {
			const session = await getSession({ req });
			const profile = session?.['profile'] as DiscordUser | undefined;

			if (!profile?.id || !staff.includes(profile.id)) {
				return res.status(403).json({
					error: 'You are not authorized to perform this action',
					success: false,
					data: null
				});
			}

			const ban = (await BansModel.findOne({ id })) ?? new BansModel({ id });

			if (ban.banned) {
				return res.status(400).json({
					error: 'El usuario ya está baneado',
					success: true,
					data: null
				});
			} else {
				ban.banned = true;
			}

			await ban.save();

			await axios.put(
				`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/bans/${id}`,
				{
					reason: `Baneado por ${profile.username}#${profile.discriminator} en la web.`
				},
				{
					headers: {
						Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
						'User-Agent': 'DiscordBot (discord.js, v14.0.0)'
					}
				}
			);

			return res.status(200).json({
				error: null,
				success: true,
				data: null
			});
		}

		case 'DELETE': {
			const session = await getSession({ req });
			const profile = session?.['profile'] as DiscordUser | undefined;

			if (!profile?.id || !staff.includes(profile.id)) {
				return res.status(403).json({
					error: 'You are not authorized to perform this action',
					success: false,
					data: null
				});
			}

			const ban = await BansModel.findOne({ id });

			if (!ban?.banned) {
				return res.status(400).json({
					error: 'El usuario no está baneado',
					success: true,
					data: null
				});
			} else {
				await ban.deleteOne();
			}

			await axios.delete(
				`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/bans/${id}`,
				{
					headers: {
						Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
						'User-Agent': 'DiscordBot (discord.js, v14.0.0)'
					}
				}
			);

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
