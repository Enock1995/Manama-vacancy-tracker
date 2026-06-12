<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\FacilityController;
use App\Http\Controllers\Api\DistrictController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\ReportController;

// ─────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ─────────────────────────────────────────────
// PROTECTED — all authenticated users
// ─────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout',          [AuthController::class, 'logout']);
    Route::get('/me',               [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Reference data (dropdowns — all roles)
    Route::get('/reference', [ReferenceController::class, 'all']);

    // Dashboard
    Route::get('/dashboard',        [DashboardController::class, 'index']);
    Route::get('/dashboard/alerts', [DashboardController::class, 'alerts']);

    // Districts (read — all roles)
    Route::get('/districts',      [DistrictController::class, 'index']);
    Route::get('/districts/{id}', [DistrictController::class, 'show']);

    // Facilities (read — all roles)
    Route::get('/facilities',      [FacilityController::class, 'index']);
    Route::get('/facilities/{id}', [FacilityController::class, 'show']);

    // Vacant Posts
    Route::get('/posts',               [PostController::class, 'index']);
    Route::post('/posts',              [PostController::class, 'store']);
    Route::get('/posts/tc-expiring',   [PostController::class, 'tcExpiring']);
    Route::get('/posts/critical',      [PostController::class, 'criticalPosts']);
    Route::get('/posts/{id}',          [PostController::class, 'show']);
    Route::put('/posts/{id}',          [PostController::class, 'update']);
    Route::patch('/posts/{id}/status', [PostController::class, 'updateStatus']);
    Route::get('/posts/{id}/audit',    [PostController::class, 'auditHistory']);

    // Reports — Facility level (facility_user can only export their own)
    Route::get('/reports/facility/{facilityId}', [ReportController::class, 'facilityReport']);

    // Reports — District + Province level
    Route::middleware('role:district_user|provincial_admin')->group(function () {
        Route::get('/reports/district/{districtId}', [ReportController::class, 'districtReport']);
        Route::get('/reports/tc-status',             [ReportController::class, 'tcStatusReport']);
        Route::get('/reports/critical-posts',        [ReportController::class, 'criticalPostsReport']);
        Route::get('/reports/locum-cost',            [ReportController::class, 'locumCostReport']);
        Route::get('/reports/longest-vacancies',     [ReportController::class, 'longestVacancies']);
        Route::get('/reports/monthly-trend',         [ReportController::class, 'monthlyTrend']);
    });

    // Reports — Provincial Admin only
    Route::middleware('role:provincial_admin')->group(function () {
        Route::get('/reports/provincial-summary', [ReportController::class, 'provincialSummary']);
        Route::get('/reports/district-benchmark', [ReportController::class, 'districtBenchmark']);

        // Facility management (create/edit)
        Route::post('/facilities',     [FacilityController::class, 'store']);
        Route::put('/facilities/{id}', [FacilityController::class, 'update']);

        // User management
        Route::get('/users',                      [UserController::class, 'index']);
        Route::post('/users',                     [UserController::class, 'store']);
        Route::put('/users/{id}',                 [UserController::class, 'update']);
        Route::patch('/users/{id}/toggle-active', [UserController::class, 'toggleActive']);
    });
});