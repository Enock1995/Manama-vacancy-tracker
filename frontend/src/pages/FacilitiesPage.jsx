import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { facilitiesAPI } from '../services/api';
import { PageHeader, Card, Spinner, EmptyState } from '../components/ui';

export default function FacilitiesPage() {
    const navigate = useNavigate();
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');

    useEffect(() => {
        facilitiesAPI.list()
            .then(r => setFacilities(r.data.data))
            .finally(() => setLoading(false));
    }, []);

    const filtered = facilities.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.district?.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.facility_type?.toLowerCase().includes(search.toLowerCase())
    );

    const typeColor = {
        'Provincial Hospital':    'bg-purple-100 text-purple-800',
        'District Hospital':      'bg-blue-100 text-blue-800',
        'Rural Health Centre':    'bg-green-100 text-green-800',
        'Clinic':                 'bg-teal-100 text-teal-800',
        'Mission Hospital':       'bg-orange-100 text-orange-800',
        'Urban Council Facility': 'bg-slate-100 text-slate-700',
    };

    const ownershipColor = {
        'MOHCC':         'text-blue-600',
        'Mission':       'text-orange-600',
        'RDC':           'text-green-600',
        'Urban Council': 'text-slate-600',
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Facilities Register"
                subtitle="All health facilities in Matabeleland South Province"
            />

            <Card>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by facility name, district or type..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                ) : filtered.length === 0 ? (
                    <EmptyState icon="🏥" title="No facilities found" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-wide bg-slate-50 text-left">
                                    <th className="px-3 py-3">Facility Name</th>
                                    <th className="px-3 py-3">Code</th>
                                    <th className="px-3 py-3">Type</th>
                                    <th className="px-3 py-3">District</th>
                                    <th className="px-3 py-3">Ownership</th>
                                    <th className="px-3 py-3">Level</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(facility => (
                                    <tr key={facility.id} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-3 py-2.5 font-semibold text-slate-800">
                                            {facility.name}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs font-mono text-slate-500">
                                            {facility.code}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[facility.facility_type] ?? 'bg-slate-100 text-slate-600'}`}>
                                                {facility.facility_type}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">
                                            {facility.district?.name ?? '—'}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={`text-xs font-medium ${ownershipColor[facility.ownership] ?? 'text-slate-600'}`}>
                                                {facility.ownership}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-xs text-slate-500">
                                            {facility.level_of_care}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={`text-xs font-medium ${facility.is_active ? 'text-green-600' : 'text-red-500'}`}>
                                                {facility.is_active ? '● Active' : '● Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <button
                                                onClick={() => navigate(`/posts?facility_id=${facility.id}`)}
                                                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                                            >
                                                View Posts →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="text-xs text-slate-400 mt-3 text-right">
                            {filtered.length} of {facilities.length} facilities shown
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
}