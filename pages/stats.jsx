import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { fetchLoginStatsLast7, fetchLoginStats } from '@/service/service';
import { useRouter } from 'next/router';

export default function StatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ today: 0, last7Days: [] });
  const [range, setRange] = useState('weekly');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Use new endpoint for selected range
        if (range === 'weekly') {
          const res = await fetchLoginStatsLast7(router);
          if (res?.success) setStats(res);
          else setError(res?.message || 'Failed to load stats');
        } else {
          const res = await fetchLoginStats(router, range);
          if (res?.success) setStats(res);
          else setError(res?.message || 'Failed to load stats');
        }
      } catch (e) {
        setError(e?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, range]);

  return (
    <Layout title="Check-ins">
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-800">Login Check-ins</h1>
            <div className="flex gap-2">
              <button onClick={()=>setRange('weekly')} className={`px-3 py-1 rounded border text-sm ${range==='weekly'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>Weekly</button>
              <button onClick={()=>setRange('monthly')} className={`px-3 py-1 rounded border text-sm ${range==='monthly'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>Monthly</button>
              <button onClick={()=>setRange('yearly')} className={`px-3 py-1 rounded border text-sm ${range==='yearly'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>Yearly</button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-10">{error}</div>
          ) : (
            <>
              {range==='weekly' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                    <div className="text-gray-600 text-sm">Today</div>
                    <div className="text-3xl font-bold text-blue-700">{stats.today}</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-gray-50">
                    <div className="text-gray-600 text-sm">7-day Total</div>
                    <div className="text-3xl font-bold text-gray-800">{(stats.last7Days||[]).reduce((a,b)=>a + (b.count||0), 0)}</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-gray-50">
                    <div className="text-gray-600 text-sm">Average / day</div>
                    <div className="text-3xl font-bold text-gray-800">{Math.round((((stats.last7Days||[]).reduce((a,b)=>a + (b.count||0), 0) / ((stats.last7Days||[]).length||1)) * 10))/10}</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                    <div className="text-gray-600 text-sm">Total</div>
                    <div className="text-3xl font-bold text-blue-700">{stats.total || 0}</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-gray-50">
                    <div className="text-gray-600 text-sm">Range</div>
                    <div className="text-3xl font-bold text-gray-800">{range}</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-gray-50">
                    <div className="text-gray-600 text-sm">Avg per bucket</div>
                    <div className="text-3xl font-bold text-gray-800">{(() => { const len = (stats.series||[]).length||1; const sum = (stats.series||[]).reduce((a,b)=>a+(b.count||0),0); return Math.round((sum/len)*10)/10; })()}</div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-4 py-2">{range==='yearly' ? 'Month' : 'Date'}</th>
                      <th className="px-4 py-2">Check-ins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(range==='weekly' ? (stats.last7Days||[]) : (stats.series||[])).map((d, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2 text-gray-700">{d.label}</td>
                        <td className="px-4 py-2 text-gray-900 font-semibold">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}


