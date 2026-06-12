import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI, referenceAPI } from '../services/api';
import { PageHeader, Button, Card, Spinner } from '../components/ui';

const FIELD = (label, name, type = 'text', opts = {}) => ({ label, name, type, ...opts });

export default function NewPostPage() {
    const navigate = useNavigate();
    const { user, isFacilityUser } = useAuth();

    const [reference, setReference] = useState(null);
    const [loading, setLoading]     = useState(false);
    const [refLoading, setRefLoading] = useState(true);
    const [errors, setErrors]       = useState({});
    const [successMsg, setSuccessMsg] = useState('');

    const [form, setForm] = useState({
        // Group 1
        facility_id: isFacilityUser ? user?.facility_id : '',
        cadre_id: '', grade_scale: '', department: '',
        post_category: '', is_essential_service: false,
        establishment_post_number: '',
        // Group 2
        date_fell_vacant: '', reason_for_vacancy: '',
        previous_incumbent_name: '', patient_care_impact: '',
        // Group 3
        is_post_covered: 'No', coverage_arrangement: '',
        person_covering_name: '', locum_cost_per_month: '',
        coverage_start_date: '', is_coverage_sustainable: '',
        // Group 4
        date_submitted_to_mohcc: '', mohcc_reference_number: '',
        mohcc_approval_status: '', date_mohcc_approval_received: '',
        mohcc_comments: '',
        // Group 5
        date_tc_requested: '', tc_request_reference: '',
        tc_granted: false, date_tc_granted: '',
        tc_reference_number: '', tc_expiry_date: '',
        tc_utilised: false, tc_status: '',
        // Group 6
        requires_hpa_registration: false, date_post_advertised: '',
        advertisement_reference: '', interviews_conducted: false,
        date_interviews_held: '', date_board_recommendation: '',
        date_appointment_letter_issued: '', candidate_name: '',
        expected_reporting_date: '', actual_reporting_date: '',
        // Group 7
        overall_status: 'Vacant - No TC', priority_level: '',
        next_action_required: '', responsible_person_facility: '',
        responsible_person_province: '', follow_up_date: '', comments: '',
    });

    useEffect(() => {
        referenceAPI.getAll()
            .then(r => setReference(r.data.data))
            .finally(() => setRefLoading(false));
    }, []);

    const set = (key, value) => {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccessMsg('');

        // Build payload — remove empty strings, convert booleans
        const payload = {};
        Object.entries(form).forEach(([k, v]) => {
            if (v === '' || v === null) return;
            payload[k] = v;
        });

        try {
            const res = await postsAPI.create(payload);
            setSuccessMsg('Post created successfully!');
            setTimeout(() => navigate(`/posts/${res.data.data.id}`), 1200);
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: err.response?.data?.message || 'Failed to create post.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const field = (name) => ({
        value: form[name] ?? '',
        onChange: e => set(name, e.target.value),
        className: `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            errors[name] ? 'border-red-400 bg-red-50' : 'border-slate-300'
        }`,
    });

    const checkbox = (name) => ({
        type: 'checkbox',
        checked: !!form[name],
        onChange: e => set(name, e.target.checked),
        className: 'w-4 h-4 text-blue-600 rounded',
    });

    const errMsg = (name) => errors[name] && (
        <p className="text-xs text-red-600 mt-1">{Array.isArray(errors[name]) ? errors[name][0] : errors[name]}</p>
    );

    if (refLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

    return (
        <div className="max-w-4xl space-y-5">
            <PageHeader
                title="Register New Vacant Post"
                subtitle="Complete all sections applicable to this vacancy"
                actions={
                    <Button variant="outline" onClick={() => navigate('/posts')}>
                        ← Cancel
                    </Button>
                }
            />

            {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    ⚠️ {errors.general}
                </div>
            )}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                    ✅ {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── GROUP 1: POST IDENTIFICATION ── */}
                <Card title="📋 Group 1 — Post Identification">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Facility */}
                        {!isFacilityUser && (
                            <div>
                                <label className="label">Facility *</label>
                                <select {...field('facility_id')} required>
                                    <option value="">Select facility...</option>
                                    {reference?.facilities?.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} ({f.district?.name})
                                        </option>
                                    ))}
                                </select>
                                {errMsg('facility_id')}
                            </div>
                        )}

                        {/* Cadre */}
                        <div>
                            <label className="label">Cadre / Designation *</label>
                            <select {...field('cadre_id')} required>
                                <option value="">Select cadre...</option>
                                {reference?.cadres?.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.category})
                                    </option>
                                ))}
                            </select>
                            {errMsg('cadre_id')}
                        </div>

                        {/* Post Category */}
                        <div>
                            <label className="label">Post Category *</label>
                            <select {...field('post_category')} required>
                                <option value="">Select category...</option>
                                {reference?.post_categories?.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            {errMsg('post_category')}
                        </div>

                        {/* Grade Scale */}
                        <div>
                            <label className="label">Grade / Scale</label>
                            <input type="text" {...field('grade_scale')} placeholder="e.g. D3, C2" />
                            {errMsg('grade_scale')}
                        </div>

                        {/* Department */}
                        <div>
                            <label className="label">Department</label>
                            <select {...field('department')}>
                                <option value="">Select department...</option>
                                {reference?.departments?.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            {errMsg('department')}
                        </div>

                        {/* Establishment Post Number */}
                        <div>
                            <label className="label">Establishment Post Number</label>
                            <input type="text" {...field('establishment_post_number')} placeholder="e.g. GPH/NUR/001" />
                            {errMsg('establishment_post_number')}
                        </div>

                        {/* Essential Service */}
                        <div className="flex items-center gap-3 pt-5">
                            <input {...checkbox('is_essential_service')} id="essential" />
                            <label htmlFor="essential" className="text-sm font-medium text-slate-700">
                                This is an Essential Service Post
                            </label>
                        </div>
                    </div>
                </Card>

                {/* ── GROUP 2: VACANCY DETAILS ── */}
                <Card title="📅 Group 2 — Vacancy Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date Fell Vacant *</label>
                            <input type="date" {...field('date_fell_vacant')} required />
                            {errMsg('date_fell_vacant')}
                        </div>
                        <div>
                            <label className="label">Reason for Vacancy *</label>
                            <select {...field('reason_for_vacancy')} required>
                                <option value="">Select reason...</option>
                                {['Retirement','Resignation','Death','Transfer','Promotion',
                                  'Dismissal','Study Leave','Secondment','New Post'].map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            {errMsg('reason_for_vacancy')}
                        </div>
                        <div>
                            <label className="label">Previous Incumbent Name</label>
                            <input type="text" {...field('previous_incumbent_name')} placeholder="Full name" />
                            {errMsg('previous_incumbent_name')}
                        </div>
                        <div>
                            <label className="label">Patient Care Impact *</label>
                            <select {...field('patient_care_impact')} required>
                                <option value="">Select impact...</option>
                                {['Critical','Significant','Moderate','Minimal'].map(i => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                            {errMsg('patient_care_impact')}
                        </div>
                    </div>
                </Card>

                {/* ── GROUP 3: INTERIM ARRANGEMENTS ── */}
                <Card title="🔄 Group 3 — Interim Arrangements">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Is Post Covered? *</label>
                            <select {...field('is_post_covered')} required>
                                {['Yes','No','Partially'].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            {errMsg('is_post_covered')}
                        </div>
                        {form.is_post_covered !== 'No' && (
                            <>
                                <div>
                                    <label className="label">Coverage Arrangement</label>
                                    <select {...field('coverage_arrangement')}>
                                        <option value="">Select type...</option>
                                        {['Acting','Locum','Redistributed','Cross-posting','Unfilled'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                    {errMsg('coverage_arrangement')}
                                </div>
                                <div>
                                    <label className="label">Person Covering</label>
                                    <input type="text" {...field('person_covering_name')} placeholder="Full name" />
                                    {errMsg('person_covering_name')}
                                </div>
                                <div>
                                    <label className="label">Coverage Start Date</label>
                                    <input type="date" {...field('coverage_start_date')} />
                                    {errMsg('coverage_start_date')}
                                </div>
                                <div>
                                    <label className="label">Is Coverage Sustainable?</label>
                                    <select {...field('is_coverage_sustainable')}>
                                        <option value="">Select...</option>
                                        {['Yes','No','Short-term'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                    {errMsg('is_coverage_sustainable')}
                                </div>
                                {form.coverage_arrangement === 'Locum' && (
                                    <div>
                                        <label className="label">Locum Cost Per Month (USD)</label>
                                        <input type="number" {...field('locum_cost_per_month')} placeholder="0.00" min="0" step="0.01" />
                                        {errMsg('locum_cost_per_month')}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Card>

                {/* ── GROUP 4: MOHCC ── */}
                <Card title="🏛️ Group 4 — MOHCC Channel">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date Submitted to MOHCC</label>
                            <input type="date" {...field('date_submitted_to_mohcc')} />
                            {errMsg('date_submitted_to_mohcc')}
                        </div>
                        <div>
                            <label className="label">MOHCC Reference Number</label>
                            <input type="text" {...field('mohcc_reference_number')} placeholder="e.g. MOHCC/2024/001" />
                            {errMsg('mohcc_reference_number')}
                        </div>
                        <div>
                            <label className="label">MOHCC Approval Status</label>
                            <select {...field('mohcc_approval_status')}>
                                <option value="">Select...</option>
                                {['Pending','Approved','Deferred','Rejected'].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            {errMsg('mohcc_approval_status')}
                        </div>
                        <div>
                            <label className="label">Date MOHCC Approval Received</label>
                            <input type="date" {...field('date_mohcc_approval_received')} />
                            {errMsg('date_mohcc_approval_received')}
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">MOHCC Comments</label>
                            <textarea {...field('mohcc_comments')} rows={2} placeholder="Any comments from MOHCC..." className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none ${errors.mohcc_comments ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                            {errMsg('mohcc_comments')}
                        </div>
                    </div>
                </Card>

                {/* ── GROUP 5: TREASURY CONCURRENCE ── */}
                <Card title="💰 Group 5 — Treasury Concurrence (TC)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date TC Requested</label>
                            <input type="date" {...field('date_tc_requested')} />
                            {errMsg('date_tc_requested')}
                        </div>
                        <div>
                            <label className="label">TC Request Reference</label>
                            <input type="text" {...field('tc_request_reference')} placeholder="e.g. MOF/TC/2024/001" />
                            {errMsg('tc_request_reference')}
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <input {...checkbox('tc_granted')} id="tc_granted" />
                            <label htmlFor="tc_granted" className="text-sm font-medium text-slate-700">TC Granted</label>
                        </div>
                        {form.tc_granted && (
                            <>
                                <div>
                                    <label className="label">Date TC Granted</label>
                                    <input type="date" {...field('date_tc_granted')} />
                                    {errMsg('date_tc_granted')}
                                </div>
                                <div>
                                    <label className="label">TC Reference Number</label>
                                    <input type="text" {...field('tc_reference_number')} placeholder="TC reference" />
                                    {errMsg('tc_reference_number')}
                                </div>
                                <div>
                                    <label className="label">TC Expiry Date</label>
                                    <input type="date" {...field('tc_expiry_date')} />
                                    {errMsg('tc_expiry_date')}
                                </div>
                            </>
                        )}
                        <div>
                            <label className="label">TC Status</label>
                            <select {...field('tc_status')}>
                                <option value="">Select...</option>
                                {['Pending','Granted','Utilized','Expired','Rejected','Deferred'].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            {errMsg('tc_status')}
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <input {...checkbox('tc_utilised')} id="tc_utilised" />
                            <label htmlFor="tc_utilised" className="text-sm font-medium text-slate-700">TC Utilised</label>
                        </div>
                    </div>
                </Card>

                {/* ── GROUP 6: RECRUITMENT ── */}
                <Card title="👤 Group 6 — Recruitment Process">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 pt-1">
                            <input {...checkbox('requires_hpa_registration')} id="hpa" />
                            <label htmlFor="hpa" className="text-sm font-medium text-slate-700">Requires HPA Registration</label>
                        </div>
                        <div>
                            <label className="label">Date Post Advertised</label>
                            <input type="date" {...field('date_post_advertised')} />
                            {errMsg('date_post_advertised')}
                        </div>
                        <div>
                            <label className="label">Advertisement Reference</label>
                            <input type="text" {...field('advertisement_reference')} placeholder="e.g. Sunday Mail 14 Jan 2024" />
                            {errMsg('advertisement_reference')}
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <input {...checkbox('interviews_conducted')} id="interviews" />
                            <label htmlFor="interviews" className="text-sm font-medium text-slate-700">Interviews Conducted</label>
                        </div>
                        {form.interviews_conducted && (
                            <>
                                <div>
                                    <label className="label">Date Interviews Held</label>
                                    <input type="date" {...field('date_interviews_held')} />
                                    {errMsg('date_interviews_held')}
                                </div>
                                <div>
                                    <label className="label">Board Recommendation Date</label>
                                    <input type="date" {...field('date_board_recommendation')} />
                                    {errMsg('date_board_recommendation')}
                                </div>
                                <div>
                                    <label className="label">Appointment Letter Date</label>
                                    <input type="date" {...field('date_appointment_letter_issued')} />
                                    {errMsg('date_appointment_letter_issued')}
                                </div>
                                <div>
                                    <label className="label">Candidate Name</label>
                                    <input type="text" {...field('candidate_name')} placeholder="Full name of selected candidate" />
                                    {errMsg('candidate_name')}
                                </div>
                                <div>
                                    <label className="label">Expected Reporting Date</label>
                                    <input type="date" {...field('expected_reporting_date')} />
                                    {errMsg('expected_reporting_date')}
                                </div>
                                <div>
                                    <label className="label">Actual Reporting Date</label>
                                    <input type="date" {...field('actual_reporting_date')} />
                                    {errMsg('actual_reporting_date')}
                                </div>
                            </>
                        )}
                    </div>
                </Card>

                {/* ── GROUP 7: STATUS & ACCOUNTABILITY ── */}
                <Card title="📌 Group 7 — Status & Accountability">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Overall Status *</label>
                            <select {...field('overall_status')} required>
                                {reference?.statuses?.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            {errMsg('overall_status')}
                        </div>
                        <div>
                            <label className="label">Follow-up Date</label>
                            <input type="date" {...field('follow_up_date')} />
                            {errMsg('follow_up_date')}
                        </div>
                        <div>
                            <label className="label">Responsible Person (Facility)</label>
                            <input type="text" {...field('responsible_person_facility')} placeholder="Name of responsible person" />
                            {errMsg('responsible_person_facility')}
                        </div>
                        <div>
                            <label className="label">Responsible Person (Province)</label>
                            <input type="text" {...field('responsible_person_province')} placeholder="Name of responsible person" />
                            {errMsg('responsible_person_province')}
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Next Action Required</label>
                            <textarea
                                {...field('next_action_required')}
                                rows={2}
                                placeholder="What needs to happen next and by when..."
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none ${errors.next_action_required ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                            />
                            {errMsg('next_action_required')}
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Comments / Notes</label>
                            <textarea
                                {...field('comments')}
                                rows={3}
                                placeholder="Any additional notes about this vacancy..."
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none ${errors.comments ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                            />
                            {errMsg('comments')}
                        </div>
                    </div>
                </Card>

                {/* ── SUBMIT ── */}
                <div className="flex justify-end gap-3 pb-8">
                    <Button variant="outline" onClick={() => navigate('/posts')} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} variant="primary">
                        {loading ? 'Saving...' : '✅ Register Vacant Post'}
                    </Button>
                </div>
            </form>

            <style>{`.label { display: block; font-size: 0.75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem; }`}</style>
        </div>
    );
}