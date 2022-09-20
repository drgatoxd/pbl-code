// noinspection JSUnusedGlobalSymbols
import mongodb from 'mongoose';
export {};

declare global {
	// noinspection ES6ConvertVarToLetConst
	var mongoose: {
		connection?: typeof mongodb;
		promise?: Promise<typeof mongodb>;
	};
	namespace NodeJS {
		interface ProcessEnv {
			readonly ADMIN_ROLEID: string;
			readonly DISCORD_CLIENT_ID: string;
			readonly DISCORD_CLIENT_SECRET: string;
			readonly DISCORD_TOKEN: string;
			readonly GUILD_ID: string;
			readonly MONGODB_URI: string;
			readonly WEBHOOK_URL: string;
			readonly WEBHOOK_REPORT_URL: string;
		}
	}
}
