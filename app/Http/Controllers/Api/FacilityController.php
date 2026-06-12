<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\District;
use Illuminate\Http\Request;

class FacilityController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Facility::with('district')->where('is_active', true);

        if ($user->hasRole('facility_user')) {
            $query->where('id', $user->facility_id);
        } elseif ($user->hasRole('district_user')) {
            $query->where('district_id', $user->district_id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Facilities retrieved',
            'data'    => $query->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'district_id'   => 'required|exists:districts,id',
            'name'          => 'required|string|max:200',
            'code'          => 'required|string|max:20|unique:facilities,code',
            'facility_type' => 'required|in:Provincial Hospital,District Hospital,Rural Health Centre,Clinic,Mission Hospital,Urban Council Facility',
            'ownership'     => 'required|in:MOHCC,Mission,RDC,Urban Council',
            'level_of_care' => 'required|in:Primary,Secondary,Tertiary',
        ]);

        $facility = Facility::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Facility created successfully',
            'data'    => $facility->load('district'),
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $facility = Facility::findOrFail($id);

        $request->validate([
            'name'          => 'sometimes|string|max:200',
            'facility_type' => 'sometimes|in:Provincial Hospital,District Hospital,Rural Health Centre,Clinic,Mission Hospital,Urban Council Facility',
            'ownership'     => 'sometimes|in:MOHCC,Mission,RDC,Urban Council',
            'level_of_care' => 'sometimes|in:Primary,Secondary,Tertiary',
            'is_active'     => 'boolean',
        ]);

        $facility->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Facility updated',
            'data'    => $facility->load('district'),
        ]);
    }

    public function show(int $id)
    {
        $facility = Facility::with(['district', 'vacantPosts'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Facility retrieved',
            'data'    => $facility,
        ]);
    }
}