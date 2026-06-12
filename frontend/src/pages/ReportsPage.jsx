import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, referenceAPI, downloadFile } from '../services/api';
import { PageHeader, Card, Button, Spinner } from '../components/ui';

export default function ReportsPage() {
    const { isProvincialAdmin, isDistrictUser, user } = useAuth();
    const [reference, setReference]   = useState(null);
    const [trend, setTrend]           = useState([]);
    const [benchmark, setBenchmark]   = useState([]);
    const [longest, setLongest]       = useState([]);
    const [loading, setLoading]       = useState({});
    const [filters, setFilters]       = useState({ district_id: '', exclude_filled: false });

    useEffect(() => {
        referenceAPI.getAll().then(r => setReference(r.data.data));
        loadJsonReports();
    }, []);

    const loadJsonReports = async () => {
        try {
            const [trendRes, longRes] = await Promise.all([
                reportsAPI.monthlyTrend(),
                reportsAPI.longestVacancies(),
            ]);
            setTrend(trendRes.data.data);
            setLongest(longRes.data.data);

            if (isProvincialAdmin) {
                const benchRes = await reportsAPI.districtBenchmark();
                setBenchmark(benchRes.data.data);
            }
        } catch (err) {
            console.error('Failed to load report data:', err);
        }
    };

    const download = async (key, apiFn, filename) => {
        setLoading(l => ({ ...l, [key]: true }));
        try {
            await downloadFile(apiFn(), filename);
        } catch (err) {
            alert('Download failed. Please try again.');
        } finally {
            setLoading(l => ({ ...l, [key]: false }));
        }
    };

    const DownloadBtn = ({ reportKey, label, apiFn, filename, color = 'primary' }) => (
        <Button
            variant={color}
            disabled={loading[reportKey]}
            onClick={() => download(reportKey, apiFn, filename)}
        >
            {loading[reportKey] ? '⏳ Downloading...' : `⬇️ ${label}`}
        </Button>
    );

    return (
        <div className="space-y-6 max-w-5xl">
            <PageHeader
                title="Reports & Exports"
                subtitle="Download Excel reports or view data summaries"
            />

            {/* ── FILTERS ── */}
            {isProvincialAdmin && (
                <Card title="🔧 Report Filters">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                                Filter by District
                            </label>
                            <select
                                value={filters.district_id}
                                onChange={e => setFilters(f => ({ ...f, district_id: e.target.value }))}
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">All Districts</option>
                                {reference?.districts?.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="exclude_filled"
                                checked={filters.exclude_filled}
                                onChange={e => setFilters(f => ({ ...f, exclude_filled: e.target.checked }))}
                                className="w-4 h-4"
                            />
                            <label htmlFor="exclude_filled" className="text-sm text-slate-600">
                                Exclude Filled / Abolished Posts
                            </label>
                        </div>
                    </div>
                </Card>
            )}

            {/* ── EXCEL DOWNLOADS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Provincial Summary */}
                {isProvincialAdmin && (
                    <Card title="🗺️ Provincial Summary Report">
                        <p className="text-xs text-slate-500 mb-4">
                            All posts across all 7 districts and 20 facilities. Complete vacancy register.
                        </p>
                        <DownloadBtn
                            reportKey="provincial"
                            label="Download Provincial Summary"
                            apiFn={() => reportsAPI.provincialSummary({
                                district_id: filters.district_id,
                                exclude_filled: filters.exclude_filled ? 1 : 0,
                            })}
                            filename={`MatSouth_Provincial_Summary_${new Date().toISOString().slice(0,10)}.xlsx`}
                        />
                    </Card>
                )}

                {/* District Report */}
                {(isProvincialAdmin || isDistrictUser) && (
                    <Card title="📍 District Report">
                        <p className="text-xs text-slate-500 mb-3">
                            All posts within a specific district.
                        </p>
                        {isProvincialAdmin && (
                            <select
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={filters.district_id}
                                onChange={e => setFilters(f => ({ ...f, district_id: e.target.value }))}
                            >
                                <option value="">Select district...</option>
                                {reference?.districts?.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        )}
                        <DownloadBtn
                            reportKey="district"
                            label="Download District Report"
                            apiFn={() => reportsAPI.districtReport(
                                isDistrictUser ? user.district_id : (filters.district_id || 1),
                                { exclude_filled: filters.exclude_filled ? 1 : 0 }
                            )}
                            filename={`District_Vacancy_Report_${new Date().toISOString().slice(0,10)}.xlsx`}
                        />
                    </Card>
                )}

                {/* TC Status Report */}
                <Card title="💰 TC Status Report">
                    <p className="text-xs text-slate-500 mb-4">
                        All Treasury Concurrence records with expiry tracking.
                    </p>
                    <DownloadBtn
                        reportKey="tc"
                        label="Download TC Status Report"
                        apiFn={() => reportsAPI.tcStatusReport({ district_id: filters.district_id })}
                        filename={`TC_Status_Report_${new Date().toISOString().slice(0,10)}.xlsx`}
                    />
                </Card>

                {/* Critical Posts */}
                <Card title="🚨 Critical Posts Report">
                    <p className="text-xs text-slate-500 mb-4">
                        Priority 1 posts requiring immediate action.
                    </p>
                    <DownloadBtn
                        reportKey="critical"
                        label="Download Critical Posts"
                        apiFn={() => reportsAPI.criticalPostsReport({ district_id: filters.district_id })}
                        filename={`Critical_Posts_${new Date().toISOString().slice(0,10)}.xlsx`}
                    />
                </Card>

                {/* Locum Cost */}
                <Card title="💵 Locum Cost Analysis">
                    <p className="text-xs text-slate-500 mb-4">
                        All locum arrangements with cost-to-date calculations.
                    </p>
                    <DownloadBtn
                        reportKey="locum"
                        label="Download Locum Cost Report"
                        apiFn={() => reportsAPI.locumCostReport({ district_id: filters.district_id })}
                        filename={`Locum_Cost_Analysis_${new Date().toISOString().slice(0,10)}.xlsx`}
                    />
                </Card>
            </div>

            {/* ── MONTHLY TREND TABLE ── */}
            {trend.length > 0 && (
                <Card title="📈 12-Month Vacancy Trend">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-wide bg-slate-50 text-left">
                                    <th className="px-3 py-2">Month</th>
                                    <th className="px-3 py-2 text-right">Total Vacant</th>
                                    <th className="px-3 py-2 text-right">Newly Vacant</th>
                                    <th className="px-3 py-2 text-right">Filled</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {trend.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-medium text-slate-700">{row.month}</td>
                                        <td className="px-3 py-2 text-right">
                                            <span className={`font-bold ${row.total_vacant > 10 ? 'text-red-600' : 'text-slate-700'}`}>
                                                {row.total_vacant}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right text-orange-600 font-medium">
                                            {row.newly_vacant > 0 ? `+${row.newly_vacant}` : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-green-600 font-medium">
                                            {row.filled > 0 ? row.filled : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* ── DISTRICT BENCHMARK ── */}
            {isProvincialAdmin && benchmark.length > 0 && (
                <Card title="🗺️ District Benchmarking">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-wide bg-slate-50 text-left">
                                    <th className="px-3 py-2">District</th>
                                    <th className="px-3 py-2 text-right">Facilities</th>
                                    <th className="px-3 py-2 text-right">Total Vacant</th>
                                    <th className="px-3 py-2 text-right">Critical</th>
                                    <th className="px-3 py-2 text-right">Uncovered</th>
                                    <th className="px-3 py-2 text-right">TC Expired</th>
                                    <th className="px-3 py-2 text-right">Locum Cost</th>
                                    <th className="px-3 py-2 text-right">Avg Months to Fill</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {benchmark.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-semibold text-slate-800">{row.district}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{row.facilities_count}</td>
                                        <td className="px-3 py-2 text-right font-bold text-red-600">{row.total_vacant}</td>
                                        <td className="px-3 py-2 text-right font-bold text-red-700">{row.critical_posts}</td>
                                        <td className="px-3 py-2 text-right text-orange-600">{row.uncovered_posts}</td>
                                        <td className="px-3 py-2 text-right text-red-500">{row.tc_expired_count}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">
                                            {row.total_locum_cost > 0 ? `$${Number(row.total_locum_cost).toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-slate-600">
                                            {row.avg_months_to_fill ? `${row.avg_months_to_fill} mo` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* ── LONGEST VACANT ── */}
            {longest.length > 0 && (
                <Card title="⏳ Top 50 Longest Standing Vacancies">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-wide bg-slate-50 text-left">
                                    <th className="px-3 py-2">#</th>
                                    <th className="px-3 py-2">Facility</th>
                                    <th className="px-3 py-2">District</th>
                                    <th className="px-3 py-2">Cadre</th>
                                    <th className="px-3 py-2">Dept</th>
                                    <th className="px-3 py-2 text-right">Months</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Covered?</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {longest.map((post, i) => (
                                    <tr key={post.id} className={`hover:bg-slate-50 ${post.months_vacant >= 12 ? 'bg-red-50' : ''}`}>
                                        <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                                        <td className="px-3 py-2 font-medium text-slate-700">{post.facility}</td>
                                        <td className="px-3 py-2 text-slate-500">{post.district}</td>
                                        <td className="px-3 py-2 text-slate-700">{post.cadre}</td>
                                        <td className="px-3 py-2 text-slate-500 text-xs">{post.department || '—'}</td>
                                        <td className="px-3 py-2 text-right">
                                            <span className={`font-bold ${
                                                post.months_vacant >= 12 ? 'text-red-600' :
                                                post.months_vacant >= 6  ? 'text-orange-500' : 'text-slate-600'
                                            }`}>
                                                {post.months_vacant}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-slate-600">{post.overall_status}</td>
                                        <td className="px-3 py-2">
                                            <span className={`text-xs font-medium ${
                                                post.is_post_covered === 'No' ? 'text-red-500' :
                                                post.is_post_covered === 'Partially' ? 'text-orange-500' : 'text-green-600'
                                            }`}>
                                                {post.is_post_covered}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}