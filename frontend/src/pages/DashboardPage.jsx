import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import {
    StatCard, AlertBanner, Card, Spinner, EmptyState, PageHeader
} from '../components/ui';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, Legend
} from 'recharts';

export default function DashboardPage() {
    const { user, isProvincialAdmin } = useAuth();
    const navigate = useNavigate();

    const [data, setData]       = useState(null);
    const [alerts, setAlerts]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [dashRes, alertRes] = await Promise.all([
                dashboardAPI.getData(),
                dashboardAPI.getAlerts(),
            ]);
            setData(dashRes.data.data);
            setAlerts(alertRes.data.data);
        } catch (err) {
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                {error}
            </div>
        );
    }

    const s = data?.summary || {};

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Welcome, ${user?.name}`}
                subtitle={`Matabeleland South Province · ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
                actions={
                    <button
                        onClick={loadDashboard}
                        className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg"
                    >
                        ↻ Refresh
                    </button>
                }
            />

            {/* ── ALERTS ── */}
            {alerts.length > 0 && (
                <Card title={`🔔 Active Alerts (${alerts.length})`}>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {alerts.map((alert, i) => (
                            <AlertBanner
                                key={i}
                                type={alert.type}
                                message={alert.message}
                                postId={alert.post_id}
                                onView={(id) => navigate(`/posts/${id}`)}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {/* ── SUMMARY STATS ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Total Vacant Posts"
                    value={s.total_vacant ?? 0}
                    sub="Active vacancies"
                    color="red"
                    icon="📋"
                />
                <StatCard
                    label="Critical Priority"
                    value={s.critical_posts ?? 0}
                    sub="Require urgent action"
                    color="red"
                    icon="🚨"
                    alert={s.critical_posts > 0}
                />
                <StatCard
                    label="Uncovered Posts"
                    value={s.uncovered_posts ?? 0}
                    sub="No interim arrangement"
                    color="orange"
                    icon="⚠️"
                />
                <StatCard
                    label="Filled This Month"
                    value={s.filled_this_month ?? 0}
                    sub="Recruitment success"
                    color="green"
                    icon="✅"
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="TC Expiring Soon"
                    value={s.tc_expiring_soon ?? 0}
                    sub="Within 30 days"
                    color="orange"
                    icon="⏰"
                    alert={s.tc_expiring_soon > 0}
                />
                <StatCard
                    label="TC Expired"
                    value={s.tc_expired ?? 0}
                    sub="Not yet utilised"
                    color="red"
                    icon="❌"
                />
                <StatCard
                    label="Overdue Follow-ups"
                    value={s.overdue_follow_ups ?? 0}
                    sub="Past follow-up date"
                    color="purple"
                    icon="📅"
                />
                <StatCard
                    label="All Posts Tracked"
                    value={s.total_all_posts ?? 0}
                    sub="Including filled"
                    color="blue"
                    icon="🏥"
                />
            </div>

            {/* ── CHARTS ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Vacancy Trend */}
                <Card title="📈 Vacancy Trend — Last 6 Months">
                    {data?.vacancy_trend?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={data.vacancy_trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#1d4ed8"
                                    strokeWidth={2.5}
                                    dot={{ r: 4, fill: '#1d4ed8' }}
                                    name="Vacant Posts"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon="📊" title="No trend data yet" />
                    )}
                </Card>

                {/* Status Breakdown */}
                <Card title="📊 Posts by Status">
                    {data?.status_breakdown && Object.keys(data.status_breakdown).length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={Object.entries(data.status_breakdown).map(([k, v]) => ({ name: k, count: v }))}
                                layout="vertical"
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fontSize: 10 }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={110} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Posts" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon="📊" title="No data yet" />
                    )}
                </Card>
            </div>

            {/* ── DISTRICT COMPARISON (provincial admin only) ── */}
            {isProvincialAdmin && data?.district_comparison?.length > 0 && (
                <Card title="🗺️ District Comparison">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.district_comparison}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="total_vacant"  fill="#ef4444" name="Total Vacant"  radius={[4, 4, 0, 0]} />
                            <Bar dataKey="critical_count" fill="#f97316" name="Critical"     radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* ── LONGEST VACANT ── */}
            {data?.longest_vacant?.length > 0 && (
                <Card title="⏳ Longest Standing Vacancies (Top 5)">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                                    <th className="pb-2 pr-4">Facility</th>
                                    <th className="pb-2 pr-4">Cadre</th>
                                    <th className="pb-2 pr-4">Since</th>
                                    <th className="pb-2 pr-4">Months</th>
                                    <th className="pb-2 pr-4">Status</th>
                                    <th className="pb-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.longest_vacant.map((post) => {
                                    const months = post.date_fell_vacant
                                        ? Math.floor((Date.now() - new Date(post.date_fell_vacant)) / (1000 * 60 * 60 * 24 * 30))
                                        : '?';
                                    return (
                                        <tr key={post.id} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-2 pr-4 font-medium text-slate-700">
                                                {post.facility?.name ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-slate-600">
                                                {post.cadre?.name ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-slate-500">
                                                {post.date_fell_vacant
                                                    ? new Date(post.date_fell_vacant).toLocaleDateString('en-GB')
                                                    : '—'}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <span className={`font-bold ${months >= 12 ? 'text-red-600' : months >= 6 ? 'text-orange-500' : 'text-slate-600'}`}>
                                                    {months}
                                                </span>
                                            </td>
                                            <td className="py-2 pr-4 text-xs text-slate-600">
                                                {post.overall_status}
                                            </td>
                                            <td className="py-2">
                                                <button
                                                    onClick={() => navigate(`/posts/${post.id}`)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    View →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* ── PRIORITY BREAKDOWN ── */}
            {data?.priority_breakdown && Object.keys(data.priority_breakdown).length > 0 && (
                <Card title="🎯 Open Posts by Priority">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { key: '1-Critical', label: 'Critical', color: 'bg-red-600' },
                            { key: '2-High',     label: 'High',     color: 'bg-orange-500' },
                            { key: '3-Medium',   label: 'Medium',   color: 'bg-yellow-500' },
                            { key: '4-Low',      label: 'Low',      color: 'bg-green-500' },
                        ].map(({ key, label, color }) => (
                            <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className={`w-3 h-3 rounded-full ${color}`} />
                                <div>
                                    <p className="text-xs text-slate-500">{label}</p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {data.priority_breakdown[key] ?? 0}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}