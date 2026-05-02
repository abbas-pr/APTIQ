import express from 'express';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';
import Leaderboard from '../models/Leaderboard.js';
import { authenticate } from '../middleware/auth.js';
import { getOrCreateSettings } from '../utils/settingsHelper.js';

const router = express.Router();

/**
 * POST body: { quizId, answers: { [questionId]: selectedIndex }, timeTakenSeconds }
 * Enforces one attempt for weekly contest; computes score server-side.
 */
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { quizId, answers, timeTakenSeconds } = req.body;
    if (!quizId || answers == null || timeTakenSeconds == null) {
      return res.status(400).json({ message: 'quizId, answers, and timeTakenSeconds are required' });
    }
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can submit quiz attempts' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const settings = await getOrCreateSettings();
    if (quiz.isWeeklyContest) {
      if (!settings.weeklyContestEnabled) {
        return res.status(403).json({ message: 'Weekly contest is disabled' });
      }
      if (!settings.currentWeeklyQuizId || quiz._id.toString() !== settings.currentWeeklyQuizId.toString()) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      const existing = await Attempt.findOne({
        userId: req.user._id,
        quizId: quiz._id,
        isWeeklyContestAttempt: true,
      });
      if (existing) {
        return res.status(400).json({ message: 'You have already attempted this weekly contest' });
      }
    }
    // Regular quizzes: users may attempt multiple times; weekly contest: one attempt (checked above).

    const questions = await Question.find({ quizId: quiz._id });
    if (questions.length === 0) {
      return res.status(400).json({ message: 'This quiz has no questions' });
    }

    let correct = 0;
    const detail = [];

    for (const q of questions) {
      const qid = q._id.toString();
      const selected = answers[qid];
      const selNum = typeof selected === 'number' ? selected : parseInt(selected, 10);
      const isCorrect = !Number.isNaN(selNum) && selNum === q.correctAnswer;
      if (isCorrect) correct += 1;
      detail.push({
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        selected: Number.isNaN(selNum) ? null : selNum,
        correctAnswer: q.correctAnswer,
        isCorrect,
      });
    }

    const score = Math.round((correct / questions.length) * 100);
    const timeTaken = Math.max(0, Number(timeTakenSeconds) || 0);

    const attempt = await Attempt.create({
      userId: req.user._id,
      quizId: quiz._id,
      score,
      timeTaken,
      answers: new Map(Object.entries(answers).map(([k, v]) => [k, Number(v)])),
      isWeeklyContestAttempt: !!quiz.isWeeklyContest,
    });

    // One attempt per user for weekly contest; single leaderboard row per user/quiz.
    if (quiz.isWeeklyContest && settings.weeklyContestEnabled) {
      await Leaderboard.findOneAndUpdate(
        { quizId: quiz._id, userId: req.user._id },
        { score, timeTaken },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({
      attemptId: attempt._id,
      score,
      correctCount: correct,
      totalQuestions: questions.length,
      timeTaken,
      detail,
      isWeeklyContest: !!quiz.isWeeklyContest,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Duplicate attempt' });
    }
    res.status(500).json({ message: err.message || 'Submit failed' });
  }
});

/** User's past attempts */
router.get('/my', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only for regular users' });
    }
    const attempts = await Attempt.find({ userId: req.user._id })
      .populate('quizId', 'title isWeeklyContest')
      .sort({ createdAt: -1 })
      .lean();
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load attempts' });
  }
});

/** Single result (summary) */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('quizId', 'title')
      .populate('userId', 'name email');
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    const ownerId = attempt.userId?._id?.toString?.() || attempt.userId?.toString?.();
    if (req.user.role === 'user' && ownerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const questions = await Question.find({ quizId: attempt.quizId._id }).sort({ order: 1 });
    const detail = questions.map((q) => {
      const selected = attempt.answers.get(q._id.toString());
      return {
        questionText: q.questionText,
        options: q.options,
        selected: selected ?? null,
        correctAnswer: q.correctAnswer,
        isCorrect: selected === q.correctAnswer,
      };
    });
    res.json({
      attempt: {
        _id: attempt._id,
        score: attempt.score,
        timeTaken: attempt.timeTaken,
        createdAt: attempt.createdAt,
        quiz: attempt.quizId,
      },
      detail,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load result' });
  }
});

export default router;
