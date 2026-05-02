import express from 'express';
import Leaderboard from '../models/Leaderboard.js';
import { authenticate } from '../middleware/auth.js';
import { getOrCreateSettings } from '../utils/settingsHelper.js';

const router = express.Router();

/**
 * Top users for the active weekly contest quiz.
 * Sort: score descending, then time taken ascending (faster is better at same score).
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    if (!settings.weeklyContestEnabled || !settings.currentWeeklyQuizId) {
      return res.json({ enabled: false, entries: [], message: 'Weekly contest is not active' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const entries = await Leaderboard.find({ quizId: settings.currentWeeklyQuizId })
      .populate('userId', 'name email')
      .sort({ score: -1, timeTaken: 1 })
      .limit(limit)
      .lean();

    const ranked = entries.map((e, i) => ({
      rank: i + 1,
      userName: e.userId?.name || 'User',
      email: e.userId?.email,
      score: e.score,
      timeTaken: e.timeTaken,
    }));

    res.json({ enabled: true, quizId: settings.currentWeeklyQuizId, entries: ranked });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load leaderboard' });
  }
});

export default router;
