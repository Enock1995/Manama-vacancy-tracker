<?php

namespace App\Exports;

use App\Models\VacantPost;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use Carbon\Carbon;

class LocumCostReportExport implements
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
        return 'Locum Cost Analysis';
    }

    public function collection()
    {
        $query = VacantPost::with(['facility', 'district', 'cadre'])
            ->where('coverage_arrangement', 'Locum')
            ->whereNotNull('locum_cost_per_month')
            ->where('locum_cost_per_month', '>', 0)
            ->orderBy('district_id')
            ->orderBy('locum_cost_per_month', 'desc');

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
            'Post Number',
            'Coverage Start Date',
            'Months on Locum',
            'Monthly Cost (USD)',
            'Total Cost to Date (USD)',
            'Is Coverage Sustainable?',
            'Overall Status',
            'Priority',
        ];
    }

    public function map($post): array
    {
        static $counter = 0;
        $counter++;

        $coverageStart   = $post->coverage_start_date ?? $post->date_fell_vacant;
        $monthsOnLocum   = $coverageStart ? (int) Carbon::parse($coverageStart)->diffInMonths(now()) : 0;
        $totalCost       = $monthsOnLocum * ($post->locum_cost_per_month ?? 0);

        return [
            $counter,
            $post->district->name ?? '',
            $post->facility->name ?? '',
            $post->cadre->name ?? '',
            $post->establishment_post_number ?? '',
            $coverageStart ? Carbon::parse($coverageStart)->format('d/m/Y') : '',
            $monthsOnLocum,
            number_format($post->locum_cost_per_month ?? 0, 2),
            number_format($totalCost, 2),
            $post->is_coverage_sustainable ?? '',
            $post->overall_status,
            $post->priority_level,
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
                    'startColor' => ['argb' => 'FFE65100'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'wrapText'   => true,
                ],
            ],
        ];
    }
}