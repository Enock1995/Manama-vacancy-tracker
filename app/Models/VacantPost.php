<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class VacantPost extends Model
{
    protected $fillable = [
        'facility_id', 'district_id', 'establishment_post_number',
        'cadre_id', 'grade_scale', 'department', 'post_category', 'is_essential_service',
        'date_fell_vacant', 'reason_for_vacancy', 'previous_incumbent_name', 'patient_care_impact',
        'is_post_covered', 'coverage_arrangement', 'person_covering_name',
        'locum_cost_per_month', 'coverage_start_date', 'is_coverage_sustainable',
        'date_submitted_to_mohcc', 'mohcc_reference_number', 'mohcc_approval_status',
        'date_mohcc_approval_received', 'mohcc_comments',
        'date_tc_requested', 'tc_request_reference', 'tc_granted', 'date_tc_granted',
        'tc_reference_number', 'tc_expiry_date', 'tc_utilised', 'tc_status',
        'requires_hpa_registration', 'date_post_advertised', 'advertisement_reference',
        'interviews_conducted', 'date_interviews_held', 'date_board_recommendation',
        'date_appointment_letter_issued', 'candidate_name', 'expected_reporting_date',
        'actual_reporting_date',
        'overall_status', 'priority_level', 'next_action_required',
        'responsible_person_facility', 'responsible_person_province',
        'follow_up_date', 'comments', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'date_fell_vacant'              => 'date',
        'coverage_start_date'           => 'date',
        'date_submitted_to_mohcc'       => 'date',
        'date_mohcc_approval_received'  => 'date',
        'date_tc_requested'             => 'date',
        'date_tc_granted'               => 'date',
        'tc_expiry_date'                => 'date',
        'date_post_advertised'          => 'date',
        'date_interviews_held'          => 'date',
        'date_board_recommendation'     => 'date',
        'date_appointment_letter_issued'=> 'date',
        'expected_reporting_date'       => 'date',
        'actual_reporting_date'         => 'date',
        'follow_up_date'                => 'date',
        'is_essential_service'          => 'boolean',
        'tc_granted'                    => 'boolean',
        'tc_utilised'                   => 'boolean',
        'interviews_conducted'          => 'boolean',
        'requires_hpa_registration'     => 'boolean',
    ];

    // Auto-calculated: months vacant
    public function getVacancyDurationMonthsAttribute(): int
    {
        return (int) Carbon::parse($this->date_fell_vacant)->diffInMonths(now());
    }

    // Alert: TC expiring within 30 days
    public function getTcExpiringAttribute(): bool
    {
        if (!$this->tc_expiry_date || $this->tc_utilised) return false;
        return Carbon::now()->diffInDays($this->tc_expiry_date, false) <= 30
            && Carbon::now()->lte($this->tc_expiry_date);
    }

    // Alert: TC already expired
    public function getTcExpiredAlertAttribute(): bool
    {
        if (!$this->tc_expiry_date || $this->tc_utilised) return false;
        return Carbon::now()->gt($this->tc_expiry_date);
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }

    public function district()
    {
        return $this->belongsTo(District::class);
    }

    public function cadre()
    {
        return $this->belongsTo(Cadre::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'model');
    }
}