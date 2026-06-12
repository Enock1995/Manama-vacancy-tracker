<?php

namespace App\Services;

use App\Models\VacantPost;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class AlertService
{
    public static function getAlerts(int $userId, string $role, ?int $facilityId, ?int $districtId): array
    {
        $query = VacantPost::query();

        if ($role === 'facility_user') {
            $query->where('facility_id', $facilityId);
        } elseif ($role === 'district_user') {
            $query->where('district_id', $districtId);
        }

        $alerts = [];

        // 1. TC Expiring within 30 days
        $tcExpiring = (clone $query)
            ->whereNotNull('tc_expiry_date')
            ->where('tc_utilised', false)
            ->whereDate('tc_expiry_date', '>=', now())
            ->whereDate('tc_expiry_date', '<=', now()->addDays(30))
            ->with('facility:id,name')
            ->get(['id', 'facility_id', 'tc_expiry_date', 'overall_status']);

        foreach ($tcExpiring as $post) {
            $daysLeft = (int) now()->diffInDays($post->tc_expiry_date);
            $alerts[] = [
                'type'     => 'warning',
                'category' => 'TC_EXPIRING',
                'message'  => "TC expires in {$daysLeft} day(s) — {$post->facility->name}",
                'post_id'  => $post->id,
                'days'     => $daysLeft,
            ];
        }

        // 2. TC Already Expired (not yet marked)
        $tcExpired = (clone $query)
            ->whereNotNull('tc_expiry_date')
            ->where('tc_utilised', false)
            ->whereDate('tc_expiry_date', '<', now())
            ->whereNotIn('overall_status', ['TC Expired', 'Filled', 'Abolished'])
            ->with('facility:id,name')
            ->get(['id', 'facility_id', 'tc_expiry_date']);

        foreach ($tcExpired as $post) {
            $alerts[] = [
                'type'     => 'danger',
                'category' => 'TC_EXPIRED',
                'message'  => "TC has expired and was not utilised — {$post->facility->name}",
                'post_id'  => $post->id,
            ];
        }

        // 3. Essential post with NO cover
        $essentialUncovered = (clone $query)
            ->where('is_essential_service', true)
            ->where('is_post_covered', 'No')
            ->whereNotIn('overall_status', ['Filled', 'Abolished', 'Frozen'])
            ->with('facility:id,name', 'cadre:id,name')
            ->get(['id', 'facility_id', 'cadre_id', 'is_post_covered']);

        foreach ($essentialUncovered as $post) {
            $alerts[] = [
                'type'     => 'danger',
                'category' => 'ESSENTIAL_UNCOVERED',
                'message'  => "Essential post uncovered — {$post->cadre->name} at {$post->facility->name}",
                'post_id'  => $post->id,
            ];
        }

        // 4. Vacant over 12 months
        $longVacant = (clone $query)
            ->whereDate('date_fell_vacant', '<=', now()->subMonths(12))
            ->whereNotIn('overall_status', ['Filled', 'Abolished', 'Frozen'])
            ->with('facility:id,name', 'cadre:id,name')
            ->get(['id', 'facility_id', 'cadre_id', 'date_fell_vacant']);

        foreach ($longVacant as $post) {
            $months = (int) Carbon::parse($post->date_fell_vacant)->diffInMonths(now());
            $alerts[] = [
                'type'     => 'danger',
                'category' => 'LONG_VACANT',
                'message'  => "Vacant {$months} months — {$post->cadre->name} at {$post->facility->name}",
                'post_id'  => $post->id,
                'months'   => $months,
            ];
        }

        // 5. Overdue follow-up dates
        $overdueFollowUps = (clone $query)
            ->whereNotNull('follow_up_date')
            ->whereDate('follow_up_date', '<', now())
            ->whereNotIn('overall_status', ['Filled', 'Abolished'])
            ->with('facility:id,name', 'cadre:id,name')
            ->get(['id', 'facility_id', 'cadre_id', 'follow_up_date']);

        foreach ($overdueFollowUps as $post) {
            $daysOverdue = (int) Carbon::parse($post->follow_up_date)->diffInDays(now());
            $alerts[] = [
                'type'     => 'warning',
                'category' => 'OVERDUE_FOLLOWUP',
                'message'  => "Follow-up overdue by {$daysOverdue} day(s) — {$post->cadre->name} at {$post->facility->name}",
                'post_id'  => $post->id,
                'days_overdue' => $daysOverdue,
            ];
        }

        // Sort: danger first, then warning
        usort($alerts, fn($a, $b) => strcmp($b['type'], $a['type']));

        return $alerts;
    }

    /**
     * Auto-update TC status to Expired where applicable
     */
    public static function autoExpireTc(): int
    {
        return VacantPost::whereNotNull('tc_expiry_date')
            ->where('tc_utilised', false)
            ->whereDate('tc_expiry_date', '<', now())
            ->whereNotIn('overall_status', ['TC Expired', 'Filled', 'Abolished', 'Frozen'])
            ->update([
                'overall_status' => 'TC Expired',
                'tc_status'      => 'Expired',
            ]);
    }
}