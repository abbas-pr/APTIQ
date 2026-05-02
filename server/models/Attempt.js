import mongoose from 'mongoose';

/**
 * One row per quiz submission. For weekly contest, enforce one attempt per user per quiz in routes.
 * answers: map questionId -> selected option index (0–3).
 */
const attemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    score: { type: Number, required: true },
    /** Seconds from start to submit (client-reported; used for leaderboard tie-break). */
    timeTaken: { type: Number, required: true, min: 0 },
    answers: { type: Map, of: Number, default: {} },
    isWeeklyContestAttempt: { type: Boolean, default: false },
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, quizId: 1 }, { unique: false });

export default mongoose.model('Attempt', attemptSchema);
