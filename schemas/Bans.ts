import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema<{
	id: string;
	banned: boolean;
	ip: string;
}>({
	id: String,
	banned: Boolean,
	ip: String
});

const banModel: mongoose.Model<{ id: string; banned: boolean }> =
	mongoose.models['bans'] || mongoose.model('bans', UserSchema);

export default banModel;
