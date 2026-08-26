<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        /*
        |--------------------------------------------------------------------------
        | Permissions
        |--------------------------------------------------------------------------
        */

        $permissions = [

            // Dashboard
            'dashboard.view',

            // User
            'user.view',
            'user.create',
            'user.update',
            'user.delete',

            // Category
            'category.view',
            'category.create',
            'category.update',
            'category.delete',

            // Product
            'product.view',
            'product.create',
            'product.update',
            'product.delete',

            // Table
            'table.view',
            'table.create',
            'table.update',
            'table.delete',

            // Order
            'order.view',
            'order.create',
            'order.update',
            'order.cancel',

            // Payment
            'payment.view',
            'payment.create',
            'payment.refund',

            // Inventory
            'inventory.view',
            'inventory.create',
            'inventory.update',
            'inventory.delete',

            // Reports
            'report.view',


            // Settings
            'setting.view',
            'setting.update',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Roles
        |--------------------------------------------------------------------------
        */

        $owner = Role::firstOrCreate([
            'name' => 'owner',
            'guard_name' => 'web',
        ]);

        $cashier = Role::firstOrCreate([
            'name' => 'cashier',
            'guard_name' => 'web',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Assign Permission
        |--------------------------------------------------------------------------
        */

        // Owner -> semua permission
        $owner->syncPermissions(Permission::all());

        // Cashier
        $cashier->syncPermissions([
            'product.view',

            'table.view',

            'order.view',
            'order.create',
            'order.update',

            'payment.view',
            'payment.create',
        ]);

    }
}
