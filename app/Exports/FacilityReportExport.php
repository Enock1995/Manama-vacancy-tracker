<?php

namespace App\Exports;

use App\Models\VacantPost;
use App\Models\Facility;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Carbon\Carbon;

class FacilityReportExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithTitle,
    ShouldAutoSize
{
    protected int $facilityId;
    protected string $facilityName;
    protected array $filters;

    public function __construct(int $facilityId, array $filters = [])
    {
        $this->facilityId   = $facilityId;
        $this->facilityName = Facility::find($facilityId)->name ?? 'Facility';
        $this->filters      = $filters;
    }

    public function title(): string
    {
        return substr($this->facilityName, 0, 31); // Excel sheet name limit
    }

    public function collection()
    {
        $query = VacantPost::with(['cadre', 'updatedBy'])
            ->where('facility_id', $this->facilityId)
            ->orderBy('priority_level');

        if (!empty($this->filters['status'])) {
            $query->where('overall_status', $this->filters['status']);
        }
        if (isset($this->filters['exclude_filled']) && $this->filters['exclude_filled']) {
            $query->whereNotIn('overall_status', ['Filled', 'Abolished']);
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'No.',
            'Post Number',
            'Cadre',
            'Category',
            'Grade',
            'Department',
            'Essential?',
            'Date Fell Vacant',
            'Months Vacant',
            'Reason',
            'Previous Incumbent',
            'Patient Impact',
            'Covered?',
            'Coverage Type',
            'Person Covering',
            'Locum Cost/Month',
            'MOHCC Ref',
            'MOHCC Status',
            'TC Status',
            'TC Ref',
            'TC Expiry',
            'Advertised',
            'Interviews',
            'Candidate',
            'Expected Reporting',
            'Overall Status',
            'Priority',
            'Next Action',
            'Follow-up Date',
            'Comments',
        ];
    }

    public function map($post): array
    {
        static $counter = 0;
        $counter++;

        return [
            $counter,
            $post->establishment_post_number ?? '',
            $post->cadre->name ?? '',
            $post->post_category,
            $post->grade_scale ?? '',
            $post->department ?? '',
            $post->is_essential_service ? 'YES' : 'No',
            $post->date_fell_vacant ? $post->date_fell_vacant->format('d/m/Y') : '',
            Carbon::parse($post->date_fell_vacant)->diffInMonths(now()),
            $post->reason_for_vacancy,
            $post->previous_incumbent_name ?? '',
            $post->patient_care_impact,
            $post->is_post_covered,
            $post->coverage_arrangement ?? '',
            $post->person_covering_name ?? '',
            $post->locum_cost_per_month ? 'USD ' . number_format($post->locum_cost_per_month, 2) : '',
            $post->mohcc_reference_number ?? '',
            $post->mohcc_approval_status ?? '',
            $post->tc_status ?? '',
            $post->tc_reference_number ?? '',
            $post->tc_expiry_date ? $post->tc_expiry_date->format('d/m/Y') : '',
            $post->date_post_advertised ? $post->date_post_advertised->format('d/m/Y') : '',
            $post->interviews_conducted ? 'YES' : 'No',
            $post->candidate_name ?? '',
            $post->expected_reporting_date ? $post->expected_reporting_date->format('d/m/Y') : '',
            $post->overall_status,
            $post->priority_level,
            $post->next_action_required ?? '',
            $post->follow_up_date ? $post->follow_up_date->format('d/m/Y') : '',
            $post->comments ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => [
                    'bold'  => true,
                    'color' => ['argb' => 'FFFFFFFF'],
                    'size'  => 11,
                ],
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF4A148C'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'wrapText'   => true,
                ],
            ],
        ];
    }
}