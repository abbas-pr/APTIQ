import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    setErr('');
    try {
      const [s, st, qz] = await Promise.all([
        client.get('/admin/stats'),
        client.get('/admin/settings'),
        client.get('/admin/quizzes'),
      ]);
      setStats(s.data);
      setSettings(st.data);
      setQuizzes(qz.data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleWeekly = async () => {
    setMsg('');
    try {
      const { data } = await client.patch('/admin/settings', {
        weeklyContestEnabled: !settings.weeklyContestEnabled,
      });
      setSettings(data);
      setMsg('Weekly contest setting updated.');
    } catch (e) {
      setErr(e.response?.data?.message || 'Update failed');
    }
  };

  const setWeeklyQuiz = async (quizId) => {
    setMsg('');
    try {
      const { data } = await client.patch('/admin/settings', {
        currentWeeklyQuizId: quizId || null,
      });
      setSettings(data);
      setMsg('Active weekly quiz updated.');
    } catch (e) {
      setErr(e.response?.data?.message || 'Update failed');
    }
  };

  const resetLeaderboard = async () => {
    if (!window.confirm('Clear leaderboard for the current weekly quiz?')) return;
    setMsg('');
    try {
      const { data } = await client.delete('/admin/leaderboard');
      setMsg(data.message);
    } catch (e) {
      setErr(e.response?.data?.message || 'Reset failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-white">Admin dashboard</h1>

      {err && (
        <div className="rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-sm px-3 py-2">{err}</div>
      )}
      {msg && (
        <div className="rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-sm px-3 py-2">
          {msg}
        </div>
      )}

      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Users', value: stats?.totalUsers },
          { label: 'Quizzes', value: stats?.totalQuizzes },
          { label: 'Attempts', value: stats?.totalAttempts },
        ].map((x) => (
          <div key={x.label} className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-500 text-sm">{x.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{x.value ?? '—'}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Weekly contest</h2>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-slate-400">
            Status:{' '}
            <strong className={settings?.weeklyContestEnabled ? 'text-emerald-400' : 'text-slate-500'}>
              {settings?.weeklyContestEnabled ? 'Enabled' : 'Disabled'}
            </strong>
          </span>
          <button
            type="button"
            onClick={toggleWeekly}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white"
          >
            Toggle enable / disable
          </button>
          <button
            type="button"
            onClick={resetLeaderboard}
            className="px-4 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-sm font-medium text-red-200 border border-red-800"
          >
            Reset leaderboard
          </button>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Active weekly quiz</label>
          <select
            value={settings?.currentWeeklyQuizId || ''}
            onChange={(e) => setWeeklyQuiz(e.target.value || null)}
            className="w-full max-w-md rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
          >
            <option value="">— None —</option>
            {quizzes.filter((q) => q.isWeeklyContest).map((q) => (
              <option key={q._id} value={q._id}>
                {q.title}
              </option>
            ))}
          </select>
          <p className="text-slate-500 text-xs mt-2">
            Mark a quiz as &quot;Weekly contest&quot; when creating or editing it, then select it here.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Quizzes</h2>
          <Link
            to="/admin/quizzes/new"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
          >
            Create quiz
          </Link>
        </div>
        <ul className="space-y-2">
          {quizzes.map((q) => (
            <li
              key={q._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3"
            >
              <div>
                <span className="text-white font-medium">{q.title}</span>
                {q.isWeeklyContest && (
                  <span className="ml-2 text-xs text-amber-400">Weekly</span>
                )}
                {!q.isPublished && <span className="ml-2 text-xs text-slate-500">Draft</span>}
              </div>
              <Link
                to={`/admin/quizzes/${q._id}`}
                className="text-sm text-indigo-400 hover:underline"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
