import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { PageHeader, Card, Button } from '../components/ui';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron === true;

export default function SettingsPage() {
    const { user } = useAuth();

    // Server URL (Electron only)
    const [serverUrl, setServerUrl]   = useState('');
    const [urlSaved, setUrlSaved]     = useState('');

    // Password change
    const [passwords, setPasswords] = useState({
        current: '', newPass: '', confirm: '',
    });
    const [pwdMsg, setPwdMsg]     = useState('');
    const [pwdError, setPwdError] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);

    useEffect(() => {
        if (isElectron) {
            const saved = localStorage.getItem('server_url') || 'http://127.0.0.1:8000/api';
            setServerUrl(saved);
        }
    }, []);

    const saveServerUrl = () => {
        if (!serverUrl.trim()) return;
        localStorage.setItem('server_url', serverUrl.trim());
        setUrlSaved('✅ Server URL saved. Restart the app or refresh to apply.');
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwdMsg('');
        setPwdError('');

        if (passwords.newPass !== passwords.confirm) {
            setPwdError('New passwords do not match.');
            return;
        }
        if (passwords.newPass.length < 8) {
            setPwdError('Password must be at least 8 characters.');
            return;
        }

        setPwdLoading(true);
        try {
            // We use the update user endpoint via a direct API call
            // This requires the user to know their current password
            await authAPI.changePassword?.({
                current_password: passwords.current,
                password: passwords.newPass,
                password_confirmation: passwords.confirm,
            });
            setPwdMsg('✅ Password changed successfully.');
            setPasswords({ current: '', newPass: '', confirm: '' });
        } catch (err) {
            setPwdError(
                err.response?.data?.message ||
                'Failed to change password. Check your current password.'
            );
        } finally {
            setPwdLoading(false);
        }
    };

    const pwdField = (key, placeholder) => ({
        type: 'password',
        value: passwords[key],
        onChange: e => setPasswords(p => ({ ...p, [key]: e.target.value })),
        placeholder,
        className: 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400',
    });

    return (
        <div className="max-w-2xl space-y-5">
            <PageHeader
                title="Settings"
                subtitle="System configuration and account settings"
            />

            {/* Account Info */}
            <Card title="👤 Account Information">
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Name</span>
                        <span className="font-medium text-slate-800">{user?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Email</span>
                        <span className="font-medium text-slate-800">{user?.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Role</span>
                        <span className="font-medium text-slate-800 capitalize">
                            {user?.role?.replace('_', ' ')}
                        </span>
                    </div>
                    {user?.facility_id && (
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Facility ID</span>
                            <span className="font-medium text-slate-800">{user.facility_id}</span>
                        </div>
                    )}
                    {user?.district_id && (
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">District ID</span>
                            <span className="font-medium text-slate-800">{user.district_id}</span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Server URL — Electron only */}
            {isElectron && (
                <Card title="🌐 Server Connection">
                    <p className="text-xs text-slate-500 mb-3">
                        Configure the URL of the MatSouth Vacancy Tracker API server.
                        Use <code className="bg-slate-100 px-1 rounded">http://127.0.0.1:8000/api</code> for local,
                        or your deployed server URL for remote access.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={serverUrl}
                            onChange={e => setServerUrl(e.target.value)}
                            placeholder="http://127.0.0.1:8000/api"
                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <Button onClick={saveServerUrl}>Save</Button>
                    </div>
                    {urlSaved && (
                        <p className="text-xs text-green-600 mt-2">{urlSaved}</p>
                    )}
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                        <strong>Current:</strong> {localStorage.getItem('server_url') || 'http://127.0.0.1:8000/api'}
                    </div>
                </Card>
            )}

            {/* Web mode — server info */}
            {!isElectron && (
                <Card title="🌐 Connection Mode">
                    <p className="text-sm text-slate-600">
                        You are accessing this system via <strong>web browser</strong>.
                        The API server is the same server hosting this application.
                        No configuration is needed.
                    </p>
                    <div className="mt-3 p-3 bg-green-50 rounded-lg text-xs text-green-700">
                        ● Connected to server · Web browser mode
                    </div>
                </Card>
            )}

            {/* Change Password */}
            <Card title="🔒 Change Password">
                <form onSubmit={handlePasswordChange} className="space-y-3">
                    {pwdError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
                            ⚠️ {pwdError}
                        </div>
                    )}
                    {pwdMsg && (
                        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs">
                            {pwdMsg}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                            Current Password
                        </label>
                        <input {...pwdField('current', 'Your current password')} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                            New Password
                        </label>
                        <input {...pwdField('newPass', 'At least 8 characters')} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                            Confirm New Password
                        </label>
                        <input {...pwdField('confirm', 'Repeat new password')} required />
                    </div>
                    <Button type="submit" disabled={pwdLoading} className="mt-2">
                        {pwdLoading ? 'Changing...' : '🔒 Change Password'}
                    </Button>
                </form>
            </Card>

            {/* About */}
            <Card title="ℹ️ About">
                <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                        <span className="text-slate-500">System</span>
                        <span>MatSouth Vacancy Tracker</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Version</span>
                        <span>v1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Organisation</span>
                        <span>MOHCC · Mat South PHD</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Developer</span>
                        <span>IT Dept</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Mode</span>
                        <span>{isElectron ? '🖥️ Desktop (Electron)' : '🌐 Web Browser'}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}