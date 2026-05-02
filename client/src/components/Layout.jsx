import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3 py-3">
          <Link to="/" className="text-lg font-bold text-white tracking-tight">
            APT<span className="text-indigo-400">IQ</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            {user?.role === 'user' && (
              <>
                <NavLink to="/quizzes" className={linkClass}>
                  Quizzes
                </NavLink>
                <NavLink to="/leaderboard" className={linkClass}>
                  Leaderboard
                </NavLink>
              </>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
            {!user && (
              <>
                <NavLink to="/login" className={linkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  Register
                </NavLink>
                <NavLink to="/admin/login" className={linkClass}>
                  Admin
                </NavLink>
              </>
            )}
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Log out
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
        MERN Quiz App — practice & weekly contest
      </footer>
    </div>
  );
}
