import mongoose from 'mongoose';
import { User, Note, Post } from '../../models.js';

/** Connects to MongoDB and waits for the application indexes to initialize. */
export async function connectDb(uri) {
  await mongoose.connect(uri);
  await Promise.all([User.init(), Note.init(), Post.init()]);
}

/** Releases the MongoDB connection. */
export async function disconnectDb() {
  await mongoose.disconnect();
}
