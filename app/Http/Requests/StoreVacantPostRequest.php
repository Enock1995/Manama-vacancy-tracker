<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVacantPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Group 1: Facility
            'facility_id'                => 'required|exists:facilities,id',

            // Group 2: Post Identification
            'establishment_post_number'  => 'nullable|string|max:50',
            'cadre_id'                   => 'required|exists:cadres,id',
            'grade_scale'                => 'nullable|string|max:10',
            'department'                 => 'nullable|string|max:100',
            'post_category'              => 'required|in:Clinical,Paramedical,Nursing,Environmental Health,Administrative,Support Services',
            'is_essential_service'       => 'boolean',

            // Group 3: Vacancy Details
            'date_fell_vacant'           => 'required|date|before_or_equal:today',
            'reason_for_vacancy'         => 'required|in:Retirement,Resignation,Death,Transfer,Promotion,Dismissal,Study Leave,Secondment,New Post',
            'previous_incumbent_name'    => 'nullable|string|max:150',
            'patient_care_impact'        => 'required|in:Critical,Significant,Moderate,Minimal',

            // Group 4: Interim Arrangements
            'is_post_covered'            => 'required|in:Yes,No,Partially',
            'coverage_arrangement'       => 'nullable|in:Acting,Locum,Redistributed,Cross-posting,Unfilled',
            'person_covering_name'       => 'nullable|string|max:150',
            'locum_cost_per_month'       => 'nullable|numeric|min:0',
            'coverage_start_date'        => 'nullable|date',
            'is_coverage_sustainable'    => 'nullable|in:Yes,No,Short-term',

            // Group 5: MOHCC
            'date_submitted_to_mohcc'    => 'nullable|date',
            'mohcc_reference_number'     => 'nullable|string|max:50',
            'mohcc_approval_status'      => 'nullable|in:Pending,Approved,Deferred,Rejected',
            'date_mohcc_approval_received' => 'nullable|date',
            'mohcc_comments'             => 'nullable|string',

            // Group 6: TC
            'date_tc_requested'          => 'nullable|date',
            'tc_request_reference'       => 'nullable|string|max:50',
            'tc_granted'                 => 'boolean',
            'date_tc_granted'            => 'nullable|date',
            'tc_reference_number'        => 'nullable|string|max:50',
            'tc_expiry_date'             => 'nullable|date',
            'tc_utilised'                => 'boolean',
            'tc_status'                  => 'nullable|in:Pending,Granted,Utilized,Expired,Rejected,Deferred',

            // Group 7: Recruitment
            'requires_hpa_registration'  => 'boolean',
            'date_post_advertised'       => 'nullable|date',
            'advertisement_reference'    => 'nullable|string|max:50',
            'interviews_conducted'       => 'boolean',
            'date_interviews_held'       => 'nullable|date',
            'date_board_recommendation'  => 'nullable|date',
            'date_appointment_letter_issued' => 'nullable|date',
            'candidate_name'             => 'nullable|string|max:150',
            'expected_reporting_date'    => 'nullable|date',
            'actual_reporting_date'      => 'nullable|date',

            // Group 8: Status
            'overall_status'             => 'required|in:Vacant - No TC,TC Pending - MOHCC,TC Pending - MOF,TC Granted,TC Expired,Recruiting,Appointment Stage,Filled,Filled - Unconfirmed,Frozen,Abolished',
            'priority_level'             => 'required|in:1-Critical,2-High,3-Medium,4-Low',
            'next_action_required'       => 'nullable|string',
            'responsible_person_facility'=> 'nullable|string|max:150',
            'responsible_person_province'=> 'nullable|string|max:150',
            'follow_up_date'             => 'nullable|date',
            'comments'                   => 'nullable|string',
        ];
    }
}