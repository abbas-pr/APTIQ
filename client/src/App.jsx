import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import QuizList from './pages/QuizList.jsx';
import QuizTake from './pages/QuizTake.jsx';
import Result from './pages/Result.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminQuizForm from './pages/AdminQuizForm.jsx';
import History from './pages/History.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/quizzes"
          element={
            <ProtectedRoute role="user">
              <QuizList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:id"
          element={
            <ProtectedRoute role="user">
              <QuizTake />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result/:id"
          element={
            <ProtectedRoute role="user">
              <Result />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute role="user">
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        
    <Route
          path="/history"
          element={
            <ProtectedRoute role="user">
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/quizzes/:id"
          element={
            <ProtectedRoute role="admin">
              <AdminQuizForm />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
