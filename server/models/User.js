import mongoose from 'mongoose';

/**
 * Application users: regular users take quizzes; admins manage content.
 * Password is stored hashed (never plain text).
 */
const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: false },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
