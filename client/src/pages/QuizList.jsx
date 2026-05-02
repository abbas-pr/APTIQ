import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get('/quizzes');
        if (!cancelled) setQuizzes(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load quizzes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-950/50 border border-red-800 text-red-200 px-4 py-3">{error}</div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <p className="text-slate-400 text-center py-12">
        No quizzes available yet. Check back later or ask an admin to publish one.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Available quizzes</h1>
      <ul className="space-y-3">
        {quizzes.map((q) => (
          <li
            key={q._id}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-white">{q.title}</h2>
                {q.isWeeklyContest && (
                  <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Weekly contest
                  </span>
                )}
              </div>
              {q.description && <p className="text-slate-400 text-sm mt-1">{q.description}</p>}
              <p className="text-slate-500 text-sm mt-2">
                {q.questionCount ?? 0} questions · {q.timeLimitMinutes ? `${q.timeLimitMinutes} min limit` : 'No timer'}
              </p>
            </div>
            <Link
              to={`/quiz/${q._id}`}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-center transition-colors"
            >
              Start
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
