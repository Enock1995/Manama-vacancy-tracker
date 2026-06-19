import { useState, useEffect } from 'react';
import { usersAPI, referenceAPI } from '../services/api';
import { PageHeader, Card, Button, Spinner } from '../components/ui';

const ROLES = [
    { value: 'facility_user',    label: 'Facility User' },
    { value: 'district_user',    label: 'District User' },
    { value: 'provincial_admin', label: 'Provincial Admin' },
];

const EMPTY_FORM = {
    name: '', email: '', password: '', role: 'facility_user',
    facility_id: '', district_id: '',
};

export default function UsersPage() {
    const [users, setUsers]           = useState([]);
    const [districts, setDistricts]   = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [showModal, setShowModal]   = useState(false);
    const [editUser, setEditUser]     = useState(null);
    const [form, setForm]             = useState(EMPTY_FORM);
    const [saving, setSaving]         = useState(false);
    const [errors, setErrors]         = useState({});
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [usersRes, refRes] = await Promise.all([
                usersAPI.list(),
                referenceAPI.getAll(),
            ]);
            setUsers(usersRes.data.data);
            // Store districts and facilities separately for reliable access
            setDistricts(refRes.data.data?.districts ?? []);
            setFacilities(refRes.data.data?.facilities ?? []);
        } catch (err) {
            console.error('Failed to load users page data:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditUser(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setSuccessMsg('');
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditUser(user);
        setForm({
            name:        user.name        ?? '',
            email:       user.email       ?? '',
            password:    '',
            role:        user.role        ?? 'facility_user',
            facility_id: user.facility?.id ?? user.facility_id ?? '',
            district_id: user.district?.id ?? user.district_id ?? '',
        });
        setErrors({});
        setSuccessMsg('');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        setSuccessMsg('');

        // Build clean payload
        const payload = {
            name:  form.name.trim(),
            email: form.email.trim(),
            role:  form.role,
        };

        // Only include password if filled
        if (form.password.trim()) {
            payload.password = form.password;
        }

        // Assign facility or district based on role
        if (form.role === 'facility_user' && form.facility_id) {
            payload.facility_id = parseInt(form.facility_id);
        }
        if (form.role === 'district_user' && form.district_id) {
            payload.district_id = parseInt(form.district_id);
        }

        try {
            if (editUser) {
                await usersAPI.update(editUser.id, payload);
                setSuccessMsg('User updated successfully.');
            } else {
                // Password is required for new users
                if (!form.password.trim()) {
                    setErrors({ password: ['Password is required for new users.'] });
                    setSaving(false);
                    return;
                }
                await usersAPI.create(payload);
                setSuccessMsg('User created successfully.');
            }
            await loadAll();
            setTimeout(() => {
                setShowModal(false);
                setSuccessMsg('');
            }, 1200);
        } catch (err) {
            console.error('Save user error:', err.response?.data);
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message });
            } else {
                setErrors({ general: `Save failed (HTTP ${err.response?.status ?? 'unknown'}). Check console.` });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (user) => {
        if (!confirm(`${user.is_active ? 'Deactivate' : 'Activate'} ${user.name}?`)) return;
        try {
            await usersAPI.toggleActive(user.id);
            await loadAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update user status.');
        }
    };

    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    };

    const errMsg = (name) => errors[name] && (
        <p className="text-xs text-red-600 mt-1">
            {Array.isArray(errors[name]) ? errors[name][0] : errors[name]}
        </p>
    );

    const inputClass = (name) =>
        `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            errors[name] ? 'border-red-400 bg-red-50' : 'border-slate-300'
        }`;

    const roleColor = {
        provincial_admin: 'bg-purple-100 text-purple-800',
        district_user:    'bg-blue-100 text-blue-800',
        facility_user:    'bg-green-100 text-green-800',
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="User Management"
                subtitle="Manage system users and their access levels"
                actions={<Button onClick={openCreate}>+ Add User</Button>}
            />

            <Card>
                {loading ? (
                    <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-wide bg-slate-50 text-left">
                                    <th className="px-3 py-3">Name</th>
                                    <th className="px-3 py-3">Email</th>
                                    <th className="px-3 py-3">Role</th>
                                    <th className="px-3 py-3">Facility</th>
                                    <th className="px-3 py-3">District</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(user => (
                                    <tr
                                        key={user.id}
                                        className={`hover:bg-slate-50 ${!user.is_active ? 'opacity-50' : ''}`}
                                    >
                                        <td className="px-3 py-2.5 font-medium text-slate-800">{user.name}</td>
                                        <td className="px-3 py-2.5 text-slate-500">{user.email}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[user.role] ?? 'bg-slate-100 text-slate-600'}`}>
                                                {user.role?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-500 text-xs">
                                            {user.facility?.name ?? '—'}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-500 text-xs">
                                            {user.district?.name ?? '—'}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={`text-xs font-medium ${user.is_active ? 'text-green-600' : 'text-red-500'}`}>
                                                {user.is_active ? '● Active' : '● Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit(user)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <span className="text-slate-300">·</span>
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    className={`text-xs hover:underline ${user.is_active ? 'text-red-500' : 'text-green-600'}`}
                                                >
                                                    {user.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* ── MODAL ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
                            <h2 className="font-bold text-slate-800">
                                {editUser ? `Edit — ${editUser.name}` : 'Create New User'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">

                            {/* General error */}
                            {errors.general && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                                    ⚠️ {errors.general}
                                </div>
                            )}

                            {/* Success */}
                            {successMsg && (
                                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm">
                                    ✅ {successMsg}
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="label">Full Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                    className={inputClass('name')}
                                    placeholder="e.g. Thembinkosi Dube"
                                    required
                                />
                                {errMsg('name')}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="label">Email Address *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => set('email', e.target.value)}
                                    className={inputClass('email')}
                                    placeholder="user@matsouth.gov.zw"
                                    required
                                />
                                {errMsg('email')}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="label">
                                    Password {editUser ? '(leave blank to keep current)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={e => set('password', e.target.value)}
                                    className={inputClass('password')}
                                    placeholder="Minimum 8 characters"
                                    minLength={8}
                                    required={!editUser}
                                />
                                {errMsg('password')}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="label">Role *</label>
                                <select
                                    value={form.role}
                                    onChange={e => {
                                        set('role', e.target.value);
                                        // Clear scope fields when role changes
                                        set('facility_id', '');
                                        set('district_id', '');
                                    }}
                                    className={inputClass('role')}
                                    required
                                >
                                    {ROLES.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                                {errMsg('role')}
                            </div>

                            {/* Facility — shown for facility_user only */}
                            {form.role === 'facility_user' && (
                                <div>
                                    <label className="label">
                                        Facility *
                                        <span className="ml-1 text-slate-400 normal-case font-normal">
                                            ({facilities.length} available)
                                        </span>
                                    </label>
                                    <select
                                        value={form.facility_id}
                                        onChange={e => set('facility_id', e.target.value)}
                                        className={inputClass('facility_id')}
                                        required
                                    >
                                        <option value="">Select facility...</option>
                                        {facilities.map(f => (
                                            <option key={f.id} value={f.id}>
                                                {f.name} — {f.district?.name ?? ''}
                                            </option>
                                        ))}
                                    </select>
                                    {errMsg('facility_id')}
                                </div>
                            )}

                            {/* District — shown for district_user only */}
                            {form.role === 'district_user' && (
                                <div>
                                    <label className="label">
                                        District *
                                        <span className="ml-1 text-slate-400 normal-case font-normal">
                                            ({districts.length} available)
                                        </span>
                                    </label>
                                    <select
                                        value={form.district_id}
                                        onChange={e => set('district_id', e.target.value)}
                                        className={inputClass('district_id')}
                                        required
                                    >
                                        <option value="">Select district...</option>
                                        {districts.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errMsg('district_id')}
                                    {districts.length === 0 && (
                                        <p className="text-xs text-orange-600 mt-1">
                                            ⚠️ No districts loaded. Check your API connection.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Role hint */}
                            <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500">
                                {form.role === 'facility_user'    && '🏥 Facility User: can only view and manage posts for their assigned facility.'}
                                {form.role === 'district_user'    && '📍 District User: can view and manage posts across all facilities in their district.'}
                                {form.role === 'provincial_admin' && '🌍 Provincial Admin: full access to all districts, facilities, users and reports.'}
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : editUser ? '💾 Save Changes' : '✅ Create User'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.375rem;
                }
            `}</style>
        </div>
    );
}