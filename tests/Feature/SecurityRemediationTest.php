<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class SecurityRemediationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
    }

    public function test_password_change_revokes_other_browser_sessions_and_tokens_and_preserves_current_login(): void
    {
        config(['session.driver' => 'database']);
        $this->newBrowser();
        $cookie = config('session.cookie');
        $oldSession = Str::random(40);
        // Include sessions created before password-hash tracking was enabled.
        DB::table('sessions')->insert([
            'id' => $oldSession, 'user_id' => $this->owner->id,
            'payload' => base64_encode(serialize([
                Auth::guard('web')->getName() => $this->owner->id,
                '_token' => Str::random(40),
            ])),
            'last_activity' => now()->timestamp,
        ]);
        $this->withCookie($cookie, $oldSession)->get('/profile')->assertOk();
        $this->assertAuthenticatedAs($this->owner);
        $this->owner->createToken('old-device');
        $otherUser = User::factory()->create();
        $otherUser->createToken('unrelated-device');
        DB::table('sessions')->insert([
            'id' => 'unrelated-session', 'user_id' => $otherUser->id,
            'payload' => '', 'last_activity' => now()->timestamp,
        ]);

        $this->newBrowser();
        $this->post('/login', ['email' => $this->owner->email, 'password' => 'password'])
            ->assertRedirect('/dashboard');
        $currentSession = session()->getId();
        $oldCsrf = session()->token();
        $this->newBrowser();
        $this->withCookie($cookie, $currentSession)->from('/profile')->put('/password', [
            'current_password' => 'password', 'password' => 'New@Password123',
            'password_confirmation' => 'New@Password123',
        ])->assertSessionHasNoErrors()->assertRedirect('/profile');
        $newSession = session()->getId();
        $this->assertNotSame($currentSession, $newSession);
        $this->assertNotSame($oldCsrf, session()->token());
        $this->assertTrue(Hash::check('New@Password123', $this->owner->fresh()->password));
        $this->assertDatabaseMissing('sessions', ['id' => $oldSession]);
        $this->assertDatabaseMissing('sessions', ['id' => $currentSession]);
        $this->assertDatabaseHas('sessions', ['id' => 'unrelated-session']);
        $this->assertSame(0, $this->owner->tokens()->count());
        $this->assertSame(1, $otherUser->tokens()->count());

        $this->newBrowser();
        $this->withCookie($cookie, $oldSession)->get('/profile')->assertRedirect();
        $this->assertGuest();
        $this->newBrowser();
        $this->withCookie($cookie, $currentSession)->get('/profile')->assertRedirect();
        $this->assertGuest();
        $this->newBrowser();
        $this->withCookie($cookie, $newSession)->get('/profile')->assertOk();
        $this->assertAuthenticatedAs($this->owner);
    }

    public function test_password_attempt_limit_is_shared_across_endpoints_and_ips_without_blocking_normal_edits(): void
    {
        $staff = User::factory()->create();
        $staff->assignRole('cashier');
        $this->actingAs($this->owner)->from('/profile');
        $this->post('/confirm-password', ['password' => 'wrong'])->assertSessionHasErrors('password');
        $this->put('/password', [
            'current_password' => 'wrong', 'password' => 'New@Password123',
            'password_confirmation' => 'New@Password123',
        ])->assertSessionHasErrors('current_password');
        $this->patch('/profile', [
            'name' => $this->owner->name, 'email' => 'changed@example.test', 'current_password' => 'wrong',
        ])->assertSessionHasErrors('current_password');
        $this->postJson('/api/users', [
            'name' => 'New owner', 'email' => 'new@example.test', 'role' => 'owner', 'owner_password' => 'wrong',
        ])->assertUnprocessable()->assertJsonValidationErrors('owner_password');
        $this->putJson("/api/users/{$staff->id}", [
            'role' => 'owner', 'owner_password' => 'wrong',
        ])->assertUnprocessable()->assertJsonValidationErrors('owner_password');

        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.2'])
            ->delete('/profile', ['password' => 'wrong'])->assertStatus(429);
        $this->post('/confirm-password', ['password' => 'password'])->assertStatus(429);
        $this->putJson("/api/users/{$staff->id}", ['name' => 'Renamed cashier'])->assertOk();
        $this->assertSame('Renamed cashier', $staff->fresh()->name);
        $this->assertTrue($staff->fresh()->hasRole('cashier'));
        $this->assertTrue(Hash::check('password', $this->owner->fresh()->password));
        $this->assertSame($this->owner->email, $this->owner->fresh()->email);

        $this->travel(61)->seconds();
        $this->delete('/profile', ['password' => 'wrong'])->assertSessionHasErrors('password');
        $this->post('/confirm-password', ['password' => 'password'])->assertRedirect('/dashboard');
    }

    public function test_password_attempt_limit_also_applies_to_shared_ip_across_accounts(): void
    {
        for ($account = 0; $account < 3; $account++) {
            $this->actingAs(User::factory()->create());
            for ($attempt = 0; $attempt < 5; $attempt++) {
                $this->post('/confirm-password', ['password' => 'wrong'])->assertSessionHasErrors('password');
            }
        }
        $this->actingAs($this->owner)->post('/confirm-password', ['password' => 'wrong'])->assertStatus(429);
    }

    public function test_application_pages_prevent_cross_origin_framing(): void
    {
        $this->get('/login')->assertOk()->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $this->actingAs($this->owner)->get('/profile')->assertOk()->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    public function test_deployment_check_requires_database_sessions_for_revocation(): void
    {
        config(['session.driver' => 'file']);
        $this->artisan('app:check-deployment')
            ->expectsOutput('FAIL: Database sessions for access revocation')->assertFailed();
        config(['session.driver' => 'database', 'session.table' => 'sessions', 'session.connection' => null]);
        $this->artisan('app:check-deployment')
            ->expectsOutput('OK: Database sessions for access revocation')->assertFailed();
    }

    private function newBrowser(): void
    {
        Auth::forgetGuards();
        $this->defaultCookies = [];
        app('session')->forgetDrivers();
        app()->forgetInstance('session.store');
    }
}
