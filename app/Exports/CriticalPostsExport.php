<?php

namespace App\Exports;

use App\Models\VacantPost;
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

class CriticalPostsExport implements
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
        return 'Critical Posts';
    }

    public function collection()
    {
        $query = VacantPost::with(['facility', 'district', 'cadre'])
            ->where('priority_level', '1-Critical')
            ->whereNotIn('overall_status', ['Filled', 'Abolished'])
            ->orderBy('date_fell_vacant');

        if (!empty($this->filters['district_id'])) {
            $query->where('district_id', $this->filters['district_id']);
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'No.',
            'District',
            'Facility',
            'Cadre',
            'Department',
            'Essential?',
            'Date Fell Vacant',
            'Months Vacant',
            'Patient Impact',
            'Covered?',
            'Coverage Type',
            'Person Covering',
            'TC Status',
            'TC Expiry',
            'Overall Status',
            'Next Action',
            'Responsible (Facility)',
            'Responsible (Province)',
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
            $post->district->name ?? '',
            $post->facility->name ?? '',
            $post->cadre->name ?? '',
            $post->department ?? '',
            $post->is_essential_service ? 'YES' : 'No',
            $post->date_fell_vacant ? $post->date_fell_vacant->format('d/m/Y') : '',
            Carbon::parse($post->date_fell_vacant)->diffInMonths(now()),
            $post->patient_care_impact,
            $post->is_post_covered,
            $post->coverage_arrangement ?? '',
            $post->person_covering_name ?? '',
            $post->tc_status ?? '',
            $post->tc_expiry_date ? $post->tc_expiry_date->format('d/m/Y') : '',
            $post->overall_status,
            $post->next_action_required ?? '',
            $post->responsible_person_facility ?? '',
            $post->responsible_person_province ?? '',
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
                    'startColor' => ['argb' => 'FF7B0000'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'wrapText'   => true,
                ],
            ],
        ];
    }
}