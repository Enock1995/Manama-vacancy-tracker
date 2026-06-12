<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VacantPost;
use App\Models\District;
use App\Services\AlertService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = VacantPost::query();

        // Scope by role
        if ($user->hasRole('facility_user')) {
            $query->where('facility_id', $user->facility_id);
        } elseif ($user->hasRole('district_user')) {
            $query->where('district_id', $user->district_id);
        }

        $baseQuery = clone $query;

        // Summary counts
        $totalVacant     = (clone $baseQuery)->whereNotIn('overall_status', ['Filled', 'Abolished'])->count();
        $totalAllPosts   = (clone $baseQuery)->count();
        $criticalPosts   = (clone $baseQuery)->where('priority_level', '1-Critical')->whereNotIn('overall_status', ['Filled', 'Abolished'])->count();
        $uncoveredPosts  = (clone $baseQuery)->where('is_post_covered', 'No')->whereNotIn('overall_status', ['Filled', 'Abolished'])->count();
        $filledThisMonth = (clone $baseQuery)->where('overall_status', 'Filled')->whereMonth('updated_at', now()->month)->count();

        // TC alerts
        $tcExpiringSoon = (clone $baseQuery)
            ->whereNotNull('tc_expiry_date')
            ->where('tc_utilised', false)
            ->whereDate('tc_expiry_date', '>=', now())
            ->whereDate('tc_expiry_date', '<=', now()->addDays(30))
            ->count();

        $tcExpired = (clone $baseQuery)
            ->whereNotNull('tc_expiry_date')
            ->where('tc_utilised', false)
            ->whereDate('tc_expiry_date', '<', now())
            ->count();

        $overdueFollowUps = (clone $baseQuery)
            ->whereNotNull('follow_up_date')
            ->whereDate('follow_up_date', '<', now())
            ->whereNotIn('overall_status', ['Filled', 'Abolished'])
            ->count();

        // Status breakdown
        $statusBreakdown = (clone $baseQuery)
            ->select('overall_status', DB::raw('count(*) as count'))
            ->groupBy('overall_status')
            ->pluck('count', 'overall_status');

        // Priority breakdown
        $priorityBreakdown = (clone $baseQuery)
            ->whereNotIn('overall_status', ['Filled', 'Abolished'])
            ->select('priority_level', DB::raw('count(*) as count'))
            ->groupBy('priority_level')
            ->pluck('count', 'priority_level');

        // Vacancy trend — last 6 months
        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month   = Carbon::now()->subMonths($i);
            $trend[] = [
                'month' => $month->format('M Y'),
                'count' => (clone $baseQuery)
                    ->whereDate('date_fell_vacant', '<=', $month->endOfMonth())
                    ->whereNotIn('overall_status', ['Filled', 'Abolished'])
                    ->count(),
            ];
        }

        // District comparison (province admin only)
        $districtComparison = [];
        if ($user->hasRole('provincial_admin')) {
            $districtComparison = District::withCount([
                'vacantPosts as total_vacant' => fn($q) =>
                    $q->whereNotIn('overall_status', ['Filled', 'Abolished']),
                'vacantPosts as critical_count' => fn($q) =>
                    $q->where('priority_level', '1-Critical')
                      ->whereNotIn('overall_status', ['Filled', 'Abolished']),
            ])->get(['id', 'name']);
        }

        // Longest standing vacancies (top 5)
        $longestVacant = (clone $baseQuery)
            ->with(['facility:id,name', 'cadre:id,name'])
            ->whereNotIn('overall_status', ['Filled', 'Abolished'])
            ->orderBy('date_fell_vacant')
            ->limit(5)
            ->get(['id', 'facility_id', 'cadre_id', 'date_fell_vacant', 'overall_status', 'priority_level']);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard data retrieved',
            'data'    => [
                'summary' => [
                    'total_vacant'       => $totalVacant,
                    'total_all_posts'    => $totalAllPosts,
                    'critical_posts'     => $criticalPosts,
                    'uncovered_posts'    => $uncoveredPosts,
                    'filled_this_month'  => $filledThisMonth,
                    'tc_expiring_soon'   => $tcExpiringSoon,
                    'tc_expired'         => $tcExpired,
                    'overdue_follow_ups' => $overdueFollowUps,
                ],
                'status_breakdown'    => $statusBreakdown,
                'priority_breakdown'  => $priorityBreakdown,
                'vacancy_trend'       => $trend,
                'district_comparison' => $districtComparison,
                'longest_vacant'      => $longestVacant,
            ],
        ]);
    }

    /**
     * Get all active alerts for the authenticated user (role-scoped)
     */
    public function alerts(Request $request)
    {
        $user = $request->user();
        $role = $user->getRoleNames()->first();

        $alerts = AlertService::getAlerts(
            $user->id,
            $role,
            $user->facility_id,
            $user->district_id
        );

        return response()->json([
            'success' => true,
            'message' => count($alerts) . ' alert(s) found',
            'data'    => $alerts,
        ]);
    }
}