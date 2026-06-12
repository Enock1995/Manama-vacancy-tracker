<?php

namespace App\Exports;

use App\Models\VacantPost;
use App\Models\District;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithProperties;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Carbon\Carbon;

class DistrictReportExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithTitle,
    WithProperties,
    ShouldAutoSize
{
    protected int $districtId;
    protected string $districtName;
    protected array $filters;

    public function __construct(int $districtId, array $filters = [])
    {
        $this->districtId   = $districtId;
        $this->districtName = District::find($districtId)->name ?? 'District';
        $this->filters      = $filters;
    }

    public function title(): string
    {
        return $this->districtName;
    }

    public function properties(): array
    {
        return [
            'title'   => $this->districtName . ' Vacancy Report',
            'subject' => 'Health Vacancy Tracker — Mat South PHD',
            'creator' => 'MatSouth Vacancy Tracker',
        ];
    }

    public function collection()
    {
        $query = VacantPost::with(['facility', 'cadre', 'updatedBy'])
            ->where('district_id', $this->districtId)
            ->orderBy('facility_id')
            ->orderBy('priority_level');

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
            'Facility',
            'Facility Type',
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
            'Impact',
            'Covered?',
            'Coverage Type',
            'TC Status',
            'TC Expiry',
            'Overall Status',
            'Priority',
            'Next Action',
            'Follow-up Date',
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
            $post->tc_status ?? '',
            $post->tc_expiry_date ? $post->tc_expiry_date->format('d/m/Y') : '',
            $post->overall_status,
            $post->priority_level,
            $post->next_action_required ?? '',
            $post->follow_up_date ? $post->follow_up_date->format('d/m/Y') : '',
            $post->updated_at ? $post->updated_at->format('d/m/Y H:i') : '',
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
                    'startColor' => ['argb' => 'FF1B5E20'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'wrapText'   => true,
                ],
            ],
        ];
    }
}