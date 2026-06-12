<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RoleAndAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $facilityRole  = Role::firstOrCreate(['name' => 'facility_user',     'guard_name' => 'web']);
        $districtRole  = Role::firstOrCreate(['name' => 'district_user',     'guard_name' => 'web']);
        $provincialRole = Role::firstOrCreate(['name' => 'provincial_admin', 'guard_name' => 'web']);

        // Create permissions
        $permissions = [
            'view own facility posts',
            'create posts',
            'edit own facility posts',
            'view district posts',
            'edit district posts',
            'view all posts',
            'edit all posts',
            'manage users',
            'export reports',
            'view dashboard',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Assign permissions to roles
        $facilityRole->syncPermissions([
            'view own facility posts', 'create posts', 'edit own facility posts', 'view dashboard',
        ]);

        $districtRole->syncPermissions([
            'view own facility posts', 'create posts', 'edit own facility posts',
            'view district posts', 'edit district posts', 'export reports', 'view dashboard',
        ]);

        $provincialRole->syncPermissions(Permission::all());

        // Create super admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@matsouth.gov.zw'],
            [
                'name' => 'Provincial Admin',
                'password' => Hash::make('Admin@MatSouth2024!'),
                'facility_id' => null,
                'district_id' => null,
            ]
        );
        $admin->assignRole('provincial_admin');
    }
}