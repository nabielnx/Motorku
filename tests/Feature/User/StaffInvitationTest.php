<?php

namespace Tests\Feature\User;

use App\Models\User;
use App\Notifications\StaffInvitation;
use App\Services\UserService;
use Database\Seeders\RoleSeeder;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class StaffInvitationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        Notification::fake();
        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
    }

    private function invite(string $role = 'cashier'): array
    {
        $user = app(UserService::class)->inviteEmployee([
            'name' => 'Staf Uji', 'email' => 'staff@example.test', 'role' => $role,
        ]);

        return [$user, Notification::sent($user, StaffInvitation::class)->last()->token];
    }

    private function accept(User $user, string $token)
    {
        return $this->post(route('staff.invitation.accept'), [
            'email' => $user->email, 'token' => $token,
            'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!',
        ]);
    }

    public function test_invitation_uses_a_hashed_token_and_never_returns_it_to_owner(): void
    {
        $response = $this->actingAs($this->owner)->postJson('/api/users', [
            'name' => 'Staf Uji', 'email' => ' STAFF@EXAMPLE.TEST ', 'role' => 'cashier',
        ])->assertCreated()->assertJsonPath('data.invitation_pending', true)->assertJsonPath('data.email_verified_at', null);
        $user = User::where('email', 'staff@example.test')->firstOrFail();
        $notification = Notification::sent($user, StaffInvitation::class)->sole();
        $stored = DB::table('password_reset_tokens')->where('email', $user->email)->value('token');
        $this->assertNotSame($notification->token, $stored);
        $this->assertTrue(Hash::check($notification->token, $stored));
        $this->assertStringNotContainsString($notification->token, $response->getContent());
        $this->assertFalse(Hash::check('password', $user->password));
        $this->assertStringContainsString(route('staff.invitation.show', ['token' => $notification->token, 'email' => $user->email]), $notification->toMail($user)->actionUrl);
    }

    public function test_owner_cannot_assign_a_password_when_inviting(): void
    {
        $this->actingAs($this->owner)->postJson('/api/users', [
            'name' => 'Staf', 'email' => 'staff@example.test', 'role' => 'cashier', 'password' => 'password123',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertDatabaseMissing('users', ['email' => 'staff@example.test']);
        Notification::assertNothingSent();
    }

    public function test_new_owner_and_promotion_require_current_actor_password(): void
    {
        $payload = ['name' => 'Owner Kedua', 'email' => 'owner2@example.test', 'role' => 'owner'];
        $this->actingAs($this->owner)->postJson('/api/users', $payload)->assertUnprocessable()->assertJsonValidationErrors('owner_password');
        $this->postJson('/api/users', [...$payload, 'owner_password' => 'wrong'])->assertUnprocessable();
        $this->postJson('/api/users', [...$payload, 'owner_password' => 'password'])->assertCreated();
        $this->assertTrue(User::where('email', $payload['email'])->firstOrFail()->hasRole('owner'));
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->putJson("/api/users/{$cashier->id}", ['role' => 'owner'])->assertUnprocessable()->assertJsonValidationErrors('owner_password');
        $this->assertTrue($cashier->fresh()->hasRole('cashier'));
        try {
            app(UserService::class)->updateEmployee($cashier->id, ['role' => 'owner']);
            $this->fail('The locked account must still require confirmation after form validation.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('owner_password', $error->errors());
        }
        $this->putJson("/api/users/{$cashier->id}", ['role' => 'owner', 'owner_password' => 'password'])->assertOk();
        $this->assertTrue($cashier->fresh()->hasRole('owner'));
    }

    public function test_cashier_cannot_invite_or_resend_staff(): void
    {
        [$invited] = $this->invite();
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->actingAs($cashier)->postJson('/api/users', ['role' => 'owner', 'owner_password' => 'password'])->assertForbidden();
        $this->postJson("/api/users/{$invited->id}/invitation")->assertForbidden();
    }

    public function test_accepting_invitation_verifies_email_and_consumes_token(): void
    {
        [$user, $token] = $this->invite();
        $this->get(route('staff.invitation.show', ['token' => $token, 'email' => $user->email]))
            ->assertHeader('Referrer-Policy', 'no-referrer')->assertHeader('Cache-Control', 'no-store, private')
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Auth/AcceptInvitation')->where('valid', true));
        $this->accept($user, $token)->assertSessionHasNoErrors()->assertRedirect('/login');
        $user->refresh();
        $this->assertFalse($user->invitation_pending);
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertTrue(Hash::check('NewPassword123!', $user->password));
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->accept($user, $token)->assertSessionHasErrors('email');
        $this->post('/login', ['email' => $user->email, 'password' => 'NewPassword123!'])->assertRedirect('/pos');
    }

    public function test_owner_invitation_activates_a_second_owner(): void
    {
        [$user, $token] = $this->invite('owner');
        $this->accept($user, $token)->assertRedirect('/login');
        $this->post('/login', ['email' => $user->email, 'password' => 'NewPassword123!'])->assertRedirect('/dashboard');
        $this->assertSame(2, User::role('owner')->whereNotNull('email_verified_at')->count());
    }

    public function test_invalid_expired_and_inactive_invitations_cannot_activate(): void
    {
        [$user, $token] = $this->invite();
        $this->accept($user, 'wrong-token')->assertSessionHasErrors('email');
        $this->post(route('staff.invitation.accept'), ['email' => 'wrong@example.test', 'token' => $token, 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'])->assertSessionHasErrors('email');
        $user->update(['is_active' => false]);
        $this->accept($user, $token)->assertSessionHasErrors('email');
        $user->update(['is_active' => true]);
        $this->travel(25)->hours();
        $this->accept($user, $token)->assertSessionHasErrors('email');
        $this->get(route('staff.invitation.show', ['token' => $token, 'email' => $user->email]))->assertInertia(fn (AssertableInertia $page) => $page->where('valid', false));
        $this->assertTrue($user->fresh()->invitation_pending);
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_password_confirmation_is_required_for_activation(): void
    {
        [$user, $token] = $this->invite();
        $this->post(route('staff.invitation.accept'), ['email' => $user->email, 'token' => $token, 'password' => 'NewPassword123!', 'password_confirmation' => 'different-password'])->assertSessionHasErrors('password');
        $this->assertTrue(app(UserService::class)->isInvitationValid($user->email, $token));
    }

    public function test_resend_is_throttled_and_invalidates_old_link(): void
    {
        [$user, $token] = $this->invite();
        $this->actingAs($this->owner)->postJson("/api/users/{$user->id}/invitation")->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->travel(61)->seconds();
        $this->postJson("/api/users/{$user->id}/invitation")->assertOk();
        $newToken = Notification::sent($user, StaffInvitation::class)->last()->token;
        $this->assertFalse(app(UserService::class)->isInvitationValid($user->email, $token));
        $this->assertTrue(app(UserService::class)->isInvitationValid($user->email, $newToken));
    }

    public function test_accepted_account_cannot_use_invitation_to_reset_password(): void
    {
        $token = Password::broker('staff_invitations')->createToken($this->owner);
        $this->assertFalse(app(UserService::class)->isInvitationValid($this->owner->email, $token));
        $this->accept($this->owner, $token)->assertSessionHasErrors('email');
        $this->assertTrue(Hash::check('password', $this->owner->fresh()->password));
        $this->actingAs($this->owner)->postJson("/api/users/{$this->owner->id}/invitation")->assertUnprocessable();
    }

    public function test_editing_invited_email_replaces_link_and_requires_confirmation(): void
    {
        [$user, $token] = $this->invite();
        $oldEmail = $user->email;
        $this->actingAs($this->owner)->putJson("/api/users/{$user->id}", ['email' => 'new@example.test'])->assertUnprocessable()->assertJsonValidationErrors('owner_password');
        $this->putJson("/api/users/{$user->id}", ['email' => 'new@example.test', 'owner_password' => 'password'])->assertOk();
        $this->assertFalse(app(UserService::class)->isInvitationValid($oldEmail, $token));
        $user->refresh();
        $newToken = Notification::sent($user, StaffInvitation::class)->last()->token;
        $this->assertTrue(app(UserService::class)->isInvitationValid($user->email, $newToken));
        $this->putJson("/api/users/{$user->id}", ['password' => 'admin-password', 'owner_password' => 'password'])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_deleting_invited_account_removes_token(): void
    {
        [$user, $token] = $this->invite('owner');
        $this->actingAs($this->owner)->deleteJson("/api/users/{$user->id}")->assertOk();
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        Auth::logout();
        $this->accept($user, $token)->assertSessionHasErrors('email');
    }

    public function test_mail_failure_rolls_back_invitation_and_preserves_old_link_on_resend(): void
    {
        Notification::shouldReceive('send')->once()->andThrow(new \RuntimeException('mail transport unavailable'));
        $this->actingAs($this->owner)->postJson('/api/users', ['name' => 'Staff', 'email' => 'staff@example.test', 'role' => 'cashier'])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertDatabaseMissing('users', ['email' => 'staff@example.test']);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'staff@example.test']);

        Notification::fake();
        [$user, $token] = $this->invite();
        $this->travel(61)->seconds();
        Notification::shouldReceive('send')->once()->andThrow(new \RuntimeException('mail transport unavailable'));
        $this->postJson("/api/users/{$user->id}/invitation")->assertUnprocessable();
        $this->assertTrue(app(UserService::class)->isInvitationValid($user->email, $token));
    }

    public function test_pending_or_unverified_owner_does_not_replace_last_usable_owner(): void
    {
        [$pending] = $this->invite('owner');
        $unverified = User::factory()->unverified()->create();
        $unverified->assignRole('owner');
        $this->actingAs($this->owner)->get('/users')->assertInertia(fn (AssertableInertia $page) => $page->where('activeOwnersCount', 1));
        try {
            app(UserService::class)->deleteEmployee($this->owner->id, true);
            $this->fail('Deleting the last usable owner must fail.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('password', $error->errors());
        }
        $this->deleteJson("/api/users/{$pending->id}")->assertOk();
    }

    public function test_unverified_staff_cannot_access_web_or_api_but_can_verify_and_edit_profile(): void
    {
        $this->owner->forceFill(['email_verified_at' => null])->save();
        $this->post('/login', ['email' => $this->owner->email, 'password' => 'password'])->assertRedirect('/verify-email');
        $this->get('/dashboard')->assertRedirect('/verify-email');
        $this->getJson('/api/users')->assertForbidden();
        $this->postJson('/api/users', ['name' => 'Staff'])->assertForbidden();
        $this->get('/profile')->assertOk();
        $this->get('/verify-email')->assertOk();
        $this->post('/email/verification-notification')->assertSessionHas('status', 'verification-link-sent');
        Notification::assertSentTo($this->owner, VerifyEmail::class);
    }

    public function test_pending_account_cannot_login_even_with_known_password(): void
    {
        [$user] = $this->invite();
        $user->update(['password' => Hash::make('known-password')]);
        $this->post('/login', ['email' => $user->email, 'password' => 'known-password'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_profile_email_change_requires_password_and_sends_verification(): void
    {
        $payload = ['name' => $this->owner->name, 'email' => 'changed@example.test'];
        $this->actingAs($this->owner)->patch('/profile', $payload)->assertSessionHasErrors('current_password');
        $this->patch('/profile', [...$payload, 'current_password' => 'password'])->assertSessionHasNoErrors();
        $this->assertNull($this->owner->fresh()->email_verified_at);
        Notification::assertSentTo($this->owner->fresh(), VerifyEmail::class);
        $this->get('/dashboard')->assertRedirect('/verify-email');
    }

    public function test_profile_email_change_rolls_back_if_verification_mail_fails(): void
    {
        $oldEmail = $this->owner->email;
        Notification::shouldReceive('send')->once()->andThrow(new \RuntimeException('mail transport unavailable'));
        $this->actingAs($this->owner)->patch('/profile', [
            'name' => $this->owner->name, 'email' => 'changed@example.test', 'current_password' => 'password',
        ])->assertSessionHasErrors('email');
        $this->assertSame($oldEmail, $this->owner->fresh()->email);
        $this->assertTrue($this->owner->fresh()->hasVerifiedEmail());
    }

    public function test_staff_identity_changes_require_confirmation_and_revoke_old_access(): void
    {
        $staff = User::factory()->create();
        $staff->assignRole('cashier');
        DB::table('sessions')->insert([
            'id' => 'old-staff-session', 'user_id' => $staff->id, 'payload' => '', 'last_activity' => now()->timestamp,
        ]);
        $staff->createToken('old-access');
        $this->actingAs($this->owner)->putJson("/api/users/{$staff->id}", ['password' => 'NewPassword123!'])->assertUnprocessable()->assertJsonValidationErrors('owner_password');
        $this->assertDatabaseHas('sessions', ['id' => 'old-staff-session']);
        $this->putJson("/api/users/{$staff->id}", ['password' => 'NewPassword123!', 'owner_password' => 'password'])->assertOk();
        $this->assertDatabaseMissing('sessions', ['id' => 'old-staff-session']);
        $this->assertSame(0, $staff->tokens()->count());
        $this->assertTrue(Hash::check('NewPassword123!', $staff->fresh()->password));

        DB::table('sessions')->insert([
            'id' => 'old-owner-device', 'user_id' => $this->owner->id, 'payload' => '', 'last_activity' => now()->timestamp,
        ]);
        $this->owner->createToken('old-owner-access');
        $this->patch('/profile', ['name' => $this->owner->name, 'email' => 'new-owner@example.test', 'current_password' => 'password'])->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('sessions', ['id' => 'old-owner-device']);
        $this->assertSame(0, $this->owner->tokens()->count());
        $this->assertAuthenticatedAs($this->owner);
    }
}
