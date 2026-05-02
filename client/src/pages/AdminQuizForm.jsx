import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client.js';

const emptyQuestion = () => ({
  questionText: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
});

/**
 * Create or edit quiz + MCQs (admin only).
 */
export default function AdminQuizForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [isWeeklyContest, setIsWeeklyContest] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/admin/quizzes/${id}`);
        if (cancelled) return;
        setTitle(data.quiz.title);
        setDescription(data.quiz.description || '');
        setTimeLimitMinutes(data.quiz.timeLimitMinutes ?? 15);
        setIsWeeklyContest(!!data.quiz.isWeeklyContest);
        setIsPublished(!!data.quiz.isPublished);
        if (data.questions?.length) {
          setQuestions(
            data.questions.map((q) => ({
              questionText: q.questionText,
              options: [...q.options],
              correctAnswer: q.correctAnswer,
            }))
          );
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load quiz');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const updateQuestion = (index, field, value) => {
    setQuestions((qs) => {
      const next = [...qs];
      if (field === 'options') {
        const [optIdx, text] = value;
        const opts = [...next[index].options];
        opts[optIdx] = text;
        next[index] = { ...next[index], options: opts };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion()]);
  const removeQuestion = (index) => setQuestions((qs) => qs.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      title,
      description,
      timeLimitMinutes: Number(timeLimitMinutes) || 0,
      isWeeklyContest,
      isPublished,
      questions: questions.map((q, i) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: Number(q.correctAnswer),
        order: i,
      })),
    };
    try {
      if (isNew) {
        await client.post('/admin/quizzes', payload);
      } else {
        await client.put(`/admin/quizzes/${id}`, payload);
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this quiz permanently?')) return;
    try {
      await client.delete(`/admin/quizzes/${id}`);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
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
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">{isNew ? 'Create quiz' : 'Edit quiz'}</h1>
      {error && (
        <div className="rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-sm px-3 py-2">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Time limit (minutes, 0 = none)</label>
              <input
                type="number"
                min={0}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
              />
            </div>
            <div className="flex flex-col gap-3 justify-end">
              <label className="flex items-center gap-2 text-slate-300 text-sm">
                <input
                  type="checkbox"
                  checked={isWeeklyContest}
                  onChange={(e) => setIsWeeklyContest(e.target.checked)}
                  className="rounded border-slate-600 text-indigo-600"
                />
                Weekly contest quiz
              </label>
              <label className="flex items-center gap-2 text-slate-300 text-sm">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-slate-600 text-indigo-600"
                />
                Published
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="text-sm text-indigo-400 hover:underline"
            >
              + Add question
            </button>
          </div>
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 text-sm">Question {qi + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                required
                placeholder="Question text"
                value={q.questionText}
                onChange={(e) => updateQuestion(qi, 'questionText', e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
              />
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={Number(q.correctAnswer) === oi}
                      onChange={() => updateQuestion(qi, 'correctAnswer', oi)}
                      className="text-indigo-600"
                      title="Mark correct"
                    />
                    <input
                      required
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={(e) => updateQuestion(qi, 'options', [oi, e.target.value])}
                      className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold text-white"
          >
            {saving ? 'Saving…' : 'Save quiz'}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-3 rounded-xl bg-red-900/40 border border-red-800 text-red-200 font-semibold hover:bg-red-900/60"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
