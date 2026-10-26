<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use App\Services\BusinessContext;
use App\Services\CacheService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

final class BrandCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        config(['session.driver' => 'database', 'session.cookie' => 'tokom-session']);
        Auth::forgetGuards();
        app('session')->forgetDrivers();
        app()->forgetInstance('session.store');
    }

    public function test_legacy_encrypted_cookie_keeps_login_and_issues_the_current_cookie(): void
    {
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $session = $this->createSession($owner);

        $this->withCookie('motorku-session', $session)->get('/profile')
            ->assertOk()->assertCookie('tokom-session');

        $this->assertAuthenticatedAs($owner);
        $this->assertDatabaseHas('sessions', ['id' => $session, 'user_id' => $owner->id]);
    }

    public function test_current_cookie_takes_priority_over_a_different_legacy_account(): void
    {
        $old = User::factory()->create();
        $current = User::factory()->create();
        $old->assignRole('owner');
        $current->assignRole('owner');

        $this->withCookies([
            'motorku-session' => $this->createSession($old),
            'tokom-session' => $this->createSession($current),
        ])->get('/profile')->assertOk();

        $this->assertAuthenticatedAs($current);
    }

    public function test_an_unencrypted_legacy_cookie_cannot_restore_a_session(): void
    {
        $owner = User::factory()->create();
        $owner->assignRole('owner');

        $this->withUnencryptedCookie('motorku-session', $this->createSession($owner))
            ->get('/profile')->assertRedirect();

        $this->assertGuest();
    }

    public function test_custom_cookie_configuration_does_not_adopt_the_legacy_session(): void
    {
        config(['session.cookie' => 'custom-session']);
        $owner = User::factory()->create();
        $owner->assignRole('owner');

        $this->withCookie('motorku-session', $this->createSession($owner))
            ->get('/profile')->assertRedirect();

        $this->assertGuest();
    }

    #[DataProvider('demoEmails')]
    public function test_deployment_check_detects_weak_current_and_legacy_demo_accounts(string $email): void
    {
        $owner = User::factory()->create(['email' => $email, 'password' => Hash::make('password')]);
        $owner->assignRole('owner');

        $this->artisan('app:check-deployment')->expectsOutput('FAIL: No demo passwords')->assertFailed();
    }

    public static function demoEmails(): array
    {
        return [
            'current' => ['owner@example.com'],
            'legacy' => ['owner@tokosparepart.com'],
        ];
    }

    public function test_brand_backfill_is_idempotent_and_changes_only_legacy_default_names(): void
    {
        DB::table('businesses')->where('id', BusinessContext::LEGACY_ID)->update(['name' => 'Motorku']);
        DB::table('settings')->updateOrInsert([
            'business_id' => BusinessContext::LEGACY_ID, 'group' => 'store', 'key' => 'name',
        ], ['id' => (string) Str::uuid(), 'value' => 'Motorku']);
        $other = Business::create(['name' => 'Motorku', 'slug' => 'custom-brand']);
        $product = Product::factory()->create(['name' => 'Motorku Sparepart']);
        $cacheKey = app(BusinessContext::class)->run(BusinessContext::LEGACY_ID, fn () => CacheService::key(CacheService::SETTINGS_STORE));
        Cache::put($cacheKey, ['name' => 'Motorku'], 60);
        $migration = require database_path('migrations/2026_10_26_120000_update_legacy_default_brand.php');

        $migration->up();
        $migration->up();

        $this->assertDatabaseHas('businesses', ['id' => BusinessContext::LEGACY_ID, 'name' => 'TokoM']);
        $this->assertDatabaseHas('settings', ['business_id' => BusinessContext::LEGACY_ID, 'group' => 'store', 'key' => 'name', 'value' => 'TokoM']);
        $this->assertSame('Motorku', $other->fresh()->name);
        $this->assertSame('Motorku Sparepart', $product->fresh()->name);
        $this->assertFalse(Cache::has($cacheKey));
    }

    public function test_brand_backfill_preserves_custom_legacy_store_names(): void
    {
        $migration = require database_path('migrations/2026_10_26_120000_update_legacy_default_brand.php');

        // MySQL's normal text comparison ignores case and trailing spaces.
        foreach (['Usaha Pilihan Owner', 'motorku', 'Motorku '] as $name) {
            DB::table('businesses')->where('id', BusinessContext::LEGACY_ID)->update(['name' => $name]);
            DB::table('settings')->updateOrInsert([
                'business_id' => BusinessContext::LEGACY_ID, 'group' => 'store', 'key' => 'name',
            ], ['id' => (string) Str::uuid(), 'value' => $name]);

            $migration->up();

            $this->assertSame($name, DB::table('businesses')->where('id', BusinessContext::LEGACY_ID)->value('name'));
            $this->assertSame($name, DB::table('settings')->where('business_id', BusinessContext::LEGACY_ID)->where('group', 'store')->where('key', 'name')->value('value'));
        }
    }

    private function createSession(User $user): string
    {
        $id = Str::random(40);
        DB::table('sessions')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'payload' => base64_encode(serialize([
                Auth::guard('web')->getName() => $user->id,
                '_token' => Str::random(40),
            ])),
            'last_activity' => now()->timestamp,
        ]);

        return $id;
    }
}
