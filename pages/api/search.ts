// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { staff, tags } from '../../config';
import { connect } from '../../lib/database';
import { replaceAccentMark } from '../../lib/functions';
import { DiscordUser } from './auth/[...nextauth]';
import BotsModel from '../../schemas/Bot';
import UsersModel from '../../schemas/User';

interface Data {
	error: string;
	results: {
		tags?: Array<{ name: string; href: string }>;
		bots?: Array<{ name: string; href: string; avatar: string }>;
		users?: Array<{ name: string; href: string; avatar: string }>;
		commands?: Array<{ name: string; href: string }>;
	};
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const session = await getSession({ req });
	const profile = session?.['profile'] as DiscordUser | undefined;

	const query = req.query.q;
	if (typeof query != 'string')
		return res.status(400).send({
			error: 'Query must be a string',
			results: {}
		});

	const filteredTags = tags.filter(tag =>
		replaceAccentMark(tag.toLowerCase()).includes(
			replaceAccentMark(query.toLowerCase())
		)
	);

	await connect();

	const users = await UsersModel.find();
	const filteredUsers: Array<{ name: string; href: string; avatar: string }> =
		users
			.filter(user =>
				replaceAccentMark(
					`@${user.username}#${user.discriminator}`.toLowerCase()
				).includes(replaceAccentMark(query.toLowerCase()))
			)
			.slice(0, 5)
			.map(user => ({
				name: `@${user.username}#${user.discriminator}`,
				href: `/u/${user.id}`,
				avatar: user.avatar.startsWith('https://cdn.discordapp.com')
					? user.avatar
					: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${
							user.avatar.startsWith('a_') ? 'gif' : 'png'
					  }?size=2048`
			}));

	const filteredCommands: Array<{ name: string; href: string }> = [
		{ name: 'Agregar Bot', href: '/new' }
	].filter(
		cmd =>
			replaceAccentMark(cmd.name.toLowerCase()).includes(
				replaceAccentMark(query.toLowerCase())
			) && !!profile
	);

	if (staff.includes(profile?.id || '')) {
		filteredCommands.push({
			name: 'Administrador',
			href: '/admin'
		});
	}

	const bots = await BotsModel.find();
	const filteredBots = bots
		.filter(
			bot =>
				(replaceAccentMark(bot.tag.toLowerCase()).includes(
					replaceAccentMark(query.toLowerCase())
				) ||
					bot.id == query ||
					bot.tags.some(tag =>
						replaceAccentMark(tag.toLowerCase()).includes(
							replaceAccentMark(query.toLowerCase())
						)
					)) &&
				(bot.state == 'approved' || profile?.id == bot.ownerId)
		)
		.map(bot => ({
			name: bot.tag,
			href: `/bots/${bot.id}`,
			avatar: bot.avatarURL,
			votes: bot.votes.length
		}));

	res.status(200).send({
		error: '',
		results: {
			tags: filteredTags.map(tag => ({
				name: tag,
				href: `/tag/${tag}`
			})),
			bots: filteredBots,
			users: filteredUsers,
			commands: filteredCommands
		}
	});
}
