<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use App\Services\UserService;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ProductionProvisioningTest extends TestCase
{
    use RefreshDatabase;

    public function test_initial_owner_is_created_with_a_private_password_and_cannot_be_created_twice(): void
    {
        $this->seed(RoleSeeder::class);
        $this->artisan('app:create-owner', ['email' => 'first-owner@example.test', '--name' => 'First Owner'])
            ->expectsQuestion('Password owner', 'StrongPassword2026!')
            ->expectsQuestion('Ulangi password', 'StrongPassword2026!')
            ->expectsOutput('Owner berhasil dibuat.')->assertSuccessful();
        $owner = User::where('email', 'first-owner@example.test')->firstOrFail();
        $this->assertTrue($owner->is_active);
        $this->assertTrue($owner->hasRole('owner'));
        $this->assertTrue(Hash::check('StrongPassword2026!', $owner->password));
        $this->artisan('app:create-owner', ['email' => 'second-owner@example.test'])
            ->expectsOutput('Owner aktif sudah ada. Tambahkan staf melalui Kelola Staf.')->assertFailed();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_owner_provisioning_requires_seeded_roles(): void
    {
        $this->artisan('app:create-owner', ['email' => 'first-owner@example.test'])
            ->expectsOutput('Jalankan db:seed --class=RoleSeeder --force terlebih dahulu.')->assertFailed();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_production_seeding_keeps_existing_settings_and_does_not_create_demo_catalog_or_accounts(): void
    {
        $this->app['env'] = 'production';
        Setting::create(['group' => 'store', 'key' => 'name', 'value' => 'Real Store']);
        $this->artisan('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true])->assertSuccessful();
        $this->assertDatabaseHas('settings', ['group' => 'store', 'key' => 'name', 'value' => 'Real Store']);
        $this->assertDatabaseHas('settings', ['group' => 'store', 'key' => 'logo', 'value' => '']);
        foreach (['users', 'products', 'categories', 'motorcycles'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
    }

    public function test_demo_user_seeder_rejects_production(): void
    {
        $this->app['env'] = 'production';
        $this->expectException(\LogicException::class);
        app(UserSeeder::class)->run();
    }

    public function test_service_cannot_remove_the_last_owner_through_profile_deletion(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner);
        try {
            app(UserService::class)->deleteEmployee($owner->id, true);
            $this->fail('Deleting the last active owner must be rejected.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('password', $exception->errors());
        }
        $this->assertDatabaseHas('users', ['id' => $owner->id, 'is_active' => true]);
    }
}
