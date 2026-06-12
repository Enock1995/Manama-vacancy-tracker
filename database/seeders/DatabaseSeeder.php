<?php

namespace Database\Seeders;

use App\Models\District;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * This seeder is called on every Railway deploy via `php artisan db:seed --force`.
     * It is written to be fully idempotent:
     *   - Reference data (districts, facilities, cadres, roles, admin) only runs
     *     when the database is empty (District::count() === 0).
     *   - Safe to call repeatedly — will never create duplicates.
     */
    public function run(): void
    {
        if (District::count() === 0) {
            // Fresh database — seed all reference data in dependency order
            $this->call([
                DistrictSeeder::class,
                FacilitySeeder::class,
                CadreSeeder::class,
                RoleAndAdminSeeder::class,
            ]);
        }
        // If districts already exist, seeding is skipped entirely.
        // To re-seed from scratch: php artisan migrate:fresh --seed
    }
}