import 'dotenv/config';
import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { connect } from '../../../lib/database';
import { staff } from '../../../config';
import UserModel from '../../../schemas/User';
import BanModel from '../../../schemas/Bans';

export interface DiscordUser {
	accentColor: number;
	avatar: string;
	banner?: string;
	bannerColor?: string;
	discriminator: string;
	email: string;
	flags: number;
	id: string;
	locale: string;
	mfaEnabled: boolean;
	premiumType: number;
	publicFlags: number;
	username: string;
	verified: boolean;
	bots: string[];
	biography: string;
	banned?: boolean;
}

export default NextAuth({
	callbacks: {
		async jwt({ token, user: raw_user, account }) {
			const user = raw_user as unknown as DiscordUser;

			if (user) {
				if (!user.avatar) {
					const defaultAvatarNumber = parseInt(user.discriminator) % 5;
					user.avatar = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
				} else {
					const format = user.avatar.startsWith('a_') ? 'gif' : 'png';
					user.avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${format}?size=4096`;
				}

				if (user.banner) {
					const format = user.banner.startsWith('a_') ? 'gif' : 'png';
					user.banner = `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${format}?size=4096`;
				}

				if (!user?.bots?.length) user.bots = [];

				token.profile = user;
				token.accessToken = account?.accessToken;
			}
			return token;
		},
		session({ session, token }) {
			session.profile = token.profile;
			return session;
		}
	},
	providers: [
		DiscordProvider({
			clientId: process.env.DISCORD_CLIENT_ID,
			clientSecret: process.env.DISCORD_CLIENT_SECRET,
			async profile(profile) {
				await connect();
				const ban = await BanModel.findOne({ id: profile.id });
				if (ban?.banned) {
					profile.banned = true;
				}

				if (!profile.avatar) {
					const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
					profile.avatar = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
				} else {
					const format = profile.avatar.startsWith('a_') ? 'gif' : 'png';
					profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
				}

				if (!profile?.bots?.length) profile.bots = [];
				profile.verified = staff.includes(profile.id);

				await UserModel.findOneAndUpdate({ id: profile.id }, profile, {
					upsert: true
				});

				return profile;
			}
		})
	]
});
