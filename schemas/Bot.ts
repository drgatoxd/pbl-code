import mongoose from 'mongoose';

export interface BotApplication {
	id: string;
	username: string;
	discriminator: string;
	tag: string;
	avatarURL: string;
	guildCount: number;
	shortDescription: string;
	longDescription: string;
	ownerId: string;
	coOwners: Array<{ id: string; tag: string; avatarURL: string }>;
	verified: boolean;
	tags: string[];
	inviteURL: string;
	supportServer?: string;
	websiteURL?: string;
	githubURL?: string;
	youTubeURL?: string;
	tikTokURL?: string;
	votes: Array<{ userId: string; expires: number }>;
	comments: Array<{
		avatar: string;
		tag: string;
		userId: string;
		content: string;
		stars: number;
		timestamp: number;
	}>;
	presence?: 'online' | 'idle' | 'dnd' | 'offline';
	prefix: string;
	state: 'pending' | 'approved' | 'rejected';
	url: string;
	createdAt: number;
}

const BotSchema = new mongoose.Schema<BotApplication>({
	id: String,
	username: String,
	discriminator: String,
	tag: String,
	avatarURL: String,
	guildCount: Number,
	shortDescription: String,
	longDescription: String,
	ownerId: String,
	coOwners: [{ id: String, tag: String, avatarURL: String }],
	verified: Boolean,
	tags: [String],
	inviteURL: String,
	supportServer: String,
	websiteURL: String,
	githubURL: String,
	youTubeURL: String,
	tikTokURL: String,
	votes: [{ userId: String, expires: Number }],
	comments: [],
	prefix: String,
	state: String,
	url: String,
	createdAt: Number
});

const model = mongoose.models['bot'] || mongoose.model('bot', BotSchema);
export default model as mongoose.Model<BotApplication>;
