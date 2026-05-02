import mongoose from 'mongoose';

/**
 * Singleton-style app settings: master switch for weekly contest UI/API.
 * currentWeeklyQuizId points at the quiz used for leaderboard (admin sets).
 */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    weeklyContestEnabled: { type: Boolean, default: true },
    currentWeeklyQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
