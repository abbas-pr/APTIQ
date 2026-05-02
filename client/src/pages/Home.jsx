import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-10">
      <section className="text-center space-y-4 pt-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-white">Test your knowledge</h1>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Take timed multiple-choice quizzes and compete on the weekly leaderboard.
        </p>
        {!user && (
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl border border-slate-600 hover:border-slate-500 text-slate-200 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}
        {user?.role === 'user' && (
          <Link
            to="/quizzes"
            className="inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Browse quizzes
          </Link>
        )}
      </section>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { t: 'Timed quizzes', d: 'Each quiz runs on a countdown you can see while you work.' },
          { t: 'Instant scoring', d: 'Submit once to see your score and a per-question breakdown.' },
          { t: 'Weekly contest', d: 'One attempt per week on the featured quiz; climb the board.' },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <h3 className="font-semibold text-white mb-2">{x.t}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
