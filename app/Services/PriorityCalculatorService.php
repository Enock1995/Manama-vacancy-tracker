<?php

namespace App\Services;

use Carbon\Carbon;

class PriorityCalculatorService
{
    // Departments that are always critical
    const CRITICAL_DEPARTMENTS = ['Theatre', 'Maternity', 'Casualty', 'ICU'];

    // Cadre names that are Priority 2 minimum
    const HIGH_PRIORITY_CADRES = [
        'Medical Officer', 'Senior Medical Officer', 'Specialist (General)',
        'Staff Nurse', 'Senior Staff Nurse', 'Clinical Officer', 'Senior Clinical Officer',
        'Pharmacist', 'Laboratory Scientist', 'Radiographer',
    ];

    public static function calculate(array $data): string
    {
        $monthsVacant    = isset($data['date_fell_vacant'])
            ? (int) Carbon::parse($data['date_fell_vacant'])->diffInMonths(now())
            : 0;
        $isEssential     = $data['is_essential_service'] ?? false;
        $isUncovered     = ($data['is_post_covered'] ?? 'No') === 'No';
        $department      = $data['department'] ?? '';
        $cadreId         = $data['cadre_id'] ?? null;
        $impact          = $data['patient_care_impact'] ?? 'Moderate';

        // PRIORITY 1 — CRITICAL
        if (
            ($isEssential && $isUncovered) ||
            in_array($department, self::CRITICAL_DEPARTMENTS) ||
            $monthsVacant >= 12 ||
            $impact === 'Critical'
        ) {
            return '1-Critical';
        }

        // PRIORITY 2 — HIGH
        if (
            ($monthsVacant >= 6 && $monthsVacant < 12) ||
            $impact === 'Significant' ||
            $isEssential
        ) {
            return '2-High';
        }

        // PRIORITY 3 — MEDIUM
        if ($monthsVacant >= 3 || $impact === 'Moderate') {
            return '3-Medium';
        }

        // PRIORITY 4 — LOW
        return '4-Low';
    }
}