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

class TcStatusReportExport implements
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
        return 'TC Status Report';
    }

    public function collection()
    {
        $query = VacantPost::with(['facility', 'district', 'cadre'])
            ->whereNotNull('date_tc_requested')
            ->orderBy('district_id')
            ->orderBy('tc_expiry_date');

        if (!empty($this->filters['tc_status'])) {
            $query->where('tc_status', $this->filters['tc_status']);
        }
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
            'Date TC Requested',
            'TC Request Ref',
            'TC Granted?',
            'Date TC Granted',
            'TC Reference',
            'TC Expiry Date',
            'Days to Expiry',
            'TC Utilised?',
            'TC Status',
            'Overall Post Status',
            'Priority',
            'Comments',
        ];
    }

    public function map($post): array
    {
        static $counter = 0;
        $counter++;

        $daysToExpiry = '';
        if ($post->tc_expiry_date) {
            $days = (int) now()->diffInDays($post->tc_expiry_date, false);
            $daysToExpiry = $days < 0 ? "EXPIRED ({$days} days)" : "{$days} days";
        }

        return [
            $counter,
            $post->district->name ?? '',
            $post->facility->name ?? '',
            $post->cadre->name ?? '',
            $post->establishment_post_number ?? '',
            $post->date_tc_requested ? $post->date_tc_requested->format('d/m/Y') : '',
            $post->tc_request_reference ?? '',
            $post->tc_granted ? 'YES' : 'No',
            $post->date_tc_granted ? $post->date_tc_granted->format('d/m/Y') : '',
            $post->tc_reference_number ?? '',
            $post->tc_expiry_date ? $post->tc_expiry_date->format('d/m/Y') : '',
            $daysToExpiry,
            $post->tc_utilised ? 'YES' : 'No',
            $post->tc_status ?? '',
            $post->overall_status,
            $post->priority_level,
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
                    'startColor' => ['argb' => 'FFB71C1C'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'wrapText'   => true,
                ],
            ],
        ];
    }
}