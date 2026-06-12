import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';
import {
    StatusBadge, PriorityBadge, PageHeader,
    Spinner, Button, Card, DetailRow, SectionDivider
} from '../components/ui';

const STATUSES = [
    'Vacant - No TC', 'TC Pending - MOHCC', 'TC Pending - MOF',
    'TC Granted', 'TC Expired', 'Recruiting', 'Appointment Stage',
    'Filled', 'Filled - Unconfirmed', 'Frozen', 'Abolished',
];

function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function monthsAgo(dateStr) {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24 * 30));
}

export default function PostDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isProvincialAdmin, isDistrictUser } = useAuth();

    const [post, setPost]           = useState(null);
    const [audit, setAudit]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [auditLoading, setAuditLoading] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [error, setError]         = useState('');

    // Status update state
    const [newStatus, setNewStatus]     = useState('');
    const [statusComment, setStatusComment] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusMsg, setStatusMsg]     = useState('');

    useEffect(() => {
        loadPost();
    }, [id]);

    const loadPost = async () => {
        setLoading(true);
        try {
            const res = await postsAPI.get(id);
            setPost(res.data.data);
            setNewStatus(res.data.data.overall_status);
        } catch {
            setError('Post not found or access denied.');
        } finally {
            setLoading(false);
        }
    };

    const loadAudit = async () => {
        setAuditLoading(true);
        try {
            const res = await postsAPI.getAuditHistory(id);
            setAudit(res.data.data);
            setShowAudit(true);
        } catch {
            setAudit([]);
        } finally {
            setAuditLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!newStatus || newStatus === post.overall_status) return;
        setStatusLoading(true);
        setStatusMsg('');
        try {
            await postsAPI.updateStatus(id, newStatus, statusComment);
            setStatusMsg('✅ Status updated successfully.');
            setStatusComment('');
            await loadPost();
        } catch {
            setStatusMsg('❌ Failed to update status.');
        } finally {
            setStatusLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
    }
    if (error) {
        return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>;
    }
    if (!post) return null;

    const months = monthsAgo(post.date_fell_vacant);
    const canEdit = isProvincialAdmin || isDistrictUser ||
        !['Filled', 'Abolished'].includes(post.overall_status);

    return (
        <div className="space-y-5 max-w-5xl">
            <PageHeader
                title={`${post.cadre?.name ?? 'Vacant Post'}`}
                subtitle={`${post.facility?.name ?? ''} · ${post.district?.name ?? ''}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/posts')}>
                            ← Back to Posts
                        </Button>
                        {canEdit && (
                            <Button onClick={() => navigate(`/posts/${id}/edit`)}>
                                ✏️ Edit Post
                            </Button>
                        )}
                    </div>
                }
            />

            {/* ── TOP SUMMARY STRIP ── */}
            <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Priority</span>
                    <PriorityBadge priority={post.priority_level} />
                </div>
                <div className="w-px bg-slate-300" />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status</span>
                    <StatusBadge status={post.overall_status} />
                </div>
                <div className="w-px bg-slate-300" />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Vacant for</span>
                    <span className={`text-sm font-bold ${
                        months >= 12 ? 'text-red-600' :
                        months >= 6  ? 'text-orange-500' : 'text-slate-700'
                    }`}>
                        {months} months
                    </span>
                </div>
                <div className="w-px bg-slate-300" />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Essential Post</span>
                    <span className={`text-xs font-bold ${post.is_essential_service ? 'text-red-600' : 'text-slate-400'}`}>
                        {post.is_essential_service ? '✅ YES' : 'No'}
                    </span>
                </div>
                <div className="w-px bg-slate-300" />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Covered</span>
                    <span className={`text-xs font-bold ${
                        post.is_post_covered === 'No' ? 'text-red-600' :
                        post.is_post_covered === 'Partially' ? 'text-orange-500' : 'text-green-600'
                    }`}>
                        {post.is_post_covered}
                    </span>
                </div>
                {post.tc_expiry_date && !post.tc_utilised && (
                    <>
                        <div className="w-px bg-slate-300" />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">TC Expires</span>
                            <span className="text-xs font-bold text-orange-600">
                                {fmt(post.tc_expiry_date)}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── MAIN DETAIL COLUMN ── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Group 1: Post Identity */}
                    <Card title="📋 Post Identification">
                        <DetailRow label="Establishment No."    value={post.establishment_post_number} />
                        <DetailRow label="Cadre / Designation"  value={post.cadre?.name} highlight />
                        <DetailRow label="Post Category"        value={post.post_category} />
                        <DetailRow label="Grade / Scale"        value={post.grade_scale} />
                        <DetailRow label="Department"           value={post.department} />
                        <DetailRow label="Facility"             value={post.facility?.name} highlight />
                        <DetailRow label="District"             value={post.district?.name} />
                        <DetailRow label="Facility Type"        value={post.facility?.facility_type} />
                        <DetailRow label="Patient Care Impact"  value={post.patient_care_impact} />
                    </Card>

                    {/* Group 2: Vacancy Details */}
                    <Card title="📅 Vacancy Details">
                        <DetailRow label="Date Fell Vacant"       value={fmt(post.date_fell_vacant)} highlight />
                        <DetailRow label="Months Vacant"          value={`${months} months`} />
                        <DetailRow label="Reason for Vacancy"     value={post.reason_for_vacancy} />
                        <DetailRow label="Previous Incumbent"     value={post.previous_incumbent_name} />
                    </Card>

                    {/* Group 3: Interim Arrangements */}
                    <Card title="🔄 Interim Arrangements">
                        <DetailRow label="Post Covered?"          value={post.is_post_covered} />
                        <DetailRow label="Coverage Type"          value={post.coverage_arrangement} />
                        <DetailRow label="Person Covering"        value={post.person_covering_name} />
                        <DetailRow label="Coverage Start Date"    value={fmt(post.coverage_start_date)} />
                        <DetailRow label="Sustainable?"           value={post.is_coverage_sustainable} />
                        {post.locum_cost_per_month && (
                            <DetailRow
                                label="Locum Cost/Month"
                                value={`USD ${Number(post.locum_cost_per_month).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                            />
                        )}
                    </Card>

                    {/* Group 4: MOHCC Channel */}
                    <Card title="🏛️ MOHCC Channel">
                        <DetailRow label="Date Submitted"        value={fmt(post.date_submitted_to_mohcc)} />
                        <DetailRow label="MOHCC Reference"       value={post.mohcc_reference_number} />
                        <DetailRow label="Approval Status"       value={post.mohcc_approval_status} />
                        <DetailRow label="Approval Received"     value={fmt(post.date_mohcc_approval_received)} />
                        <DetailRow label="MOHCC Comments"        value={post.mohcc_comments} />
                    </Card>

                    {/* Group 5: Treasury Concurrence */}
                    <Card title="💰 Treasury Concurrence (TC)">
                        <DetailRow label="Date TC Requested"     value={fmt(post.date_tc_requested)} />
                        <DetailRow label="Request Reference"     value={post.tc_request_reference} />
                        <DetailRow label="TC Granted?"           value={post.tc_granted ? 'YES' : 'No'} />
                        <DetailRow label="Date TC Granted"       value={fmt(post.date_tc_granted)} />
                        <DetailRow label="TC Reference Number"   value={post.tc_reference_number} />
                        <DetailRow label="TC Expiry Date"        value={fmt(post.tc_expiry_date)} highlight />
                        <DetailRow label="TC Utilised?"          value={post.tc_utilised ? 'YES' : 'No'} />
                        <DetailRow label="TC Status"             value={post.tc_status} />
                    </Card>

                    {/* Group 6: Recruitment */}
                    <Card title="👤 Recruitment Process">
                        <DetailRow label="Requires HPA Reg?"       value={post.requires_hpa_registration ? 'YES' : 'No'} />
                        <DetailRow label="Date Advertised"         value={fmt(post.date_post_advertised)} />
                        <DetailRow label="Advertisement Ref"       value={post.advertisement_reference} />
                        <DetailRow label="Interviews Done?"        value={post.interviews_conducted ? 'YES' : 'No'} />
                        <DetailRow label="Date Interviews Held"    value={fmt(post.date_interviews_held)} />
                        <DetailRow label="Board Recommendation"    value={fmt(post.date_board_recommendation)} />
                        <DetailRow label="Appointment Letter"      value={fmt(post.date_appointment_letter_issued)} />
                        <DetailRow label="Candidate Name"          value={post.candidate_name} />
                        <DetailRow label="Expected Reporting"      value={fmt(post.expected_reporting_date)} />
                        <DetailRow label="Actual Reporting"        value={fmt(post.actual_reporting_date)} />
                    </Card>
                </div>

                {/* ── SIDE COLUMN ── */}
                <div className="space-y-4">

                    {/* Status Update Panel */}
                    <Card title="🔄 Update Status">
                        <div className="space-y-3">
                            <select
                                value={newStatus}
                                onChange={e => setNewStatus(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            >
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <textarea
                                value={statusComment}
                                onChange={e => setStatusComment(e.target.value)}
                                placeholder="Add comment (optional)..."
                                rows={3}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
                            />
                            {statusMsg && (
                                <p className="text-xs">{statusMsg}</p>
                            )}
                            <Button
                                onClick={handleStatusUpdate}
                                disabled={statusLoading || newStatus === post.overall_status}
                                className="w-full justify-center"
                            >
                                {statusLoading ? 'Updating...' : 'Update Status'}
                            </Button>
                        </div>
                    </Card>

                    {/* Accountability */}
                    <Card title="📌 Accountability">
                        <DetailRow label="Overall Status"     value={<StatusBadge status={post.overall_status} />} />
                        <DetailRow label="Next Action"        value={post.next_action_required} />
                        <DetailRow label="Responsible (Fac)" value={post.responsible_person_facility} />
                        <DetailRow label="Responsible (Prov)"value={post.responsible_person_province} />
                        <DetailRow
                            label="Follow-up Date"
                            value={
                                <span className={
                                    post.follow_up_date && new Date(post.follow_up_date) < new Date()
                                        ? 'text-red-600 font-semibold'
                                        : ''
                                }>
                                    {fmt(post.follow_up_date)}
                                </span>
                            }
                        />
                        <DetailRow label="Comments" value={post.comments} />
                    </Card>

                    {/* Record Info */}
                    <Card title="🕒 Record Info">
                        <DetailRow label="Created By"    value={post.created_by?.name ?? `User #${post.created_by}`} />
                        <DetailRow label="Last Updated"  value={post.updated_by?.name ?? `User #${post.updated_by}`} />
                        <DetailRow label="Created At"    value={post.created_at ? new Date(post.created_at).toLocaleDateString('en-GB') : '—'} />
                        <DetailRow label="Updated At"    value={post.updated_at ? new Date(post.updated_at).toLocaleDateString('en-GB') : '—'} />
                    </Card>

                    {/* Audit History */}
                    <Card title="📜 Audit History">
                        {!showAudit ? (
                            <Button
                                variant="outline"
                                onClick={loadAudit}
                                disabled={auditLoading}
                                className="w-full justify-center"
                            >
                                {auditLoading ? 'Loading...' : 'Load Audit Trail'}
                            </Button>
                        ) : audit.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-2">No audit records found.</p>
                        ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {audit.map((log) => (
                                    <div key={log.id} className="text-xs border-l-2 border-blue-200 pl-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-700">
                                                {log.user?.name ?? 'System'}
                                            </span>
                                            <span className="text-slate-400">
                                                {new Date(log.created_at).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 mt-0.5">
                                            <span className="font-medium text-slate-600">{log.action}</span>
                                            {log.field_changed && (
                                                <>
                                                    {' '}· {log.field_changed}:{' '}
                                                    <span className="line-through text-red-400">{log.old_value || 'empty'}</span>
                                                    {' → '}
                                                    <span className="text-green-600">{log.new_value}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}