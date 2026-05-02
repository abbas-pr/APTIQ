/**
 * Creates an admin user if one with ADMIN_EMAIL does not exist.
 * Run: npm run seed (from server folder) after setting .env
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quiz-app';
const email = (process.env.ADMIN_EMAIL || 'admin@quizapp.local').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'Admin123!';
const name = process.env.ADMIN_NAME || 'Admin';

async function run() {
  await mongoose.connect(MONGO_URI);
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    await mongoose.disconnect();
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed, role: 'admin' });
  console.log('Admin created:', email);
  console.log('Use this password (change in production):', password);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
