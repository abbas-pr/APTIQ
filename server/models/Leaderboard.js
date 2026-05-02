import mongoose from 'mongoose';

/**
 * Best row per user for the active weekly contest quiz (updated on submit).
 * Sorted by score desc, then timeTaken asc.
 */
const leaderboardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    score: { type: Number, required: true },
    timeTaken: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

leaderboardSchema.index({ quizId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Leaderboard', leaderboardSchema);
