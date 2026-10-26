<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class InactiveAccountAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_inactive_bearer_account_is_denied_without_a_browser_session(): void
    {
        $user = User::factory()->create(['is_active' => false]);
        $token = $user->createToken('existing-access')->plainTextToken;
        $user->createToken('other-device');

        $this->withHeader('Authorization', 'Bearer '.$token)->getJson('/api/user')
            ->assertForbidden()->assertJsonPath('message', 'Akun Anda telah dinonaktifkan.');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_active_verified_bearer_account_can_still_read_its_identity(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('active-access')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)->getJson('/api/user')
            ->assertOk()->assertJsonPath('id', $user->id);
    }

    public function test_deactivating_staff_revokes_all_tokens_and_sessions_immediately(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $staff = User::factory()->create();
        $staff->assignRole('cashier');
        $staff->createToken('staff-device');
        $owner->createToken('owner-device');
        foreach ([$staff, $owner] as $user) {
            DB::table('sessions')->insert([
                'id' => 'session-'.$user->id, 'user_id' => $user->id,
                'payload' => base64_encode(serialize([])), 'last_activity' => time(),
            ]);
        }

        $this->actingAs($owner)->putJson('/api/users/'.$staff->id, [
            'name' => $staff->name, 'email' => $staff->email, 'role' => 'cashier', 'is_active' => false,
        ])->assertOk();

        $this->assertFalse($staff->fresh()->is_active);
        $this->assertEquals(0, $staff->tokens()->count());
        $this->assertDatabaseMissing('sessions', ['user_id' => $staff->id]);
        $this->assertEquals(1, $owner->tokens()->count());
        $this->assertDatabaseHas('sessions', ['user_id' => $owner->id]);
    }

    public function test_inactive_browser_account_is_logged_out_and_redirected(): void
    {
        $user = User::factory()->create(['is_active' => false]);
        $this->actingAs($user)->get('/profile')->assertRedirect('/login');
        $this->assertGuest('web');
    }
}
