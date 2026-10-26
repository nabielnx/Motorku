<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\BusinessContext;
use App\Services\BusinessOnboardingService;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

final class EmptyProductionMigrationTest extends TestCase
{
    public function test_first_install_from_a_database_without_any_tables_can_accept_a_new_owner(): void
    {
        // TestCase only permits the dedicated MySQL tokom_testing database.
        Artisan::call('db:wipe', ['--force' => true]);
        app(BusinessContext::class)->resetSchema();
        $this->app['env'] = 'production';
        config(['app.debug' => false, 'app.url' => 'https://production.example.test']);
        try {
            $this->assertSame(0, Artisan::call('app:initialize-production', ['database' => 'tokom_testing']));
            foreach (['users', 'customer_accounts', 'products', 'categories', 'data_types', 'reference_entries', 'suppliers', 'orders', 'payments', 'inventory_logs'] as $table) {
                $this->assertDatabaseCount($table, 0);
            }
            $owner = app(BusinessOnboardingService::class)->register([
                'name' => 'New Owner', 'email' => 'new-owner@example.test', 'password' => 'PrivateTestPassword2026!',
                'business_name' => 'New Business', 'business_slug' => 'new-business',
            ]);
            $this->assertTrue($owner->hasRole('owner'));
            $this->assertNotSame(BusinessContext::LEGACY_ID, $owner->business_id);
            $this->assertDatabaseCount('users', 1);
            $this->assertDatabaseCount('data_types', 0);
            $this->assertDatabaseCount('products', 0);
        } finally {
            $this->app['env'] = 'testing';
            Artisan::call('migrate:fresh', ['--force' => true]);
            app(BusinessContext::class)->resetSchema();
        }
    }
}
