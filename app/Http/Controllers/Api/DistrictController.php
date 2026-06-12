<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\District;
use Illuminate\Http\Request;

class DistrictController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'message' => 'Districts retrieved',
            'data'    => District::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function show(int $id)
    {
        $district = District::with(['facilities'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'District retrieved',
            'data'    => $district,
        ]);
    }
}