<?php

namespace App\Exports;

use App\Models\VacantPost;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Carbon\Carbon;

class ProvincialSummaryExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithTitle,
    ShouldAutoSize
{
    protected array $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function title(): string
    {
        return 'Provincial Summary';
    }

    public function collection()
    {
        $query = VacantPost::with(['facility', 'district', 'cadre', 'updatedBy'])
            ->orderBy('district_id')
            ->orderBy('facility_id')
            ->orderBy('priority_level');

        if (!empty($this->filters['district_id'])) {
            $query->where('district_id', $this->filters['district_id']);
        }
        if (!empty($this->filters['status'])) {
            $query->where('overall_status', $this->filters['status']);
        }
        if (!empty($this->filters['priority'])) {
            $query->where('priority_level', $this->filters['priority']);
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
            'District',
            'Facility',
            'Facility Type',
            'Post Number',
            'Cadre/Designation',
            'Category',
            'Grade',
            'Department',
            'Essential Post',
            'Date Fell Vacant',
            'Months Vacant',
            'Reason for Vacancy',
            'Previous Incumbent',
            'Patient Care Impact',
            'Post Covered?',
            'Coverage Type',
            'Person Covering',
            'Locum Cost/Month',
            'MOHCC Status',
            'MOHCC Ref',
            'TC Status',
            'TC Reference',
            'TC Expiry Date',
            'TC Utilised?',
            'Post Advertised',
            'Interviews Done?',
            'Candidate Name',
            'Expected Reporting',
            'Actual Reporting',
            'Overall Status',
            'Priority',
            'Next Action',
            'Responsible (Facility)',
            'Responsible (Province)',
            'Follow-up Date',
            'Last Updated By',
            'Last Updated',
            'Comments',
        ];
    }

    public function map($post): array
    {
        static $counter = 0;
        $counter++;

        return [
            $counter,
            $post->district->name ?? '',
            $post->facility->name ?? '',
            $post->facility->facility_type ?? '',
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
            $post->mohcc_approval_status ?? '',
            $post->mohcc_reference_number ?? '',
            $post->tc_status ?? '',
            $post->tc_reference_number ?? '',
            $post->tc_expiry_date ? $post->tc_expiry_date->format('d/m/Y') : '',
            $post->tc_utilised ? 'YES' : 'No',
            $post->date_post_advertised ? $post->date_post_advertised->format('d/m/Y') : '',
            $post->interviews_conducted ? 'YES' : 'No',
            $post->candidate_name ?? '',
            $post->expected_reporting_date ? $post->expected_reporting_date->format('d/m/Y') : '',
            $post->actual_reporting_date ? $post->actual_reporting_date->format('d/m/Y') : '',
            $post->overall_status,
            $post->priority_level,
            $post->next_action_required ?? '',
            $post->responsible_person_facility ?? '',
            $post->responsible_person_province ?? '',
            $post->follow_up_date ? $post->follow_up_date->format('d/m/Y') : '',
            $post->updatedBy->name ?? '',
            $post->updated_at ? $post->updated_at->format('d/m/Y H:i') : '',
            $post->comments ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            // Header row — dark blue background, white bold text
            1 => [
                'font' => [
                    'bold'  => true,
                    'color' => ['argb' => 'FFFFFFFF'],
                    'size'  => 11,
                ],
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF1B3A6B'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical'   => Alignment::VERTICAL_CENTER,
                    'wrapText'   => true,
                ],
            ],
        ];
    }
}