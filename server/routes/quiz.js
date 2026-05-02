import express from 'express';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import { authenticate } from '../middleware/auth.js';
import { getOrCreateSettings } from '../utils/settingsHelper.js';

const router = express.Router();

/** Strip correct answers for client-safe question payload. */
function sanitizeQuestions(questions) {
  return questions.map((q) => ({
    _id: q._id,
    order: q.order,
    questionText: q.questionText,
    options: q.options,
  }));
}

/**
 * List quizzes for users: published only; weekly quiz only if enabled in settings.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const filter = { isPublished: true };
    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 }).lean();

    const list = quizzes.filter((q) => {
      if (!q.isWeeklyContest) return true;
      if (!settings.weeklyContestEnabled) return false;
      if (!settings.currentWeeklyQuizId) return false;
      return q._id.toString() === settings.currentWeeklyQuizId.toString();
    });

    const withCounts = await Promise.all(
      list.map(async (q) => {
        const count = await Question.countDocuments({ quizId: q._id });
        return { ...q, questionCount: count };
      })
    );

    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to list quizzes' });
  }
});

/**
 * Get one quiz with questions (no correct answers) for taking the quiz.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const quiz = await Quiz.findById(req.params.id).lean();
    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    if (quiz.isWeeklyContest) {
      if (!settings.weeklyContestEnabled) {
        return res.status(403).json({ message: 'Weekly contest is currently disabled' });
      }
      if (!settings.currentWeeklyQuizId || quiz._id.toString() !== settings.currentWeeklyQuizId.toString()) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
    }

    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1, _id: 1 }).lean();
    res.json({
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        timeLimitMinutes: quiz.timeLimitMinutes,
        isWeeklyContest: quiz.isWeeklyContest,
      },
      questions: sanitizeQuestions(questions),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load quiz' });
  }
});

export default router;
