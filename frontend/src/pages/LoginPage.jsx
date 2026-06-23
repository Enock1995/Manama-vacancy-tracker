import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login }   = useAuth();
    const navigate    = useNavigate();

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.errors?.email?.[0] ||
                'Login failed. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">

            {/* ── LEFT PANEL — Branding ── */}
            <div className="hidden lg:flex lg:w-1/2 bg-blue-900 flex-col items-center justify-center p-12 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute border border-white rounded-full"
                            style={{
                                width: `${(i + 1) * 150}px`,
                                height: `${(i + 1) * 150}px`,
                                top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 text-white text-center space-y-5">
                    <div className="text-7xl mb-2">🏥</div>
                    <h1 className="text-3xl font-bold leading-tight">
                        MatSouth Vacancy<br />Tracker
                    </h1>
                    <div className="w-16 h-1 bg-blue-400 mx-auto rounded" />
                    <p className="text-blue-200 text-sm max-w-xs leading-relaxed">
                        Health Establishment Vacancy Management System for
                        Matabeleland South Province
                    </p>
                    <div className="pt-4 space-y-2 text-xs text-blue-300">
                        <p>Ministry of Health and Child Care</p>
                        <p>Provincial Medical Directorate</p>
                        <p>Zimbabwe</p>
                    </div>
                </div>

                <div className="absolute bottom-6 text-xs text-blue-600">
                    IT Dept · v1.0.0
                </div>
            </div>

            {/* ── RIGHT PANEL — Login Form ── */}
            <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
                <div className="w-full max-w-sm">

                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="text-5xl mb-2">🏥</div>
                        <h1 className="text-xl font-bold text-slate-800">MatSouth Vacancy Tracker</h1>
                        <p className="text-slate-500 text-xs mt-1">MOHCC · Matabeleland South</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Sign In</h2>
                        <p className="text-slate-500 text-sm mb-6">
                            Use your MOHCC credentials to access the system.
                        </p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    placeholder="you@matsouth.gov.zw"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow pr-10"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                    >
                                        {showPass ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-800 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In →'
                                )}
                            </button>
                        </form>

                        <p className="text-center text-xs text-slate-400 mt-6">
                            Contact your system administrator if you cannot log in.
                        </p>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-4">
                        MOHCC · Provincial Medical Directorate · Matabeleland South
                    </p>
                </div>
            </div>
        </div>
    );
}