import express from 'express';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import Attempt from '../models/Attempt.js';
import Leaderboard from '../models/Leaderboard.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getOrCreateSettings } from '../utils/settingsHelper.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

/** Dashboard counts */
router.get('/stats', async (req, res) => {
  try {
    const [users, quizzes, attempts] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Quiz.countDocuments(),
      Attempt.countDocuments(),
    ]);
    res.json({ totalUsers: users, totalQuizzes: quizzes, totalAttempts: attempts });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load stats' });
  }
});

/** Weekly contest settings */
router.get('/settings', async (req, res) => {
  try {
    const s = await getOrCreateSettings();
    res.json({
      weeklyContestEnabled: s.weeklyContestEnabled,
      currentWeeklyQuizId: s.currentWeeklyQuizId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load settings' });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    const { weeklyContestEnabled, currentWeeklyQuizId } = req.body;
    const s = await getOrCreateSettings();
    if (typeof weeklyContestEnabled === 'boolean') s.weeklyContestEnabled = weeklyContestEnabled;
    if (currentWeeklyQuizId !== undefined) {
      if (currentWeeklyQuizId === null || currentWeeklyQuizId === '') {
        s.currentWeeklyQuizId = null;
      } else {
        const q = await Quiz.findById(currentWeeklyQuizId);
        if (!q) return res.status(400).json({ message: 'Quiz not found' });
        if (!q.isWeeklyContest) {
          return res.status(400).json({ message: 'Selected quiz must be marked as weekly contest' });
        }
        s.currentWeeklyQuizId = q._id;
      }
    }
    await s.save();
    res.json({
      weeklyContestEnabled: s.weeklyContestEnabled,
      currentWeeklyQuizId: s.currentWeeklyQuizId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update settings' });
  }
});

/** Clear leaderboard for current weekly quiz (or all if quizId query) */
router.delete('/leaderboard', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const quizId = req.query.quizId || settings.currentWeeklyQuizId;
    if (!quizId) {
      await Leaderboard.deleteMany({});
      return res.json({ message: 'All leaderboard entries removed' });
    }
    const result = await Leaderboard.deleteMany({ quizId });
    res.json({ message: `Removed ${result.deletedCount} leaderboard entries`, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to reset leaderboard' });
  }
});

/** All quizzes (admin) */
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 }).lean();
    const withCounts = await Promise.all(
      quizzes.map(async (q) => ({
        ...q,
        questionCount: await Question.countDocuments({ quizId: q._id }),
      }))
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to list quizzes' });
  }
});

/** Single quiz with full questions (includes correct answers) */
router.get('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).lean();
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1, _id: 1 }).lean();
    res.json({ quiz, questions });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load quiz' });
  }
});

/**
 * Create quiz. Body: { title, description, timeLimitMinutes, isWeeklyContest, isPublished, questions: [{ questionText, options, correctAnswer, order }] }
 */
router.post('/quizzes', async (req, res) => {
  try {
    const { title, description, timeLimitMinutes, isWeeklyContest, isPublished, questions } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const quiz = await Quiz.create({
      title,
      description: description ?? '',
      timeLimitMinutes: timeLimitMinutes ?? 15,
      isWeeklyContest: !!isWeeklyContest,
      isPublished: isPublished !== false,
      createdBy: req.user._id,
    });

    if (Array.isArray(questions) && questions.length > 0) {
      await insertQuestions(quiz._id, questions);
    }

    const qs = await Question.find({ quizId: quiz._id }).sort({ order: 1 });
    res.status(201).json({ quiz, questions: qs });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create quiz' });
  }
});

async function insertQuestions(quizId, questions) {
  const docs = questions.map((q, i) => {
    if (!q.questionText || !Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error('Each question needs questionText and exactly 4 options');
    }
    if (q.correctAnswer < 0 || q.correctAnswer > 3) {
      throw new Error('correctAnswer must be 0–3');
    }
    return {
      quizId,
      order: q.order ?? i,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
    };
  });
  await Question.insertMany(docs);
}

/** Update quiz metadata and optionally replace all questions */
router.put('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const { title, description, timeLimitMinutes, isWeeklyContest, isPublished, questions } = req.body;
    if (title != null) quiz.title = title;
    if (description != null) quiz.description = description;
    if (timeLimitMinutes != null) quiz.timeLimitMinutes = timeLimitMinutes;
    if (isWeeklyContest != null) quiz.isWeeklyContest = !!isWeeklyContest;
    if (isPublished != null) quiz.isPublished = !!isPublished;
    await quiz.save();

    if (Array.isArray(questions)) {
      await Question.deleteMany({ quizId: quiz._id });
      if (questions.length > 0) await insertQuestions(quiz._id, questions);
    }

    const qs = await Question.find({ quizId: quiz._id }).sort({ order: 1 });
    res.json({ quiz, questions: qs });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update quiz' });
  }
});

router.delete('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    await Question.deleteMany({ quizId: req.params.id });
    await Attempt.deleteMany({ quizId: req.params.id });
    await Leaderboard.deleteMany({ quizId: req.params.id });
    const settings = await getOrCreateSettings();
    if (settings.currentWeeklyQuizId?.toString() === req.params.id) {
      settings.currentWeeklyQuizId = null;
      await settings.save();
    }
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete quiz' });
  }
});

export default router;
