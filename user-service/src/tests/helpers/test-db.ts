import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
import { UserModel } from '../../models/user-model';
import { connectDB } from '../../config/db';

loadEnv({ path: '.env.test' });

const TEST_DB_URI = process.env.MONGO_URI ?? '';
const TEST_DB_NAME = process.env.MONGO_DB_NAME ?? 'peerprep_test';

export async function connectTestDB() {
    await connectDB(TEST_DB_URI, TEST_DB_NAME);
}

export async function clearTestDB() {
    await UserModel.deleteMany({});
}

export async function disconnectTestDB() {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
}
