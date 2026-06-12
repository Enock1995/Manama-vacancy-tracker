<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exports\ProvincialSummaryExport;
use App\Exports\DistrictReportExport;
use App\Exports\FacilityReportExport;
use App\Exports\TcStatusReportExport;
use App\Exports\LocumCostReportExport;
use App\Exports\CriticalPostsExport;
use App\Models\VacantPost;
use App\Models\District;
use App\Models\Facility;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Provincial Summary Report — all districts, all facilities
     * Access: provincial_admin only
     */
    public function provincialSummary(Request $request)
    {
        $filters  = $request->only(['district_id', 'status', 'priority', 'exclude_filled']);
        $filename = 'MatSouth_Provincial_Summary_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new ProvincialSummaryExport($filters), $filename);
    }

    /**
     * District Report — all facilities within a district
     * Access: provincial_admin, district_user (own district only)
     */
    public function districtReport(Request $request, int $districtId)
    {
        $user = $request->user();

        // District users can only export their own district
        if ($user->hasRole('district_user') && $user->district_id !== $districtId) {
            return response()->json([
                'success' => false,
                'message' => 'You can only export your own district report.',
                'data'    => null,
            ], 403);
        }

        $district = District::findOrFail($districtId);
        $filters  = $request->only(['status', 'priority', 'exclude_filled']);
        $filename = $district->name . '_Vacancy_Report_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new DistrictReportExport($districtId, $filters), $filename);
    }

    /**
     * Facility Report — own posts only
     * Access: all roles (facility_user sees own only)
     */
    public function facilityReport(Request $request, int $facilityId)
    {
        $user = $request->user();

        if ($user->hasRole('facility_user') && $user->facility_id !== $facilityId) {
            return response()->json([
                'success' => false,
                'message' => 'You can only export your own facility report.',
                'data'    => null,
            ], 403);
        }

        $facility = Facility::findOrFail($facilityId);
        $filters  = $request->only(['status', 'exclude_filled']);
        $filename = str_replace(' ', '_', $facility->name) . '_Report_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new FacilityReportExport($facilityId, $filters), $filename);
    }

    /**
     * TC Status Report — all TC records with expiry tracking
     * Access: provincial_admin, district_user
     */
    public function tcStatusReport(Request $request)
    {
        $user    = $request->user();
        $filters = $request->only(['tc_status', 'district_id']);

        // District users scoped to their district
        if ($user->hasRole('district_user')) {
            $filters['district_id'] = $user->district_id;
        }

        $filename = 'TC_Status_Report_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new TcStatusReportExport($filters), $filename);
    }

    /**
     * Critical Posts Report — Priority 1 only
     * Access: provincial_admin, district_user
     */
    public function criticalPostsReport(Request $request)
    {
        $user    = $request->user();
        $filters = $request->only(['district_id']);

        if ($user->hasRole('district_user')) {
            $filters['district_id'] = $user->district_id;
        }

        $filename = 'Critical_Posts_Report_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new CriticalPostsExport($filters), $filename);
    }

    /**
     * Locum Cost Analysis Report
     * Access: provincial_admin, district_user
     */
    public function locumCostReport(Request $request)
    {
        $user    = $request->user();
        $filters = $request->only(['district_id']);

        if ($user->hasRole('district_user')) {
            $filters['district_id'] = $user->district_id;
        }

        $filename = 'Locum_Cost_Analysis_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new LocumCostReportExport($filters), $filename);
    }

    /**
     * Longest Standing Vacancies Report (JSON — for display/further export)
     * Returns top vacancies ordered by date fell vacant ascending
     */
    public function longestVacancies(Request $request)
    {
        $user  = $request->user();
        $query = VacantPost::with(['facility', 'district', 'cadre'])
            ->whereNotIn('overall_status', ['Filled', 'Abolished', 'Frozen'])
            ->orderBy('date_fell_vacant');

        if ($user->hasRole('facility_user')) {
            $query->where('facility_id', $user->facility_id);
        } elseif ($user->hasRole('district_user')) {
            $query->where('district_id', $user->district_id);
        }

        $posts = $query->limit(50)->get()->map(function ($post) {
            return [
                'id'                     => $post->id,
                'facility'               => $post->facility->name ?? '',
                'district'               => $post->district->name ?? '',
                'cadre'                  => $post->cadre->name ?? '',
                'department'             => $post->department,
                'date_fell_vacant'       => $post->date_fell_vacant?->format('d/m/Y'),
                'months_vacant'          => Carbon::parse($post->date_fell_vacant)->diffInMonths(now()),
                'overall_status'         => $post->overall_status,
                'priority_level'         => $post->priority_level,
                'is_essential_service'   => $post->is_essential_service,
                'is_post_covered'        => $post->is_post_covered,
                'patient_care_impact'    => $post->patient_care_impact,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Longest standing vacancies retrieved',
            'data'    => $posts,
        ]);
    }

    /**
     * Monthly Trend Report (JSON)
     * Returns vacancy counts per month for the last 12 months
     */
    public function monthlyTrend(Request $request)
    {
        $user  = $request->user();
        $query = VacantPost::query();

        if ($user->hasRole('facility_user')) {
            $query->where('facility_id', $user->facility_id);
        } elseif ($user->hasRole('district_user')) {
            $query->where('district_id', $user->district_id);
        }

        $trend = [];
        for ($i = 11; $i >= 0; $i--) {
            $month   = Carbon::now()->subMonths($i);
            $trend[] = [
                'month'        => $month->format('M Y'),
                'year_month'   => $month->format('Y-m'),
                'total_vacant' => (clone $query)
                    ->whereDate('date_fell_vacant', '<=', $month->endOfMonth())
                    ->whereNotIn('overall_status', ['Filled', 'Abolished'])
                    ->count(),
                'newly_vacant' => (clone $query)
                    ->whereYear('date_fell_vacant', $month->year)
                    ->whereMonth('date_fell_vacant', $month->month)
                    ->count(),
                'filled'       => (clone $query)
                    ->where('overall_status', 'Filled')
                    ->whereYear('updated_at', $month->year)
                    ->whereMonth('updated_at', $month->month)
                    ->count(),
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Monthly trend retrieved',
            'data'    => $trend,
        ]);
    }

    /**
     * District Benchmarking Report (JSON — provincial admin only)
     */
    public function districtBenchmark(Request $request)
    {
        $districts = District::with(['facilities'])->get()->map(function ($district) {
            $posts = VacantPost::where('district_id', $district->id);

            $totalVacant   = (clone $posts)->whereNotIn('overall_status', ['Filled', 'Abolished'])->count();
            $totalFilled   = (clone $posts)->where('overall_status', 'Filled')->count();
            $critical      = (clone $posts)->where('priority_level', '1-Critical')->whereNotIn('overall_status', ['Filled', 'Abolished'])->count();
            $uncovered     = (clone $posts)->where('is_post_covered', 'No')->whereNotIn('overall_status', ['Filled', 'Abolished'])->count();
            $tcExpired     = (clone $posts)->where('tc_status', 'Expired')->count();
            $locumCost     = (clone $posts)->where('coverage_arrangement', 'Locum')->sum('locum_cost_per_month');

            // Average months to fill (posts that are filled)
            $filledPosts   = (clone $posts)->where('overall_status', 'Filled')->whereNotNull('actual_reporting_date')->get();
            $avgMonthsFill = $filledPosts->count() > 0
                ? round($filledPosts->avg(fn($p) => Carbon::parse($p->date_fell_vacant)->diffInMonths($p->actual_reporting_date)), 1)
                : null;

            return [
                'district'            => $district->name,
                'facilities_count'    => $district->facilities->count(),
                'total_vacant'        => $totalVacant,
                'total_filled'        => $totalFilled,
                'critical_posts'      => $critical,
                'uncovered_posts'     => $uncovered,
                'tc_expired_count'    => $tcExpired,
                'total_locum_cost'    => round($locumCost, 2),
                'avg_months_to_fill'  => $avgMonthsFill,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'District benchmarking data retrieved',
            'data'    => $districts,
        ]);
    }
}