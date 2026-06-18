import React, { useState, useEffect, useCallback } from 'react';
import { userAPI, referenceAPI } from '../services/api';
import { PageHeader, Card, Button, Spinner } from '../components/ui';

const ROLE_META = {
    provincial_admin: { label: 'Provincial Admin', cls: 'bg-purple-100 text-purple-800' },
    district_user:    { label: 'District User',    cls: 'bg-blue-100 text-blue-800' },
    facility_user:    { label: 'Facility User',    cls: 'bg-green-100 text-green-800' },
};

const RoleBadge = ({ role }) => {
    const { label, cls } = ROLE_META[role] || { label: role || '—', cls: 'bg-gray-100 text-gray-700' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
            {label}
        </span>
    );
};

const EMPTY_FORM = {
    name: '', email: '', password: '',
    role: 'facility_user', district_id: '', facility_id: '', is_active: true,
};

export default function UsersPage() {
    const [users,      setUsers]      = useState([]);
    const [districts,  setDistricts]  = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [showModal,  setShowModal]  = useState(false);
    const [editing,    setEditing]    = useState(null);   // null = create mode
    const [form,       setForm]       = useState(EMPTY_FORM);
    const [saving,     setSaving]     = useState(false);
    const [saveError,  setSaveError]  = useState('');
    const [togglingId, setTogglingId] = useState(null);

    // ─── Load users + reference data ──────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [usersRes, refRes] = await Promise.all([
                userAPI.getAll(),
                referenceAPI.getAll(),
            ]);

            setUsers(usersRes.data?.data ?? usersRes.data ?? []);

            // Handle both response shapes: res.data.data.X  OR  res.data.X
            const ref = refRes.data?.data ?? refRes.data ?? {};
            setDistricts(Array.isArray(ref.districts)  ? ref.districts  : []);
            setFacilities(Array.isArray(ref.facilities) ? ref.facilities : []);
        } catch {
            setError('Failed to load users. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ─── Modal helpers ────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setSaveError('');
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditing(user);
        setForm({
            name:        user.name  || '',
            email:       user.email || '',
            password:    '',
            role:        user.role  || 'facility_user',
            district_id: user.district_id?.toString() || '',
            facility_id: user.facility_id?.toString() || '',
            is_active:   user.is_active !== false,
        });
        setSaveError('');
        setShowModal(true);
    };

    // ─── Save (create or update) ──────────────────────────────────────────────
    const handleSave = async () => {
        if (!form.name.trim())  return setSaveError('Name is required.');
        if (!form.email.trim()) return setSaveError('Email is required.');
        if (!editing && !form.password) return setSaveError('Password is required for new users.');

        setSaving(true);
        setSaveError('');
        try {
            const payload = {
                name:        form.name,
                email:       form.email,
                role:        form.role,
                is_active:   form.is_active,
                district_id: ['district_user', 'facility_user'].includes(form.role) && form.district_id
                                 ? form.district_id : null,
                facility_id: form.role === 'facility_user' && form.facility_id
                                 ? form.facility_id : null,
            };
            if (form.password) payload.password = form.password;

            if (editing) {
                await userAPI.update(editing.id, payload);
            } else {
                await userAPI.create({ ...payload, password: form.password });
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

    // ─── Toggle active ────────────────────────────────────────────────────────
    const handleToggle = async (userId) => {
        setTogglingId(userId);
        try {
            await userAPI.toggleActive(userId);
            await loadData();
        } catch {
            // silent — UI stays consistent on next loadData
        } finally {
            setTogglingId(null);
        }
    };

    // ─── Derived state ────────────────────────────────────────────────────────
    const filteredFacilities = form.district_id
        ? facilities.filter(f => f.district_id?.toString() === form.district_id)
        : facilities;

    const needsDistrict  = ['district_user', 'facility_user'].includes(form.role);
    const needsFacility  = form.role === 'facility_user';

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-500">Loading users...</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="User Management"
                subtitle={`${users.length} registered user${users.length !== 1 ? 's' : ''}`}
                action={<Button onClick={openCreate} variant="primary">+ Add User</Button>}
            />

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
            )}

            {/* ── Users Table ─────────────────────────────────────────────── */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Name', 'Email', 'Role', 'District', 'Facility', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                                        No users found. Click "+ Add User" to create one.
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${!user.is_active ? 'opacity-60' : ''}`}>
                                    <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                        {user.name}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        {user.email}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        {user.district?.name || '—'}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        {user.facility?.name || '—'}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm space-x-3">
                                        <button onClick={() => openEdit(user)}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium">
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggle(user.id)}
                                            disabled={togglingId === user.id}
                                            className={`font-medium ${
                                                user.is_active
                                                    ? 'text-red-600 hover:text-red-900'
                                                    : 'text-green-600 hover:text-green-900'
                                            } disabled:opacity-50`}>
                                            {togglingId === user.id ? '...' : (user.is_active ? 'Deactivate' : 'Activate')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ── Create / Edit Modal ──────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-700 bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editing ? `Edit User — ${editing.name}` : 'Add New User'}
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            {saveError && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                                    {saveError}
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Sibusiso Moyo" />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input type="email" value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="user@matsouth.gov.zw" />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password {!editing && <span className="text-red-500">*</span>}
                                    {editing && <span className="text-gray-400 font-normal text-xs ml-1">(leave blank to keep current)</span>}
                                </label>
                                <input type="password" value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder={editing ? 'Leave blank to keep unchanged' : 'Minimum 8 characters'} />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    System Role <span className="text-red-500">*</span>
                                </label>
                                <select value={form.role}
                                    onChange={e => setForm(f => ({ ...f, role: e.target.value, district_id: '', facility_id: '' }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="facility_user">Facility User — own facility only</option>
                                    <option value="district_user">District User — all facilities in district</option>
                                    <option value="provincial_admin">Provincial Admin — full access</option>
                                </select>
                            </div>

                            {/* District — facility_user and district_user only */}
                            {needsDistrict && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        District <span className="text-red-500">*</span>
                                        <span className="text-gray-400 font-normal text-xs ml-1">
                                            ({districts.length} available)
                                        </span>
                                    </label>
                                    {districts.length === 0 ? (
                                        <p className="text-sm text-red-500 mt-1">
                                            Districts not loaded — please refresh the page.
                                        </p>
                                    ) : (
                                        <select value={form.district_id}
                                            onChange={e => setForm(f => ({ ...f, district_id: e.target.value, facility_id: '' }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                            <option value="">— Select District —</option>
                                            {districts.map(d => (
                                                <option key={d.id} value={d.id.toString()}>{d.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Facility — facility_user only */}
                            {needsFacility && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Facility <span className="text-red-500">*</span>
                                        <span className="text-gray-400 font-normal text-xs ml-1">
                                            ({filteredFacilities.length} available
                                            {form.district_id ? ' in selected district' : ''})
                                        </span>
                                    </label>
                                    {facilities.length === 0 ? (
                                        <p className="text-sm text-red-500 mt-1">
                                            Facilities not loaded — please refresh the page.
                                        </p>
                                    ) : (
                                        <select value={form.facility_id}
                                            onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                            <option value="">— Select Facility —</option>
                                            {filteredFacilities.map(f => (
                                                <option key={f.id} value={f.id.toString()}>{f.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Active toggle — edit mode only */}
                            {editing && (
                                <div className="flex items-center gap-3 pt-1">
                                    <input type="checkbox" id="is_active" checked={form.is_active}
                                        onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                        Account is active
                                    </label>
                                </div>
                            )}
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
                                {saving ? 'Saving...' : (editing ? 'Save Changes' : 'Create User')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}