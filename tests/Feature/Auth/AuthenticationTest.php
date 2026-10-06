<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Auth/Login')
            ->missing('canResetPassword'));
    }

    public function test_owner_can_login_with_valid_credentials(): void
    {
        $this->seed(RoleSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('owner');

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/dashboard');
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_login_ignores_remember_me_requests(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('owner');

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
            'remember' => true,
        ])->assertRedirect('/dashboard')
            ->assertCookieMissing(Auth::guard('web')->getRecallerName());

        $this->assertAuthenticatedAs($user);
    }

    public function test_old_remember_me_cookies_cannot_authenticate(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('owner');
        $guard = Auth::guard('web');
        $cookie = $user->id.'|'.$user->remember_token.'|'.$guard->hashPasswordForCookie($user->password);

        $this->withCookie($guard->getRecallerName(), $cookie)
            ->get('/dashboard')->assertRedirectContains('/login');

        $this->assertGuest();
    }

    public function test_public_password_recovery_endpoints_are_removed(): void
    {
        $this->get('/forgot-password')->assertNotFound();
        $this->post('/forgot-password', ['email' => 'owner@example.com'])->assertNotFound();
        $this->get('/reset-password/old-token')->assertNotFound();
        $this->post('/reset-password', ['token' => 'old-token'])->assertNotFound();
    }

    public function test_cashier_is_redirected_to_pos(): void
    {
        $this->seed(RoleSeeder::class);

        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->post('/login', ['email' => $cashier->email, 'password' => 'password'])
            ->assertRedirect('/pos');
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }

    public function test_unauthenticated_user_is_redirected_from_dashboard(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirectContains('/login');
    }

    public function test_deactivated_user_cannot_login(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('email');
    }
}
