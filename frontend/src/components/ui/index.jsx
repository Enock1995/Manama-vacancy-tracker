// ─────────────────────────────────────────────
// frontend/src/components/ui/index.jsx
// Shared UI primitives for MatSouth Vacancy Tracker
// ─────────────────────────────────────────────

// ── Status Badge ─────────────────────────────
const STATUS_COLORS = {
    'Vacant - No TC':        'bg-red-100 text-red-800 border-red-200',
    'TC Pending - MOHCC':    'bg-orange-100 text-orange-800 border-orange-200',
    'TC Pending - MOF':      'bg-yellow-100 text-yellow-800 border-yellow-200',
    'TC Granted':            'bg-blue-100 text-blue-800 border-blue-200',
    'TC Expired':            'bg-red-200 text-red-900 border-red-300',
    'Recruiting':            'bg-purple-100 text-purple-800 border-purple-200',
    'Appointment Stage':     'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Filled':                'bg-green-100 text-green-800 border-green-200',
    'Filled - Unconfirmed':  'bg-green-50 text-green-700 border-green-200',
    'Frozen':                'bg-slate-100 text-slate-600 border-slate-200',
    'Abolished':             'bg-slate-200 text-slate-500 border-slate-300',
};

const PRIORITY_COLORS = {
    '1-Critical': 'bg-red-600 text-white',
    '2-High':     'bg-orange-500 text-white',
    '3-Medium':   'bg-yellow-500 text-white',
    '4-Low':      'bg-green-500 text-white',
};

export function StatusBadge({ status }) {
    const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 border-slate-200';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
            {status}
        </span>
    );
}

export function PriorityBadge({ priority }) {
    const cls = PRIORITY_COLORS[priority] || 'bg-slate-400 text-white';
    const label = priority?.replace(/^\d-/, '') || '';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${cls}`}>
            {label}
        </span>
    );
}

// ── Stat Card ────────────────────────────────
export function StatCard({ label, value, sub, color = 'blue', icon, alert }) {
    const colorMap = {
        blue:   'from-blue-600 to-blue-800',
        red:    'from-red-500 to-red-700',
        orange: 'from-orange-500 to-orange-700',
        green:  'from-green-500 to-green-700',
        purple: 'from-purple-500 to-purple-700',
        slate:  'from-slate-500 to-slate-700',
    };
    return (
        <div className={`relative bg-gradient-to-br ${colorMap[color]} rounded-xl p-5 text-white shadow-lg overflow-hidden`}>
            <div className="absolute top-3 right-3 text-2xl opacity-20">{icon}</div>
            {alert && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
            )}
            <p className="text-xs font-medium uppercase tracking-wider opacity-75 mb-1">{label}</p>
            <p className="text-4xl font-bold">{value}</p>
            {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
        </div>
    );
}

// ── Alert Banner ─────────────────────────────
export function AlertBanner({ type = 'warning', message, postId, onView }) {
    const styles = {
        danger:  'bg-red-50 border-red-300 text-red-800',
        warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
        info:    'bg-blue-50 border-blue-300 text-blue-800',
    };
    const icons = { danger: '🚨', warning: '⚠️', info: 'ℹ️' };
    return (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${styles[type]}`}>
            <span>{icons[type]} {message}</span>
            {postId && (
                <button
                    onClick={() => onView?.(postId)}
                    className="ml-3 text-xs underline font-medium shrink-0"
                >
                    View Post
                </button>
            )}
        </div>
    );
}

// ── Page Header ──────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

// ── Loading Spinner ───────────────────────────
export function Spinner({ size = 'md' }) {
    const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return (
        <div className={`${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
    );
}

// ── Empty State ───────────────────────────────
export function EmptyState({ icon = '📋', title, message }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="text-5xl mb-4">{icon}</span>
            <p className="font-semibold text-slate-600">{title}</p>
            {message && <p className="text-sm mt-1">{message}</p>}
        </div>
    );
}

// ── Section Card ─────────────────────────────
export function Card({ title, children, className = '' }) {
    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
            {title && (
                <div className="px-5 py-3.5 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
                </div>
            )}
            <div className="p-5">{children}</div>
        </div>
    );
}

// ── Button ────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', className = '' }) {
    const variants = {
        primary:   'bg-blue-700 hover:bg-blue-600 text-white',
        secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
        danger:    'bg-red-600 hover:bg-red-500 text-white',
        success:   'bg-green-600 hover:bg-green-500 text-white',
        outline:   'border border-slate-300 hover:bg-slate-50 text-slate-700',
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
    };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </button>
    );
}

// ── Detail Row (for post detail view) ────────
export function DetailRow({ label, value, highlight }) {
    return (
        <div className="flex py-2.5 border-b border-slate-100 last:border-0">
            <span className="w-48 shrink-0 text-xs font-medium text-slate-500 uppercase tracking-wide pt-0.5">
                {label}
            </span>
            <span className={`text-sm flex-1 ${highlight ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                {value ?? <span className="text-slate-300 italic">—</span>}
            </span>
        </div>
    );
}

// ── Section Divider ───────────────────────────
export function SectionDivider({ title }) {
    return (
        <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{title}</span>
            <div className="flex-1 h-px bg-slate-200" />
        </div>
    );
}