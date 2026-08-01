import mongoose from 'mongoose';
import { config } from '../config';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log(`[MongoDB] Connected successfully to ${config.mongodbUri}`);
  } catch (error) {
    console.warn(`[MongoDB] Connection error (running with memory/mock state if DB unavailable):`, error);
  }
}
