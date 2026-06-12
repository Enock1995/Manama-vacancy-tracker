<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FacilitySeeder extends Seeder
{
    public function run(): void
    {
        $facilities = [
            // Gwanda District (id: 1)
            ['district_id' => 1, 'name' => 'Gwanda Provincial Hospital',      'code' => 'GPH',  'facility_type' => 'Provincial Hospital', 'ownership' => 'MOHCC', 'level_of_care' => 'Tertiary'],
            ['district_id' => 1, 'name' => 'Gwanda District Hospital',         'code' => 'GDH',  'facility_type' => 'District Hospital',   'ownership' => 'MOHCC', 'level_of_care' => 'Secondary'],
            ['district_id' => 1, 'name' => 'Gwanda Town Clinic',               'code' => 'GTC',  'facility_type' => 'Clinic',              'ownership' => 'MOHCC', 'level_of_care' => 'Primary'],
            ['district_id' => 1, 'name' => 'Colleen Bawn RHC',                 'code' => 'CBR',  'facility_type' => 'Rural Health Centre', 'ownership' => 'MOHCC', 'level_of_care' => 'Primary'],

            // Beitbridge District (id: 2)
            ['district_id' => 2, 'name' => 'Beitbridge District Hospital',     'code' => 'BDH',  'facility_type' => 'District Hospital',   'ownership' => 'MOHCC', 'level_of_care' => 'Secondary'],
            ['district_id' => 2, 'name' => 'Beitbridge Town Clinic',           'code' => 'BTC',  'facility_type' => 'Clinic',              'ownership' => 'MOHCC', 'level_of_care' => 'Primary'],
            ['district_id' => 2, 'name' => 'Dulibadzimu RHC',                  'code' => 'DLB',  'facility_type' => 'Rural Health Centre', 'ownership' => 'MOHCC', 'level_of_care' => 'Primary'],

            // Insiza District (id: 3)
            ['district_id' => 3, 'name' => 'Filabusi District Hospital',       'code' => 'FDH',  'facility_type' => 'District Hospital',   'ownership' => 'MOHCC', 'level_of_care' => 'Secondary'],
            ['district_id' => 3, 'name' => 'Insiza RHC',                       'code' => 'INR',  'facility_type' => 'Rural Health Centre', 'ownership' => 'MOHCC', 'level_of_care' => 'Primary'],
            ['district_id' => 3, 'name' => 'Zvishavane Mission Hospital',      'code' => 'ZMH',  'facility_type' => 'Mission Hospital',    'ownership' => 'Mission','level_of_care' => 'Secondary'],

            // Matobo District (id: 4)
            ['district_id' => 4, 'name' => 'Kezi District Hospital',           'code' => 'KDH',  'facility_type' => 'District Hospital',   'ownership' => 'MOHCC', 'level_of_care' => 'Secondary'],
            ['district_id' => 4, 'name' => 'Brunapeg Mission Hospital',        'code' => 'BMH',  'facility_type' => 'Mission Hospital',    'ownership' => 'Mission','level_of_care' => 'Secondary'],
            ['district_id' => 4, 'name' => 'Matopo RHC',                       'code' => 'MTR',  'facility_type' => 'Rural Health Centre', 'ownership' => 'MOHCC', 'level_of_care' => 'Primary'],

            // Umzingwane District (id: 5)
            ['district_id' => 5, 'name' => 'Esigodini District Hospital',      'code' => 'EDH',  'facility_type' => 'District Hospital',   'ownership' => 'MOHCC', 'level_of_care' => 'Secondary'],
            ['district_id' => 5, 'name' => 'Esigodini RHC',                    'code' => 'ESR',  'facility_type' => 'Rural Health Centre', 'ownership' => 'MOHCC', 'level_of_care' => 'Primary'],

            // Mangwe District (id: 6)
            ['district_id' => 6, 'name' => 'Plumtree District Hospital',       'code' => 'PDH',  'facility_type' => 'District Hospital',   'ownership' => 'MOHCC', 'level_of_care' => 'Secondary'],
            ['district_id' => 6, 'name' => 'Mangwe RHC',                       'code' => 'MGR',  'facility_type' => 'Rural Health Centre', 'ownership' => 'MOHCC', 'level_of_care' => 'Primary'],

            // Bulilima District (id: 7)
            ['district_id' => 7, 'name' => 'Maphisa District Hospital',        'code' => 'MDH',  'facility_type' => 'District Hospital',   'ownership' => 'MOHCC', 'level_of_care' => 'Secondary'],
            ['district_id' => 7, 'name' => 'Bulilima RHC',                     'code' => 'BLR',  'facility_type' => 'Rural Health Centre', 'ownership' => 'MOHCC', 'level_of_care' => 'Primary'],
            ['district_id' => 7, 'name' => 'Maphisa Urban Council Clinic',     'code' => 'MUC',  'facility_type' => 'Urban Council Facility','ownership' => 'Urban Council','level_of_care' => 'Primary'],
        ];

        foreach ($facilities as $facility) {
            DB::table('facilities')->insertOrIgnore(array_merge($facility, [
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}