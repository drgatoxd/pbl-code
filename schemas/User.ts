import mongoose from 'mongoose';
import { DiscordUser } from '../pages/api/auth/[...nextauth]';

const UserSchema = new mongoose.Schema<DiscordUser>({
	avatar: String,
	banner: String,
	accentColor: Number,
	bannerColor: Number,
	email: String,
	flags: Number,
	discriminator: String,
	locale: String,
	mfaEnabled: Boolean,
	verified: Boolean,
	username: String,
	id: String,
	premiumType: Number,
	publicFlags: Number,
	bots: [String],
	biography: String
});

const model = mongoose.models['user'] || mongoose.model('user', UserSchema);
export default model as mongoose.Model<DiscordUser>;
