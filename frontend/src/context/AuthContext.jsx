import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser]       = useState(null);
    const [token, setToken]     = useState(null);
    const [loading, setLoading] = useState(true);

    // ── Restore session on app load ──────────────────────
    useEffect(() => {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser  = localStorage.getItem('auth_user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    // ── Login ────────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        const res  = await authAPI.login(email, password);
        const data = res.data.data;

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);

        return data;
    }, []);

    // ── Logout ───────────────────────────────────────────
    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch (_) {
            // Ignore if server unreachable
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
    }, []);

    // ── Role helpers ─────────────────────────────────────
    const isProvincialAdmin = user?.role === 'provincial_admin';
    const isDistrictUser    = user?.role === 'district_user';
    const isFacilityUser    = user?.role === 'facility_user';

    const canEditAllPosts   = isProvincialAdmin;
    const canViewAllPosts   = isProvincialAdmin;
    const canManageUsers    = isProvincialAdmin;
    const canExportReports  = isProvincialAdmin || isDistrictUser;

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            logout,
            isProvincialAdmin,
            isDistrictUser,
            isFacilityUser,
            canEditAllPosts,
            canViewAllPosts,
            canManageUsers,
            canExportReports,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
