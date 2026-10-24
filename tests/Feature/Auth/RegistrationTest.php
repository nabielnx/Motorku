<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\Business;
use App\Models\Product;
use App\Models\Scopes\BusinessScope;
use App\Models\Setting;
use App\Models\User;
use App\Services\BusinessContext;
use Database\Seeders\RoleSeeder;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function data(): array
    {
        return ['name' => 'Owner Baru', 'business_name' => 'Toko Baru', 'business_slug' => 'toko-baru', 'email' => 'new@example.test', 'password' => 'Strong@1234', 'password_confirmation' => 'Strong@1234'];
    }

    public function test_owner_registers_a_separate_empty_business_and_verifies_email(): void
    {
        $this->seed(RoleSeeder::class);
        Notification::fake();
        $this->get('/register')->assertOk();
        $this->post('/register', $this->data())->assertRedirect('/verify-email');
        $owner = User::withoutGlobalScope(BusinessScope::class)->where('email', 'new@example.test')->firstOrFail();
        $this->assertAuthenticatedAs($owner);
        $this->assertTrue($owner->hasRole('owner'));
        $this->assertNotEquals(BusinessContext::LEGACY_ID, $owner->business_id);
        $this->assertNull($owner->email_verified_at);
        $this->assertDatabaseCount('businesses', 2);
        app(BusinessContext::class)->run($owner->business_id, function (): void {
            $this->assertSame(0, Product::count());
            $this->assertSame('Toko Baru', Setting::where('key', 'name')->firstOrFail()->value);
        });
        Notification::assertSentTo($owner, VerifyEmail::class);
        $this->get('/dashboard')->assertRedirect('/verify-email');
        $this->get('/s/toko-baru')->assertNotFound();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $owner->id, 'hash' => sha1($owner->email)]);
        $this->get($url)->assertRedirect('/dashboard');
        $this->assertNotNull(Business::findOrFail($owner->business_id)->activated_at);
        $this->get('/s/toko-baru')->assertOk();
        $this->get('/dashboard')->assertOk();
    }

    public function test_registration_rejects_ownership_and_role_injection(): void
    {
        $this->seed(RoleSeeder::class);
        $this->post('/register', [...$this->data(), 'business_id' => BusinessContext::LEGACY_ID, 'role' => 'owner', 'email_verified_at' => now()->toIso8601String()])
            ->assertSessionHasErrors(['business_id', 'role', 'email_verified_at']);
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('businesses', 1);
    }

    public function test_business_addresses_and_account_emails_are_globally_unique(): void
    {
        $this->seed(RoleSeeder::class);
        Notification::fake();
        $this->post('/register', $this->data())->assertRedirect('/verify-email');
        $this->post('/logout');
        $this->post('/register', $this->data())->assertSessionHasErrors(['email', 'business_slug']);
        $this->assertDatabaseCount('businesses', 2);
    }
}
