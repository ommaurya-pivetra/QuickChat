import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
export const Connectdb = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI is not set. Create a `server/.env` file with a line like: MONGO_URI=mongodb://localhost:27017/whatsapp');
        return;
    }

    try {
        await mongoose.connect(uri);
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err);
        console.log('problem while connecting with database');
    }
};