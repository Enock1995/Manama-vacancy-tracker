import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI, referenceAPI } from '../services/api';
import { PageHeader, Button, Card, Spinner } from '../components/ui';

export default function EditPostPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [reference, setReference]   = useState(null);
    const [loading, setLoading]       = useState(false);
    const [refLoading, setRefLoading] = useState(true);
    const [errors, setErrors]         = useState({});
    const [successMsg, setSuccessMsg] = useState('');
    const [form, setForm]             = useState(null);

    useEffect(() => {
        Promise.all([postsAPI.get(id), referenceAPI.getAll()])
            .then(([postRes, refRes]) => {
                const p = postRes.data.data;
                // Flatten dates to yyyy-mm-dd for input[type=date]
                const dateFields = [
                    'date_fell_vacant','coverage_start_date','date_submitted_to_mohcc',
                    'date_mohcc_approval_received','date_tc_requested','date_tc_granted',
                    'tc_expiry_date','date_post_advertised','date_interviews_held',
                    'date_board_recommendation','date_appointment_letter_issued',
                    'expected_reporting_date','actual_reporting_date','follow_up_date',
                ];
                const flat = { ...p };
                dateFields.forEach(f => {
                    if (flat[f]) flat[f] = flat[f].substring(0, 10);
                });
                // Replace nested objects with IDs
                flat.facility_id = p.facility?.id ?? p.facility_id;
                flat.cadre_id    = p.cadre?.id    ?? p.cadre_id;
                flat.district_id = p.district?.id ?? p.district_id;
                setForm(flat);
                setReference(refRes.data.data);
            })
            .catch(() => setErrors({ general: 'Failed to load post data.' }))
            .finally(() => setRefLoading(false));
    }, [id]);

    const set = (key, value) => {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccessMsg('');

        const payload = {};
        Object.entries(form).forEach(([k, v]) => {
            if (v === null || v === undefined) return;
            payload[k] = v;
        });

        try {
            await postsAPI.update(id, payload);
            setSuccessMsg('✅ Post updated successfully!');
            setTimeout(() => navigate(`/posts/${id}`), 1200);
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: err.response?.data?.message || 'Update failed.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const field = (name) => ({
        value: form?.[name] ?? '',
        onChange: e => set(name, e.target.value),
        className: `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            errors[name] ? 'border-red-400 bg-red-50' : 'border-slate-300'
        }`,
    });

    const checkbox = (name) => ({
        type: 'checkbox',
        checked: !!form?.[name],
        onChange: e => set(name, e.target.checked),
        className: 'w-4 h-4 text-blue-600 rounded',
    });

    const errMsg = (name) => errors[name] && (
        <p className="text-xs text-red-600 mt-1">
            {Array.isArray(errors[name]) ? errors[name][0] : errors[name]}
        </p>
    );

    if (refLoading || !form) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

    return (
        <div className="max-w-4xl space-y-5">
            <PageHeader
                title="Edit Vacant Post"
                subtitle={`Editing post #${id}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(`/posts/${id}`)}>
                            ← Cancel
                        </Button>
                    </div>
                }
            />

            {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    ⚠️ {errors.general}
                </div>
            )}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* GROUP 1 */}
                <Card title="📋 Post Identification">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Cadre / Designation</label>
                            <select {...field('cadre_id')}>
                                {reference?.cadres?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                                ))}
                            </select>
                            {errMsg('cadre_id')}
                        </div>
                        <div>
                            <label className="label">Post Category</label>
                            <select {...field('post_category')}>
                                {reference?.post_categories?.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            {errMsg('post_category')}
                        </div>
                        <div>
                            <label className="label">Grade / Scale</label>
                            <input type="text" {...field('grade_scale')} placeholder="e.g. D3" />
                            {errMsg('grade_scale')}
                        </div>
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
                        <div>
                            <label className="label">Establishment Post Number</label>
                            <input type="text" {...field('establishment_post_number')} />
                            {errMsg('establishment_post_number')}
                        </div>
                        <div className="flex items-center gap-3 pt-5">
                            <input {...checkbox('is_essential_service')} id="essential" />
                            <label htmlFor="essential" className="text-sm font-medium text-slate-700">Essential Service Post</label>
                        </div>
                    </div>
                </Card>

                {/* GROUP 2 */}
                <Card title="📅 Vacancy Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date Fell Vacant</label>
                            <input type="date" {...field('date_fell_vacant')} />
                            {errMsg('date_fell_vacant')}
                        </div>
                        <div>
                            <label className="label">Reason for Vacancy</label>
                            <select {...field('reason_for_vacancy')}>
                                {['Retirement','Resignation','Death','Transfer','Promotion',
                                  'Dismissal','Study Leave','Secondment','New Post'].map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            {errMsg('reason_for_vacancy')}
                        </div>
                        <div>
                            <label className="label">Previous Incumbent</label>
                            <input type="text" {...field('previous_incumbent_name')} />
                            {errMsg('previous_incumbent_name')}
                        </div>
                        <div>
                            <label className="label">Patient Care Impact</label>
                            <select {...field('patient_care_impact')}>
                                {['Critical','Significant','Moderate','Minimal'].map(i => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                            {errMsg('patient_care_impact')}
                        </div>
                    </div>
                </Card>

                {/* GROUP 3 */}
                <Card title="🔄 Interim Arrangements">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Is Post Covered?</label>
                            <select {...field('is_post_covered')}>
                                {['Yes','No','Partially'].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            {errMsg('is_post_covered')}
                        </div>
                        <div>
                            <label className="label">Coverage Arrangement</label>
                            <select {...field('coverage_arrangement')}>
                                <option value="">None</option>
                                {['Acting','Locum','Redistributed','Cross-posting','Unfilled'].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            {errMsg('coverage_arrangement')}
                        </div>
                        <div>
                            <label className="label">Person Covering</label>
                            <input type="text" {...field('person_covering_name')} />
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
                        <div>
                            <label className="label">Locum Cost/Month (USD)</label>
                            <input type="number" {...field('locum_cost_per_month')} min="0" step="0.01" />
                            {errMsg('locum_cost_per_month')}
                        </div>
                    </div>
                </Card>

                {/* GROUP 4 */}
                <Card title="🏛️ MOHCC Channel">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date Submitted to MOHCC</label>
                            <input type="date" {...field('date_submitted_to_mohcc')} />
                            {errMsg('date_submitted_to_mohcc')}
                        </div>
                        <div>
                            <label className="label">MOHCC Reference Number</label>
                            <input type="text" {...field('mohcc_reference_number')} />
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
                            <textarea {...field('mohcc_comments')} rows={2}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none ${errors.mohcc_comments ? 'border-red-400' : 'border-slate-300'}`}
                            />
                        </div>
                    </div>
                </Card>

                {/* GROUP 5 */}
                <Card title="💰 Treasury Concurrence (TC)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date TC Requested</label>
                            <input type="date" {...field('date_tc_requested')} />
                        </div>
                        <div>
                            <label className="label">TC Request Reference</label>
                            <input type="text" {...field('tc_request_reference')} />
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <input {...checkbox('tc_granted')} id="tc_granted" />
                            <label htmlFor="tc_granted" className="text-sm font-medium text-slate-700">TC Granted</label>
                        </div>
                        <div>
                            <label className="label">Date TC Granted</label>
                            <input type="date" {...field('date_tc_granted')} />
                        </div>
                        <div>
                            <label className="label">TC Reference Number</label>
                            <input type="text" {...field('tc_reference_number')} />
                        </div>
                        <div>
                            <label className="label">TC Expiry Date</label>
                            <input type="date" {...field('tc_expiry_date')} />
                        </div>
                        <div>
                            <label className="label">TC Status</label>
                            <select {...field('tc_status')}>
                                <option value="">Select...</option>
                                {['Pending','Granted','Utilized','Expired','Rejected','Deferred'].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <input {...checkbox('tc_utilised')} id="tc_utilised" />
                            <label htmlFor="tc_utilised" className="text-sm font-medium text-slate-700">TC Utilised</label>
                        </div>
                    </div>
                </Card>

                {/* GROUP 6 */}
                <Card title="👤 Recruitment Process">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date Post Advertised</label>
                            <input type="date" {...field('date_post_advertised')} />
                        </div>
                        <div>
                            <label className="label">Advertisement Reference</label>
                            <input type="text" {...field('advertisement_reference')} />
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <input {...checkbox('interviews_conducted')} id="interviews" />
                            <label htmlFor="interviews" className="text-sm font-medium text-slate-700">Interviews Conducted</label>
                        </div>
                        <div>
                            <label className="label">Date Interviews Held</label>
                            <input type="date" {...field('date_interviews_held')} />
                        </div>
                        <div>
                            <label className="label">Board Recommendation Date</label>
                            <input type="date" {...field('date_board_recommendation')} />
                        </div>
                        <div>
                            <label className="label">Appointment Letter Date</label>
                            <input type="date" {...field('date_appointment_letter_issued')} />
                        </div>
                        <div>
                            <label className="label">Candidate Name</label>
                            <input type="text" {...field('candidate_name')} />
                        </div>
                        <div>
                            <label className="label">Expected Reporting Date</label>
                            <input type="date" {...field('expected_reporting_date')} />
                        </div>
                        <div>
                            <label className="label">Actual Reporting Date</label>
                            <input type="date" {...field('actual_reporting_date')} />
                        </div>
                    </div>
                </Card>

                {/* GROUP 7 */}
                <Card title="📌 Status & Accountability">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Overall Status</label>
                            <select {...field('overall_status')}>
                                {reference?.statuses?.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            {errMsg('overall_status')}
                        </div>
                        <div>
                            <label className="label">Follow-up Date</label>
                            <input type="date" {...field('follow_up_date')} />
                        </div>
                        <div>
                            <label className="label">Responsible (Facility)</label>
                            <input type="text" {...field('responsible_person_facility')} />
                        </div>
                        <div>
                            <label className="label">Responsible (Province)</label>
                            <input type="text" {...field('responsible_person_province')} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Next Action Required</label>
                            <textarea {...field('next_action_required')} rows={2}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none ${errors.next_action_required ? 'border-red-400' : 'border-slate-300'}`}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Comments</label>
                            <textarea {...field('comments')} rows={3}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none ${errors.comments ? 'border-red-400' : 'border-slate-300'}`}
                            />
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-3 pb-8">
                    <Button variant="outline" onClick={() => navigate(`/posts/${id}`)} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : '💾 Save Changes'}
                    </Button>
                </div>
            </form>

            <style>{`.label { display: block; font-size: 0.75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem; }`}</style>
        </div>
    );
}