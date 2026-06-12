import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import PostsPage         from './pages/PostsPage';
import PostDetailPage    from './pages/PostDetailPage';
import NewPostPage       from './pages/NewPostPage';
import EditPostPage      from './pages/EditPostPage';
import ReportsPage       from './pages/ReportsPage';
import FacilitiesPage    from './pages/FacilitiesPage';
import UsersPage         from './pages/UsersPage';
import SettingsPage      from './pages/SettingsPage';
import Layout            from './components/Layout';

// ─────────────────────────────────────────────
// PROTECTED ROUTE WRAPPER
// ─────────────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────
const AppRoutes = () => {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Public */}
            <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />

            {/* Protected */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"       element={<DashboardPage />} />
                <Route path="posts"           element={<PostsPage />} />
                <Route path="posts/new"       element={<NewPostPage />} />
                <Route path="posts/:id"       element={<PostDetailPage />} />
                <Route path="posts/:id/edit"  element={<EditPostPage />} />
                <Route path="reports"         element={<ReportsPage />} />
                <Route path="facilities"      element={<FacilitiesPage />} />
                <Route
                    path="users"
                    element={
                        <ProtectedRoute requiredRole="provincial_admin">
                            <UsersPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
