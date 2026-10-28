<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use App\Services\BusinessContext;
use App\Services\BusinessOnboardingService;
use App\Services\ProductionInstallationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use LogicException;
use Tests\TestCase;

final class EmptyProductionInstallationTest extends TestCase
{
    use RefreshDatabase;

    public function test_preparation_removes_only_migration_presets_and_keeps_accounts_and_catalog_empty(): void
    {
        $this->seed(RoleSeeder::class);
        app(ProductionInstallationService::class)->prepareMigratedDatabase(freshlyMigrated: true);
        foreach (['users', 'customer_accounts', 'customer_profiles', 'products', 'categories', 'data_types', 'reference_entries', 'motorcycles', 'suppliers', 'orders', 'payments', 'inventory_logs'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertDatabaseHas('settings', ['group' => 'store', 'key' => 'phone', 'value' => '']);
        $this->assertDatabaseHas('settings', ['group' => 'store', 'key' => 'address', 'value' => '']);
        $this->assertDatabaseHas('settings', ['group' => 'payment', 'key' => 'qris_enabled', 'value' => 'false']);
        $this->assertDatabaseHas('settings', ['group' => 'tax', 'key' => 'enabled', 'value' => 'false']);
        $this->assertDatabaseHas('settings', ['group' => 'references', 'key' => 'motorcycles_enabled', 'value' => 'false']);
        app(ProductionInstallationService::class)->assertReadyForRegistration();
    }

    public function test_preparation_cannot_discard_settings_without_the_fresh_migration_path(): void
    {
        DB::table('settings')->insertOrIgnore(['id' => fake()->uuid(), 'business_id' => BusinessContext::LEGACY_ID,
            'group' => 'references', 'key' => 'motorcycles_enabled', 'value' => 'true', 'type' => 'string',
            'sync_version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $this->expectException(LogicException::class);
        app(ProductionInstallationService::class)->prepareMigratedDatabase();
    }

    public function test_fresh_migration_path_still_rejects_any_additional_configuration(): void
    {
        DB::table('settings')->insert(['id' => fake()->uuid(), 'business_id' => BusinessContext::LEGACY_ID,
            'group' => 'store', 'key' => 'name', 'value' => 'Configured shop', 'type' => 'string',
            'created_at' => now(), 'updated_at' => now()]);
        try {
            app(ProductionInstallationService::class)->prepareMigratedDatabase(freshlyMigrated: true);
            $this->fail('Additional configuration must block preparation.');
        } catch (LogicException) {
            $this->assertDatabaseHas('settings', ['group' => 'store', 'key' => 'name', 'value' => 'Configured shop']);
            $this->assertDatabaseCount('data_types', 5);
        }
    }

    public function test_preparation_refuses_existing_user_and_leaves_presets_untouched(): void
    {
        User::factory()->create();
        $before = DB::table('data_types')->pluck('id')->all();
        try {
            app(ProductionInstallationService::class)->prepareMigratedDatabase();
            $this->fail('Existing accounts must block preparation.');
        } catch (LogicException) {
            $this->assertSame($before, DB::table('data_types')->pluck('id')->all());
            $this->assertDatabaseCount('users', 1);
        }
    }

    public function test_unscoped_data_in_another_business_blocks_preparation(): void
    {
        $business = Business::create(['name' => 'Existing', 'slug' => 'existing']);
        app(BusinessContext::class)->run($business->id, fn () => Product::factory()->create());
        $this->expectException(LogicException::class);
        app(ProductionInstallationService::class)->prepareMigratedDatabase();
    }

    public function test_customized_presets_are_never_deleted(): void
    {
        DB::table('data_types')->limit(1)->update(['is_system' => false]);
        $this->expectException(LogicException::class);
        app(ProductionInstallationService::class)->prepareMigratedDatabase();
    }

    public function test_renamed_system_preset_is_not_deleted(): void
    {
        DB::table('data_types')->where('key', 'automotive')->update(['name' => 'Custom Name']);
        try {
            app(ProductionInstallationService::class)->prepareMigratedDatabase();
            $this->fail('Customized migration presets must block preparation.');
        } catch (LogicException) {
            $this->assertDatabaseCount('data_types', 5);
            $this->assertDatabaseHas('data_types', ['key' => 'automotive', 'name' => 'Custom Name']);
        }
    }

    public function test_initialization_never_wipes_an_existing_database(): void
    {
        $this->app['env'] = 'production';
        config(['app.debug' => false, 'app.url' => 'https://production.example.test']);
        User::factory()->create();
        $this->artisan('app:initialize-production', ['database' => 'tokom_testing'])
            ->expectsOutput('Database harus benar-benar kosong. Tidak ada tabel atau data yang dihapus.')->assertFailed();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_initialization_refuses_wrong_environment_or_database_name(): void
    {
        $this->artisan('app:initialize-production', ['database' => 'tokom_testing'])->assertFailed();
        $this->app['env'] = 'production';
        config(['app.debug' => false, 'app.url' => 'https://production.example.test']);
        $this->artisan('app:initialize-production', ['database' => 'some_other_database'])
            ->expectsOutput('Nama database konfirmasi tidak cocok dengan koneksi MySQL production.')->assertFailed();
    }

    public function test_empty_installation_check_cannot_hide_existing_ownerless_data(): void
    {
        $this->seed(RoleSeeder::class);
        app(ProductionInstallationService::class)->prepareMigratedDatabase(freshlyMigrated: true);
        Product::factory()->create();
        $this->artisan('app:check-deployment', ['--allow-empty-installation' => true])
            ->expectsOutput('FAIL: Empty installation ready for registration')->assertFailed();
    }

    public function test_normal_deployment_check_finds_owner_registered_in_a_new_business(): void
    {
        $this->seed(RoleSeeder::class);
        app(BusinessOnboardingService::class)->register([
            'name' => 'Real Owner', 'email' => 'real-owner@example.test', 'password' => 'PrivateTestPassword2026!',
            'business_name' => 'Real Business', 'business_slug' => 'real-business',
        ]);
        // Other host-only checks intentionally fail in local testing.
        $this->artisan('app:check-deployment')->expectsOutput('OK: Active owner exists')->assertFailed();
    }

    public function test_deployment_check_detects_demo_password_in_another_business(): void
    {
        $this->seed(RoleSeeder::class);
        $business = Business::create(['name' => 'Another', 'slug' => 'another']);
        app(BusinessContext::class)->run($business->id, fn () => User::factory()->create(['email' => 'owner@example.com', 'password' => 'password']));
        $this->artisan('app:check-deployment')->expectsOutput('FAIL: No demo passwords')->assertFailed();
    }
}
