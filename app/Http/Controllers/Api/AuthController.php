<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ─────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Contact the provincial admin.',
                'data'    => null,
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data'    => [
                'token' => $token,
                'user'  => [
                    'id'          => $user->id,
                    'name'        => $user->name,
                    'email'       => $user->email,
                    'role'        => $user->getRoleNames()->first(),
                    'facility_id' => $user->facility_id,
                    'district_id' => $user->district_id,
                ],
            ],
        ]);
    }

    // ─────────────────────────────────────────────
    // LOGOUT
    // ─────────────────────────────────────────────
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
            'data'    => null,
        ]);
    }

    // ─────────────────────────────────────────────
    // ME — current authenticated user
    // ─────────────────────────────────────────────
    public function me(Request $request)
    {
        $user = $request->user()->load(['facility', 'district']);

        return response()->json([
            'success' => true,
            'message' => 'Authenticated user',
            'data'    => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'role'        => $user->getRoleNames()->first(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'facility'    => $user->facility,
                'district'    => $user->district,
                'facility_id' => $user->facility_id,
                'district_id' => $user->district_id,
            ],
        ]);
    }

    // ─────────────────────────────────────────────
    // CHANGE PASSWORD
    // ─────────────────────────────────────────────
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
                'data'    => null,
            ], 422);
        }

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        // Revoke all other tokens for security
        $request->user()->tokens()
            ->where('id', '!=', $request->user()->currentAccessToken()->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
            'data'    => null,
        ]);
    }
}