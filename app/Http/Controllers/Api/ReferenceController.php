<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cadre;
use App\Models\District;
use App\Models\Facility;

class ReferenceController extends Controller
{
    public function all()
    {
        $districts  = District::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']);
        $facilities = Facility::with('district:id,name')
                        ->where('is_active', true)
                        ->orderBy('name')
                        ->get(['id', 'name', 'code', 'district_id', 'facility_type', 'ownership', 'level_of_care']);
        $cadres     = Cadre::where('is_active', true)->orderBy('category')->orderBy('name')->get(['id', 'name', 'category']);

        return response()->json([
            'success' => true,
            'message' => 'Reference data retrieved',
            'data'    => [
                'districts'       => $districts,
                'facilities'      => $facilities,
                'cadres'          => $cadres,
                'statuses'        => [
                    'Vacant - No TC', 'TC Pending - MOHCC', 'TC Pending - MOF',
                    'TC Granted', 'TC Expired', 'Recruiting', 'Appointment Stage',
                    'Filled', 'Filled - Unconfirmed', 'Frozen', 'Abolished',
                ],
                'priority_levels' => ['1-Critical', '2-High', '3-Medium', '4-Low'],
                'post_categories' => [
                    'Clinical', 'Paramedical', 'Nursing',
                    'Environmental Health', 'Administrative', 'Support Services',
                ],
                'facility_types'  => [
                    'Provincial Hospital', 'District Hospital', 'Rural Health Centre',
                    'Clinic', 'Mission Hospital', 'Urban Council Facility',
                ],
                'departments'     => [
                    'OPD', 'Maternity', 'Paediatrics', 'Theatre', 'Casualty',
                    'Laboratory', 'Pharmacy', 'Radiology', 'Administration',
                    'EPI', 'Environmental Health', 'Dental', 'Nutrition',
                ],
            ],
        ]);
    }
}