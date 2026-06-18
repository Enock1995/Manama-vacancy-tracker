import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { facilityAPI, districtAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, Button, Spinner } from '../components/ui';

// ─── Type badge ───────────────────────────────────────────────────────────────
const TYPE_MAP = {
    provincial_hospital: { label: 'Provincial Hospital', cls: 'bg-purple-100 text-purple-800' },
    district_hospital:   { label: 'District Hospital',   cls: 'bg-blue-100 text-blue-800' },
    rural_health_centre: { label: 'Rural Health Centre', cls: 'bg-green-100 text-green-800' },
    urban_clinic:        { label: 'Urban Clinic',        cls: 'bg-teal-100 text-teal-800' },
    clinic:              { label: 'Clinic',              cls: 'bg-yellow-100 text-yellow-800' },
    mission_hospital:    { label: 'Mission Hospital',    cls: 'bg-orange-100 text-orange-800' },
    polyclinic:          { label: 'Polyclinic',          cls: 'bg-indigo-100 text-indigo-800' },
};

const TypeBadge = ({ type }) => {
    const { label, cls } = TYPE_MAP[type] || { label: type || '—', cls: 'bg-gray-100 text-gray-700' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
            {label}
        </span>
    );
};

// ─── Ownership badge ──────────────────────────────────────────────────────────
const OWNERSHIP_MAP = {
    government: { label: 'Government',  cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    mission:    { label: 'Mission',     cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
    private:    { label: 'Private',     cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    council:    { label: 'Council',     cls: 'bg-green-50 text-green-700 border border-green-200' },
};

const OwnershipBadge = ({ ownership }) => {
    const { label, cls } = OWNERSHIP_MAP[ownership] || { label: ownership || '—', cls: 'bg-gray-50 text-gray-600 border border-gray-200' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
            {label}
        </span>
    );
};

// ─── Static option lists ──────────────────────────────────────────────────────
const FACILITY_TYPES = [
    { value: 'provincial_hospital', label: 'Provincial Hospital' },
    { value: 'district_hospital',   label: 'District Hospital' },
    { value: 'rural_health_centre', label: 'Rural Health Centre' },
    { value: 'urban_clinic',        label: 'Urban Clinic' },
    { value: 'clinic',              label: 'Clinic' },
    { value: 'mission_hospital',    label: 'Mission Hospital' },
    { value: 'polyclinic',          label: 'Polyclinic' },
];

const OWNERSHIP_OPTIONS = [
    { value: 'government', label: 'Government (MOHCC)' },
    { value: 'mission',    label: 'Mission' },
    { value: 'private',    label: 'Private' },
    { value: 'council',    label: 'Council' },
];

const EMPTY_FORM = { name: '', district_id: '', type: 'district_hospital', ownership: 'government' };

// ─── Component ────────────────────────────────────────────────────────────────
export default function FacilitiesPage() {
    const { isProvincialAdmin } = useAuth();
    const canEdit = isProvincialAdmin();

    const [facilities, setFacilities] = useState([]);
    const [districts,  setDistricts]  = useState([]);
    const [search,     setSearch]     = useState('');
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [showModal,  setShowModal]  = useState(false);
    const [editing,    setEditing]    = useState(null);
    const [form,       setForm]       = useState(EMPTY_FORM);
    const [saving,     setSaving]     = useState(false);
    const [saveError,  setSaveError]  = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [facRes, distRes] = await Promise.all([
                facilityAPI.getAll(),
                districtAPI.getAll(),
            ]);
            // Handle both res.data.data and res.data response shapes
            setFacilities(facRes.data?.data  ?? facRes.data  ?? []);
            setDistricts( distRes.data?.data ?? distRes.data ?? []);
        } catch {
            setError('Failed to load facilities. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setSaveError('');
        setShowModal(true);
    };

    const openEdit = (facility) => {
        setEditing(facility);
        setForm({
            name:        facility.name        || '',
            district_id: facility.district_id?.toString() || '',
            type:        facility.type        || 'district_hospital',
            ownership:   facility.ownership   || 'government',
        });
        setSaveError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim())    return setSaveError('Facility name is required.');
        if (!form.district_id)    return setSaveError('Please select a district.');

        setSaving(true);
        setSaveError('');
        try {
            const payload = {
                name:        form.name.trim(),
                district_id: parseInt(form.district_id),
                type:        form.type,
                ownership:   form.ownership,
            };
            if (editing) {
                await facilityAPI.update(editing.id, payload);
            } else {
                await facilityAPI.create(payload);
            }
            setShowModal(false);
            await loadData();
        } catch (err) {
            setSaveError(
                err.response?.data?.message ||
                err.response?.data?.error   ||
                `Save failed (HTTP ${err.response?.status ?? 'network error'})`
            );
        } finally {
            setSaving(false);
        }
    };

    // ─── Filtered list ────────────────────────────────────────────────────────
    const filtered = facilities.filter(f =>
        f.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.district?.name?.toLowerCase().includes(search.toLowerCase())
    );

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-500">Loading facilities...</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Health Facilities"
                subtitle={`${facilities.length} facilities across Matabeleland South`}
                action={canEdit && (
                    <Button onClick={openCreate} variant="primary">+ Add Facility</Button>
                )}
            />

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
            )}

            {/* Search */}
            <Card>
                <div className="p-4">
                    <input type="text" value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by facility name or district..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </Card>

            {/* Facilities table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Facility Name', 'District', 'Type', 'Ownership', 'Actions'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                                        {search ? 'No facilities match your search.' : 'No facilities found.'}
                                    </td>
                                </tr>
                            ) : filtered.map(facility => (
                                <tr key={facility.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="text-sm font-medium text-gray-900">{facility.name}</div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {facility.district?.name || '—'}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <TypeBadge type={facility.type} />
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <OwnershipBadge ownership={facility.ownership} />
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm space-x-4">
                                        <Link
                                            to={`/posts?facility_id=${facility.id}`}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium">
                                            View Posts
                                        </Link>
                                        {canEdit && (
                                            <button
                                                onClick={() => openEdit(facility)}
                                                className="text-gray-600 hover:text-gray-900 font-medium">
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length > 0 && (
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                        Showing {filtered.length} of {facilities.length} facilities
                        {search && ` matching "${search}"`}
                    </div>
                )}
            </Card>

            {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-700 bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editing ? `Edit — ${editing.name}` : 'Add New Facility'}
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            {saveError && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                                    {saveError}
                                </div>
                            )}

                            {/* Facility Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Facility Name <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Gwanda District Hospital" />
                            </div>

                            {/* District */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    District <span className="text-red-500">*</span>
                                </label>
                                <select value={form.district_id}
                                    onChange={e => setForm(f => ({ ...f, district_id: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">— Select District —</option>
                                    {districts.map(d => (
                                        <option key={d.id} value={d.id.toString()}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Facility Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Facility Type <span className="text-red-500">*</span>
                                </label>
                                <select value={form.type}
                                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {FACILITY_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Ownership */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ownership <span className="text-red-500">*</span>
                                </label>
                                <select value={form.ownership}
                                    onChange={e => setForm(f => ({ ...f, ownership: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {OWNERSHIP_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                                {saving && <Spinner size="sm" />}
                                {saving ? 'Saving...' : (editing ? 'Save Changes' : 'Create Facility')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}