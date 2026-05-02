import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import client from '../api/client.js';

/**
 * Shows score from navigation state (immediate) then optional full detail from API.
 */
export default function Result() {
  const { id } = useParams();
  const location = useLocation();
  const summary = location.state?.summary;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(!summary);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/attempts/${id}`);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load result');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading && !summary) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const score = detail?.attempt?.score ?? summary?.score;
  const correct = summary?.correctCount;
  const total = summary?.totalQuestions;
  const timeTaken = detail?.attempt?.timeTaken ?? summary?.timeTaken;
  const rows = detail?.detail ?? summary?.detail;

  if (error && !summary) {
    return <div className="text-red-300">{error}</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center rounded-2xl bg-slate-900 border border-slate-800 p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Quiz complete</h1>
        <p className="text-5xl font-bold text-indigo-400 my-4">{score}%</p>
        {correct != null && total != null && (
          <p className="text-slate-400">
            {correct} / {total} correct
          </p>
        )}
        {timeTaken != null && <p className="text-slate-500 text-sm mt-2">Time: {timeTaken}s</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/quizzes"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            More quizzes
          </Link>
          {summary?.isWeeklyContest && (
            <Link
              to="/leaderboard"
              className="px-5 py-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-medium transition-colors"
            >
              View leaderboard
            </Link>
          )}
        </div>
      </div>

      {rows && rows.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Review</h2>
          <ul className="space-y-3">
            {rows.map((row, i) => (
              <li
                key={i}
                className={`rounded-xl border p-4 ${
                  row.isCorrect ? 'border-emerald-800 bg-emerald-950/20' : 'border-red-900/50 bg-red-950/10'
                }`}
              >
                <p className="text-white text-sm font-medium">{row.questionText}</p>
                <p className="text-slate-400 text-xs mt-2">
                  Your answer:{' '}
                  {row.selected != null && row.options ? row.options[row.selected] : '—'} · Correct:{' '}
                  {row.options?.[row.correctAnswer]}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
