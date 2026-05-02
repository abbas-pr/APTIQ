import mongoose from 'mongoose';

/**
 * MCQ: four options, correctAnswer is the index 0–3 in the options array.
 */
const questionSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    order: { type: Number, default: 0 },
    questionText: { type: String, required: true },
    options: {
      type: [String],
      validate: [(v) => Array.isArray(v) && v.length === 4, 'Exactly 4 options required'],
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  },
  { timestamps: true }
);

export default mongoose.model('Question', questionSchema);
