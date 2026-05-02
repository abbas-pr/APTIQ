import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client.js';

/**
 * Loads quiz without correct answers; tracks answers + elapsed time for submission.
 */
export default function QuizTake() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const timeLimitSec = useMemo(() => {
    const m = quiz?.timeLimitMinutes;
    if (m == null || m <= 0) return null;
    return m * 60;
  }, [quiz]);

  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/quizzes/${id}`);
        if (cancelled) return;
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
        if (data.quiz.timeLimitMinutes > 0) {
          setRemaining(data.quiz.timeLimitMinutes * 60);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load quiz');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (timeLimitSec == null || remaining == null) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLimitSec, remaining]);

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeTakenSeconds = Math.floor((Date.now() - startedAt) / 1000);
    try {
      const { data } = await client.post('/attempts/submit', {
        quizId: id,
        answers,
        timeTakenSeconds,
      });
      navigate(`/result/${data.attemptId}`, { replace: true, state: { summary: data } });
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed');
      setSubmitting(false);
    }
  }, [answers, id, navigate, startedAt, submitting]);

  useEffect(() => {
    if (remaining === 0 && quiz && !submitting) {
      submit();
    }
  }, [remaining, quiz, submit, submitting]);

  const selectOption = (qid, index) => {
    setAnswers((a) => ({ ...a, [qid]: index }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="rounded-xl bg-red-950/50 border border-red-800 text-red-200 px-4 py-3">{error}</div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
          {quiz.description && <p className="text-slate-400 mt-1">{quiz.description}</p>}
        </div>
        {remaining != null && (
          <div
            className={`px-4 py-2 rounded-xl font-mono text-lg font-bold border ${
              remaining <= 30
                ? 'bg-red-950/50 border-red-600 text-red-200'
                : 'bg-slate-900 border-slate-700 text-indigo-300'
            }`}
          >
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 text-sm">{error}</div>
      )}

      <ol className="space-y-6">
        {questions.map((q, idx) => (
          <li key={q._id} className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <p className="font-medium text-white mb-3">
              {idx + 1}. {q.questionText}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    answers[q._id] === i
                      ? 'border-indigo-500 bg-indigo-950/40'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${q._id}`}
                    checked={answers[q._id] === i}
                    onChange={() => selectOption(q._id, i)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-200">{opt}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold text-white transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit quiz'}
        </button>
      </div>
    </div>
  );
}
