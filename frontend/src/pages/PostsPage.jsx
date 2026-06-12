import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI, referenceAPI } from '../services/api';
import {
    StatusBadge, PriorityBadge, PageHeader,
    Spinner, EmptyState, Button, Card
} from '../components/ui';

const STATUSES = [
    'Vacant - No TC', 'TC Pending - MOHCC', 'TC Pending - MOF',
    'TC Granted', 'TC Expired', 'Recruiting', 'Appointment Stage',
    'Filled', 'Filled - Unconfirmed', 'Frozen', 'Abolished',
];

const PRIORITIES = ['1-Critical', '2-High', '3-Medium', '4-Low'];

export default function PostsPage() {
    const navigate = useNavigate();
    const { isProvincialAdmin, isDistrictUser } = useAuth();

    const [posts, setPosts]           = useState([]);
    const [meta, setMeta]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [reference, setReference]   = useState(null);
    const [filters, setFilters]       = useState({
        search: '', status: '', priority: '',
        district_id: '', facility_id: '',
        sort_by: 'date_fell_vacant', sort_dir: 'asc',
        page: 1, per_page: 25,
    });

    useEffect(() => {
        referenceAPI.getAll().then(r => setReference(r.data.data));
    }, []);

    useEffect(() => {
        loadPosts();
    }, [filters]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const params = {};
            Object.entries(filters).forEach(([k, v]) => { if (v !== '') params[k] = v; });
            const res = await postsAPI.list(params);
            setPosts(res.data.data.data || []);
            setMeta(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const setFilter = (key, value) =>
        setFilters(f => ({ ...f, [key]: value, page: 1 }));

    const toggleSort = (field) => {
        setFilters(f => ({
            ...f,
            sort_by: field,
            sort_dir: f.sort_by === field && f.sort_dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortIcon = (field) => {
        if (filters.sort_by !== field) return ' ↕';
        return filters.sort_dir === 'asc' ? ' ↑' : ' ↓';
    };

    const clearFilters = () => setFilters(f => ({
        ...f, search: '', status: '', priority: '',
        district_id: '', facility_id: '', page: 1,
    }));

    const activeFilterCount = [
        filters.search, filters.status, filters.priority,
        filters.district_id, filters.facility_id,
    ].filter(Boolean).length;

    return (
        <div className="space-y-4">
            <PageHeader
                title="Vacant Posts Register"
                subtitle="All tracked health establishment vacancies in Matabeleland South"
                actions={
                    <Button onClick={() => navigate('/posts/new')}>
                        + New Post
                    </Button>
                }
            />

            {/* ── FILTERS ── */}
            <Card>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-2">
                        <input
                            type="text"
                            placeholder="Search cadre, facility, name..."
                            value={filters.search}
                            onChange={e => setFilter('search', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    {/* Status */}
                    <select
                        value={filters.status}
                        onChange={e => setFilter('status', e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">All Statuses</option>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Priority */}
                    <select
                        value={filters.priority}
                        onChange={e => setFilter('priority', e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">All Priorities</option>
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    {/* District (provincial admin only) */}
                    {isProvincialAdmin && (
                        <select
                            value={filters.district_id}
                            onChange={e => setFilter('district_id', e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">All Districts</option>
                            {reference?.districts?.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Clear filters */}
                    <div className="flex items-center gap-2">
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-red-500 hover:text-red-700 underline whitespace-nowrap"
                            >
                                Clear ({activeFilterCount})
                            </button>
                        )}
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                            {meta?.total ?? 0} records
                        </span>
                    </div>
                </div>

                {/* Quick filter chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {[
                        { label: '🚨 Critical Only',    key: 'priority', val: '1-Critical' },
                        { label: '⏰ TC Expiring',      key: 'status',   val: 'TC Granted' },
                        { label: '❌ TC Expired',       key: 'status',   val: 'TC Expired' },
                        { label: '🔍 Recruiting',       key: 'status',   val: 'Recruiting' },
                        { label: '✅ Filled',           key: 'status',   val: 'Filled' },
                    ].map(chip => (
                        <button
                            key={chip.label}
                            onClick={() => setFilter(chip.key, filters[chip.key] === chip.val ? '' : chip.val)}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                                filters[chip.key] === chip.val
                                    ? 'bg-blue-700 text-white border-blue-700'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
            </Card>

            {/* ── TABLE ── */}
            <Card>
                {loading ? (
                    <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                ) : posts.length === 0 ? (
                    <EmptyState icon="📋" title="No posts found" message="Try adjusting your filters" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
                                    <th className="px-3 py-3 font-semibold">Priority</th>
                                    <th
                                        className="px-3 py-3 font-semibold cursor-pointer hover:text-slate-800"
                                        onClick={() => toggleSort('date_fell_vacant')}
                                    >
                                        Date Vacant{sortIcon('date_fell_vacant')}
                                    </th>
                                    <th className="px-3 py-3 font-semibold">Facility</th>
                                    <th className="px-3 py-3 font-semibold">District</th>
                                    <th className="px-3 py-3 font-semibold">Cadre</th>
                                    <th className="px-3 py-3 font-semibold">Dept</th>
                                    <th className="px-3 py-3 font-semibold">Months</th>
                                    <th className="px-3 py-3 font-semibold">Covered?</th>
                                    <th className="px-3 py-3 font-semibold">TC Status</th>
                                    <th
                                        className="px-3 py-3 font-semibold cursor-pointer hover:text-slate-800"
                                        onClick={() => toggleSort('overall_status')}
                                    >
                                        Status{sortIcon('overall_status')}
                                    </th>
                                    <th
                                        className="px-3 py-3 font-semibold cursor-pointer hover:text-slate-800"
                                        onClick={() => toggleSort('follow_up_date')}
                                    >
                                        Follow-up{sortIcon('follow_up_date')}
                                    </th>
                                    <th className="px-3 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {posts.map((post) => {
                                    const months = post.date_fell_vacant
                                        ? Math.floor((Date.now() - new Date(post.date_fell_vacant)) / (1000 * 60 * 60 * 24 * 30))
                                        : '?';
                                    const followUpOverdue = post.follow_up_date && new Date(post.follow_up_date) < new Date();
                                    const tcExpiringSoon = post.tc_expiry_date &&
                                        new Date(post.tc_expiry_date) > new Date() &&
                                        (new Date(post.tc_expiry_date) - new Date()) < 30 * 24 * 60 * 60 * 1000;

                                    return (
                                        <tr
                                            key={post.id}
                                            className="hover:bg-blue-50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/posts/${post.id}`)}
                                        >
                                            <td className="px-3 py-2.5">
                                                <PriorityBadge priority={post.priority_level} />
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                                                {post.date_fell_vacant
                                                    ? new Date(post.date_fell_vacant).toLocaleDateString('en-GB')
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[160px] truncate">
                                                {post.facility?.name ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                                                {post.district?.name ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-700 max-w-[140px] truncate">
                                                {post.cadre?.name ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-500 text-xs">
                                                {post.department ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`font-bold text-sm ${
                                                    months >= 12 ? 'text-red-600' :
                                                    months >= 6  ? 'text-orange-500' :
                                                    months >= 3  ? 'text-yellow-600' : 'text-slate-600'
                                                }`}>
                                                    {months}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`text-xs font-medium ${
                                                    post.is_post_covered === 'No'        ? 'text-red-600' :
                                                    post.is_post_covered === 'Partially' ? 'text-orange-500' :
                                                    'text-green-600'
                                                }`}>
                                                    {post.is_post_covered}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-slate-500">
                                                {tcExpiringSoon
                                                    ? <span className="text-orange-600 font-medium">⚠️ Expiring</span>
                                                    : (post.tc_status ?? '—')
                                                }
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <StatusBadge status={post.overall_status} />
                                            </td>
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                {post.follow_up_date ? (
                                                    <span className={`text-xs ${followUpOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                                        {followUpOverdue ? '⚠️ ' : ''}
                                                        {new Date(post.follow_up_date).toLocaleDateString('en-GB')}
                                                    </span>
                                                ) : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td
                                                className="px-3 py-2.5"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => navigate(`/posts/${post.id}`)}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        View
                                                    </button>
                                                    <span className="text-slate-300">·</span>
                                                    <button
                                                        onClick={() => navigate(`/posts/${post.id}/edit`)}
                                                        className="text-xs text-slate-500 hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── PAGINATION ── */}
                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                            Showing {meta.from}–{meta.to} of {meta.total} posts
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={meta.current_page <= 1}
                                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                            >
                                ← Prev
                            </button>
                            <span className="text-xs text-slate-500 px-2">
                                Page {meta.current_page} of {meta.last_page}
                            </span>
                            <button
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}