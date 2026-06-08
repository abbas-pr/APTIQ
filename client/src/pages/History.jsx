import { useEffect, useState } from 'react';
import client from '../api/client.js';

export default function  History() {
 const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {  
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await client.get('/attempts/history');
        if (!cancelled) setData(d);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load leaderboard');
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
    return <div className="text-red-300">{error}</div>;
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center text-slate-400">
        {data?.message || 'No activity'}
      </div>
    );
  }


  return (
    <>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">HISTORY</h1>
      <p className="text-slate-400 text-sm">quizz Records </p>
      {data.length === 0 ? (
        <p className="text-slate-500">No submissions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">TimeTaken (s)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
              {data.map((e,i) => (
                
                <tr key={`${e.rank}-${e.userName}`} className="text-slate-200">
                  <td className="px-4 py-3 font-mono text-indigo-300">{e.quizId.title}</td>
                  <td className="px-4 py-3 text-slate-400">{e.quizId.isWeeklyContest ? 'Weekly Contest' : 'Regular Quiz'}</td>
                  <td className="px-4 py-3 font-semibold">{e.score}%</td>
                  <td className="px-4 py-3 text-slate-400">{e.timeTaken} sec</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
};

