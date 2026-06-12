<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // ─────────────────────────────────────────────
    // LIST ALL USERS
    // ─────────────────────────────────────────────
    public function index(Request $request)
    {
        $users = User::with(['facility', 'district'])
            ->get()
            ->map(function ($user) {
                return [
                    'id'          => $user->id,
                    'name'        => $user->name,
                    'email'       => $user->email,
                    'role'        => $user->getRoleNames()->first(),
                    'facility'    => $user->facility,
                    'district'    => $user->district,
                    'facility_id' => $user->facility_id,
                    'district_id' => $user->district_id,
                    'is_active'   => $user->is_active,
                    'created_at'  => $user->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Users retrieved',
            'data'    => $users,
        ]);
    }

    // ─────────────────────────────────────────────
    // CREATE USER
    // ─────────────────────────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:150',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|string|min:8',
            'role'        => 'required|in:facility_user,district_user,provincial_admin',
            'facility_id' => 'nullable|integer|exists:facilities,id',
            'district_id' => 'nullable|integer|exists:districts,id',
        ]);

        $user = User::create([
            'name'        => $request->name,
            'email'       => $request->email,
            'password'    => Hash::make($request->password),
            'facility_id' => $request->facility_id ?: null,
            'district_id' => $request->district_id ?: null,
            'is_active'   => true,
        ]);

        $user->assignRole($request->role);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data'    => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'role'        => $request->role,
                'facility_id' => $user->facility_id,
                'district_id' => $user->district_id,
                'is_active'   => $user->is_active,
            ],
        ], 201);
    }

    // ─────────────────────────────────────────────
    // UPDATE USER
    // ─────────────────────────────────────────────
    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name'        => 'sometimes|string|max:150',
            'email'       => "sometimes|email|unique:users,email,{$id}",
            'password'    => 'sometimes|nullable|string|min:8',
            'role'        => 'sometimes|in:facility_user,district_user,provincial_admin',
            'facility_id' => 'nullable|integer|exists:facilities,id',
            'district_id' => 'nullable|integer|exists:districts,id',
            'is_active'   => 'sometimes|boolean',
        ]);

        // Build update array manually — no tricky except() calls
        $updateData = [];

        if ($request->filled('name')) {
            $updateData['name'] = $request->name;
        }
        if ($request->filled('email')) {
            $updateData['email'] = $request->email;
        }
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }
        if ($request->has('facility_id')) {
            $updateData['facility_id'] = $request->facility_id ?: null;
        }
        if ($request->has('district_id')) {
            $updateData['district_id'] = $request->district_id ?: null;
        }
        if ($request->has('is_active')) {
            $updateData['is_active'] = $request->is_active;
        }

        if (!empty($updateData)) {
            $user->update($updateData);
        }

        if ($request->filled('role')) {
            $user->syncRoles([$request->role]);
        }

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data'    => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'role'        => $user->getRoleNames()->first(),
                'facility_id' => $user->facility_id,
                'district_id' => $user->district_id,
                'is_active'   => $user->is_active,
            ],
        ]);
    }

    // ─────────────────────────────────────────────
    // TOGGLE ACTIVE / INACTIVE
    // ─────────────────────────────────────────────
    public function toggleActive(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot deactivate your own account.',
                'data'    => null,
            ], 403);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'User activated successfully' : 'User deactivated successfully',
            'data'    => [
                'id'        => $user->id,
                'name'      => $user->name,
                'is_active' => $user->is_active,
            ],
        ]);
    }
}