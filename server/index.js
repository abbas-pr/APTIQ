import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import attemptRoutes from './routes/attempt.js';
import leaderboardRoutes from './routes/leaderboard.js';
import adminRoutes from './routes/admin.js';

const app = express();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientUrl,
    credentials: true
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.json({
    ok: true,
    mongoConnected: ready,
    /** Matches the DB name in your MONGO_URI (check this in Compass). */
    database: ready ? mongoose.connection.name : null,
    /** Mongoose collection names for User / Attempt models. */
    collectionsHint: { users: 'users', attempts: 'attempts' },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quiz-app';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('MongoDB connection failed:', e.message);
    process.exit(1);
  });
