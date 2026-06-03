import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.util.js';

export const connectDB = async () => {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('MongoDB connected');
};
