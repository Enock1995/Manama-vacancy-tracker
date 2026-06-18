<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Return all users with role, district, and facility info.
     */
    public function index()
    {
        $users = User::with(['roles', 'district', 'facility'])
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'email'       => $u->email,
                'role'        => $u->getRoleNames()->first(),
                'district_id' => $u->district_id,
                'facility_id' => $u->facility_id,
                'district'    => $u->district ? ['id' => $u->district->id, 'name' => $u->district->name] : null,
                'facility'    => $u->facility ? ['id' => $u->facility->id, 'name' => $u->facility->name] : null,
                'is_active'   => (bool) $u->is_active,
                'created_at'  => $u->created_at?->toDateString(),
            ]);

        return response()->json(['data' => $users]);
    }

    /**
     * Create a new user.
     * Builds payload manually — never uses $request->except() or $request->all()
     * to avoid mass-assignment exceptions on unguarded fields.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email',
            'password'    => ['required', Password::min(8)],
            'role'        => 'required|in:facility_user,district_user,provincial_admin',
            'district_id' => 'nullable|integer|exists:districts,id',
            'facility_id' => 'nullable|integer|exists:facilities,id',
        ]);

        // Only set district/facility where the role requires them
        $districtId = null;
        $facilityId = null;

        if (in_array($request->role, ['district_user', 'facility_user'])) {
            $districtId = $request->district_id ?: null;
        }
        if ($request->role === 'facility_user') {
            $facilityId = $request->facility_id ?: null;
        }

        $user = User::create([
            'name'        => $request->name,
            'email'       => $request->email,
            'password'    => Hash::make($request->password),
            'district_id' => $districtId,
            'facility_id' => $facilityId,
            'is_active'   => true,
        ]);

        $user->assignRole($request->role);

        return response()->json([
            'message' => 'User created successfully.',
            'data' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $request->role,
            ],
        ], 201);
    }

    /**
     * Update an existing user.
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email,' . $user->id,
            'password'    => ['nullable', Password::min(8)],
            'role'        => 'required|in:facility_user,district_user,provincial_admin',
            'district_id' => 'nullable|integer|exists:districts,id',
            'facility_id' => 'nullable|integer|exists:facilities,id',
            'is_active'   => 'nullable|boolean',
        ]);

        $districtId = null;
        $facilityId = null;

        if (in_array($request->role, ['district_user', 'facility_user'])) {
            $districtId = $request->district_id ?: null;
        }
        if ($request->role === 'facility_user') {
            $facilityId = $request->facility_id ?: null;
        }

        $data = [
            'name'        => $request->name,
            'email'       => $request->email,
            'district_id' => $districtId,
            'facility_id' => $facilityId,
            'is_active'   => $request->has('is_active') ? (bool) $request->is_active : $user->is_active,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);
        $user->syncRoles([$request->role]);

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $request->role,
            ],
        ]);
    }

    /**
     * Toggle a user's active status.
     */
    public function toggleActive(User $user)
    {
        $user->update(['is_active' => ! $user->is_active]);

        return response()->json([
            'message'   => $user->is_active ? 'User activated.' : 'User deactivated.',
            'is_active' => (bool) $user->is_active,
        ]);
    }
}