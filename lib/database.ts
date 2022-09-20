import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
	cached = global.mongoose = { connection: undefined, promise: undefined };
}

export const connect = async () => {
	if (cached.connection) {
		return cached.connection;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false
		};

		cached.promise = mongoose
			.connect(process.env.MONGODB_URI, opts)
			.then(mongoose => {
				return mongoose;
			});
	}
	cached.connection = await cached.promise;
	return cached.connection;
};
