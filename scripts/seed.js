import mongoose from 'mongoose';
import { User } from '../src/modules/users/users.model.js';
import { hashPassword } from '../src/modules/auth/password.js';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !password ||
    password.length < 8 ||
    password.length > 256
  ) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (8 to 256 characters)');
  }
  await mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_notes',
  );
  await User.init();
  await User.create({
    email,
    passwordHash: await hashPassword(password),
    role: 'admin',
  });
  console.log('Admin created');
}

createAdmin()
  .catch((error) => {
    console.error(
      error.code === 11000 ? 'That email already exists' : error.message,
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
