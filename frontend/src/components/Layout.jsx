import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
            ? 'bg-blue-700 text-white shadow-sm'
            : 'text-blue-100 hover:bg-blue-800 hover:text-white'
    }`;

export default function Layout() {
    const { user, logout, isProvincialAdmin, isDistrictUser, canExportReports } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const roleLabel = {
        provincial_admin: 'Provincial Admin',
        district_user:    'District User',
        facility_user:    'Facility User',
    }[user?.role] ?? user?.role;

    return (
        <div className="min-h-screen flex bg-slate-100">

            {/* ── SIDEBAR ── */}
            <aside className="w-56 bg-blue-900 text-white flex flex-col shrink-0 shadow-xl">

                {/* Logo */}
                <div className="px-4 pt-5 pb-4 border-b border-blue-800">
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🏥</span>
                        <div>
                            <p className="font-bold text-sm leading-tight">MatSouth</p>
                            <p className="text-xs text-blue-300 leading-tight">Vacancy Tracker</p>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="px-4 py-3 border-b border-blue-800">
                    <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-blue-300 truncate">{roleLabel}</p>
                    {user?.facility_id && (
                        <p className="text-xs text-blue-400 truncate mt-0.5">Facility #{user.facility_id}</p>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    <NavLink to="/dashboard"  className={navLinkClass}>
                        <span>📊</span> Dashboard
                    </NavLink>
                    <NavLink to="/posts"       className={navLinkClass}>
                        <span>📋</span> Vacant Posts
                    </NavLink>
                    {canExportReports && (
                        <NavLink to="/reports" className={navLinkClass}>
                            <span>📁</span> Reports
                        </NavLink>
                    )}
                    <NavLink to="/facilities"  className={navLinkClass}>
                        <span>🏨</span> Facilities
                    </NavLink>
                    {isProvincialAdmin && (
                        <NavLink to="/users"   className={navLinkClass}>
                            <span>👥</span> Users
                        </NavLink>
                    )}

                    <div className="pt-3 mt-3 border-t border-blue-800">
                        <NavLink to="/settings" className={navLinkClass}>
                            <span>⚙️</span> Settings
                        </NavLink>
                    </div>
                </nav>

                {/* Footer */}
                <div className="px-3 pb-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-red-600 hover:text-white transition-colors"
                    >
                        <span>🚪</span> Logout
                    </button>
                    <p className="text-xs text-blue-600 text-center mt-3">
                        MOHCC · Mat South PHD
                    </p>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top bar */}
                <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-slate-700">
                            Matabeleland South Province · Health Directorate
                        </p>
                        <p className="text-xs text-slate-400">
                            {new Date().toLocaleDateString('en-GB', {
                                weekday: 'long', day: 'numeric',
                                month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                            MOHCC Vacancy Tracking System v1.0
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-slate-100 px-6 py-2 text-xs text-slate-400 text-center shrink-0">
                    Sir Enocks Cor Technologies · MatSouth Vacancy Tracker v1.0.0 · MOHCC Matabeleland South PHD
                </footer>
            </div>
        </div>
    );
}