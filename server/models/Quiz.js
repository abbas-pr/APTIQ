import mongoose from 'mongoose';

/**
 * A quiz container: metadata + link to questions.
 * isWeeklyContest: shown in Weekly Contest when settings allow it.
 * timeLimitMinutes: enforced on the client timer; server validates submission window loosely.
 */
const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    /** Duration shown to the user; 0 means no timer. */
    timeLimitMinutes: { type: Number, default: 15, min: 0 },
    isWeeklyContest: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
