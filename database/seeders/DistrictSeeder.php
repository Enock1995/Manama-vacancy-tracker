<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DistrictSeeder extends Seeder
{
    public function run(): void
    {
        $districts = [
            ['name' => 'Gwanda',      'code' => 'GWD'],
            ['name' => 'Beitbridge',  'code' => 'BBR'],
            ['name' => 'Insiza',      'code' => 'INS'],
            ['name' => 'Matobo',      'code' => 'MTB'],
            ['name' => 'Umzingwane',  'code' => 'UMZ'],
            ['name' => 'Mangwe',      'code' => 'MNG'],
            ['name' => 'Bulilima',    'code' => 'BUL'],
        ];

        foreach ($districts as $district) {
            DB::table('districts')->insertOrIgnore(array_merge($district, [
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}