<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\Business;
use App\Models\Scopes\BusinessScope;
use App\Models\User;
use App\Services\BusinessOnboardingService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User as GoogleUser;
use Mockery;
use Tests\TestCase;

class GoogleLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        config(['services.google.client_id' => 'test-client', 'services.google.client_secret' => 'test-secret']);
        Notification::fake();
    }

    private function identity(string $email = 'owner@gmail.com'): void
    {
        $user = (new GoogleUser)->setRaw(['sub' => 'google-123', 'email' => $email, 'email_verified' => true])->map(['id' => 'google-123', 'email' => $email, 'name' => 'Google Owner']);
        $provider = Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('enablePKCE')->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($user);
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
        Socialite::shouldReceive('forgetDrivers')->andReturnSelf();
    }

    private function attempt(?string $userId = null): array
    {
        return ['google_oauth' => ['user_id' => $userId, 'started_at' => time()]];
    }

    private function registerData(): array
    {
        return ['name' => 'Google Owner', 'business_name' => 'Google Shop', 'business_slug' => 'google-shop', 'password' => 'Strong@1234', 'password_confirmation' => 'Strong@1234'];
    }

    public function test_redirect_uses_state_and_pkce_and_requires_credentials(): void
    {
        $response = $this->get('/auth/google/redirect')->assertRedirect();
        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertNotEmpty($query['state']);
        $this->assertNotEmpty($query['code_challenge']);
        $this->assertSame('S256', $query['code_challenge_method']);
        config(['services.google.client_secret' => null]);
        $this->get('/auth/google/redirect')->assertNotFound();
    }

    public function test_invalid_state_does_not_create_or_authenticate_an_account(): void
    {
        $this->withSession($this->attempt())->get('/auth/google/callback?state=forged&code=fake')->assertRedirect('/login')->assertSessionHasErrors('google');
        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_google_signup_creates_verified_gmail_owner_and_one_empty_business(): void
    {
        $this->identity();
        $this->withSession($this->attempt())->get('/auth/google/callback')->assertRedirect('/register/google');
        $this->assertDatabaseCount('users', 0);
        $this->get('/register/google')->assertOk();
        $this->post('/register/google', $this->registerData())->assertRedirect('/dashboard');
        $user = User::withoutGlobalScope(BusinessScope::class)->where('google_id', 'google-123')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertNotNull(Business::findOrFail($user->business_id)->activated_at);
        $this->assertTrue(Hash::check('Strong@1234', $user->password));
        $this->post('/register/google', $this->registerData())->assertRedirect('/dashboard');
        $this->assertDatabaseCount('businesses', 2);
        Notification::assertNothingSent();
    }

    public function test_existing_email_is_never_silently_linked(): void
    {
        $owner = User::factory()->create(['email' => 'owner@gmail.com']);
        $owner->assignRole('owner');
        $this->identity();
        $this->withSession($this->attempt())->get('/auth/google/callback')->assertRedirect('/login')->assertSessionHasErrors('google');
        $this->assertGuest();
        $this->assertNull($owner->fresh()->google_id);
        $this->assertDatabaseCount('businesses', 1);
    }

    public function test_third_party_email_still_requires_email_verification(): void
    {
        $this->identity('owner@example.test');
        $this->withSession($this->attempt())->get('/auth/google/callback')->assertRedirect('/register/google');
        $this->post('/register/google', $this->registerData())->assertRedirect('/verify-email');
        $this->assertNull(Business::where('slug', 'google-shop')->firstOrFail()->activated_at);
    }

    public function test_linked_account_logs_in_to_its_existing_business(): void
    {
        $user = app(BusinessOnboardingService::class)->register([...$this->registerData(), 'email' => 'owner@gmail.com'], ['id' => 'google-123', 'email' => 'owner@gmail.com', 'trusted_email' => true]);
        $this->identity();
        $this->withSession($this->attempt())->get('/auth/google/callback')->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->get('/dashboard')->assertOk()->assertInertia(fn ($page) => $page->where('business.id', $user->business_id));
        $this->assertDatabaseCount('businesses', 2);
    }

    public function test_inactive_linked_accounts_are_rejected(): void
    {
        $user = User::factory()->create(['is_active' => false]);
        $user->assignRole('owner');
        $user->forceFill(['google_id' => 'google-123'])->save();
        $this->identity();
        $this->withSession($this->attempt())->get('/auth/google/callback')->assertRedirect('/login')->assertSessionHasErrors('google');
        $this->assertGuest();
    }

    public function test_link_and_disconnect_require_current_password(): void
    {
        $user = User::factory()->create();
        $user->assignRole('owner');
        $this->actingAs($user)->post('/profile/google', ['current_password' => 'wrong'])->assertSessionHasErrors('current_password');
        $this->delete('/profile/google', ['current_password' => 'wrong'])->assertSessionHasErrors('current_password');
        $this->identity();
        $this->withSession($this->attempt($user->id))->get('/auth/google/callback')->assertRedirect('/profile');
        $this->assertSame('google-123', $user->fresh()->google_id);
        $this->delete('/profile/google', ['current_password' => 'password'])->assertRedirect();
        $this->assertNull($user->fresh()->google_id);
    }
}
