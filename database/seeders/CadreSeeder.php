<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CadreSeeder extends Seeder
{
    public function run(): void
    {
        $cadres = [
            // Clinical
            ['name' => 'Medical Officer', 'category' => 'Clinical'],
            ['name' => 'Senior Medical Officer', 'category' => 'Clinical'],
            ['name' => 'Specialist (General)', 'category' => 'Clinical'],
            ['name' => 'Clinical Officer', 'category' => 'Clinical'],
            ['name' => 'Senior Clinical Officer', 'category' => 'Clinical'],
            // Nursing
            ['name' => 'Staff Nurse', 'category' => 'Nursing'],
            ['name' => 'Senior Staff Nurse', 'category' => 'Nursing'],
            ['name' => 'Nursing Sister', 'category' => 'Nursing'],
            ['name' => 'Principal Nursing Sister', 'category' => 'Nursing'],
            ['name' => 'Nurse Aide', 'category' => 'Nursing'],
            // Paramedical
            ['name' => 'Pharmacist', 'category' => 'Paramedical'],
            ['name' => 'Pharmacy Technician', 'category' => 'Paramedical'],
            ['name' => 'Radiographer', 'category' => 'Paramedical'],
            ['name' => 'Laboratory Scientist', 'category' => 'Paramedical'],
            ['name' => 'Laboratory Technician', 'category' => 'Paramedical'],
            ['name' => 'Physiotherapist', 'category' => 'Paramedical'],
            ['name' => 'Occupational Therapist', 'category' => 'Paramedical'],
            ['name' => 'Dental Therapist', 'category' => 'Paramedical'],
            ['name' => 'Optometrist', 'category' => 'Paramedical'],
            // Environmental Health
            ['name' => 'Environmental Health Officer', 'category' => 'Environmental Health'],
            ['name' => 'Environmental Health Technician', 'category' => 'Environmental Health'],
            // Administrative
            ['name' => 'Hospital Administrator', 'category' => 'Administrative'],
            ['name' => 'Finance Officer', 'category' => 'Administrative'],
            ['name' => 'Records Officer', 'category' => 'Administrative'],
            ['name' => 'Human Resources Officer', 'category' => 'Administrative'],
            // Support Services
            ['name' => 'Driver', 'category' => 'Support Services'],
            ['name' => 'Security Officer', 'category' => 'Support Services'],
            ['name' => 'Cleaner', 'category' => 'Support Services'],
            ['name' => 'Cook', 'category' => 'Support Services'],
            ['name' => 'Maintenance Technician', 'category' => 'Support Services'],
        ];

        foreach ($cadres as $cadre) {
            DB::table('cadres')->insertOrIgnore(array_merge($cadre, [
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}