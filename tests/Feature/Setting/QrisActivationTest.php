<?php

declare(strict_types=1);

namespace Tests\Feature\Setting;

use App\Models\Business;
use App\Models\Setting;
use App\Models\User;
use App\Services\BusinessContext;
use App\Services\CacheService;
use App\Services\QrisService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Unit\QrisPayloadServiceTest;

class QrisActivationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        Storage::fake('public');
    }

    private function staff(string $role = 'owner'): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    private function setting(string $group, string $key, ?string $value): void
    {
        Setting::updateOrCreate(compact('group', 'key'), ['value' => $value, 'type' => 'string']);
        CacheService::flushSettings();
    }

    private function configure(): void
    {
        $this->setting('store', 'qris_image', 'qris/store.webp');
        $this->setting('store', 'qris_payload', QrisPayloadServiceTest::sample());
        $this->setting('payment', 'qris_enabled', 'false');
    }

    private function toggle(string $value)
    {
        return $this->postJson('/api/settings', ['settings' => [
            ['group' => 'payment', 'key' => 'qris_enabled', 'value' => $value],
        ]]);
    }

    public function test_owner_can_activate_without_unrelated_profile_fields_and_both_clients_receive_fresh_availability(): void
    {
        $this->configure();
        $this->actingAs($this->staff());
        $this->get($this->storeUrl('/payment'))->assertInertia(fn ($page) => $page->where('app_settings.customer_qris_enabled', false));
        $this->get('/settings')->assertInertia(fn ($page) => $page
            ->where('initialSettings.payment_qris_enabled', 'false')
            ->where('qrisConfig.enabled', false)->where('qrisConfig.available', false)
            ->where('qrisConfig.dynamic_available', true));
        $this->getJson('/api/settings/qris-image')->assertOk()->assertJsonPath('enabled', false)->assertJsonPath('available', false);
        $this->toggle('true')->assertOk();
        $this->get($this->storeUrl('/payment'))->assertInertia(fn ($page) => $page->where('app_settings.customer_qris_enabled', true));
        $this->getJson('/api/settings/qris-image')->assertOk()->assertJsonPath('enabled', true)->assertJsonPath('available', true);
        $this->get('/settings')->assertInertia(fn ($page) => $page->where('initialSettings.payment_qris_enabled', 'true'));
        $this->toggle('false')->assertOk();
        $this->get($this->storeUrl('/payment'))->assertInertia(fn ($page) => $page->where('app_settings.customer_qris_enabled', false));
        $this->getJson('/api/settings/qris-image')->assertOk()->assertJsonPath('enabled', false)->assertJsonPath('available', false);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_upload_and_amount_activation_do_not_silently_enable_payment(): void
    {
        $this->actingAs($this->staff());
        $this->setting('payment', 'qris_enabled', 'false');
        $response = $this->postJson('/api/settings/qris-image', ['qris_image' => UploadedFile::fake()->image('store.png')])
            ->assertOk()->assertJsonPath('enabled', false)->assertJsonPath('available', false);
        $this->postJson('/api/settings/qris-payload', [
            'qris_payload' => QrisPayloadServiceTest::sample(), 'image_revision' => $response->json('image_revision'),
        ])->assertOk()->assertJsonPath('enabled', false)->assertJsonPath('available', false)->assertJsonPath('dynamic_available', true);
        $this->assertSame('false', Setting::where('group', 'payment')->where('key', 'qris_enabled')->value('value'));
        $this->toggle('true')->assertOk();
        $this->getJson('/api/settings/qris-image')->assertOk()->assertJsonPath('available', true);
    }

    public function test_deleting_the_qr_disables_payment_and_reupload_requires_explicit_activation(): void
    {
        $this->configure();
        $this->actingAs($this->staff());
        $this->toggle('true')->assertOk();
        $this->get($this->storeUrl('/payment'))->assertInertia(fn ($page) => $page->where('app_settings.customer_qris_enabled', true));
        $this->deleteJson('/api/settings/qris-image')->assertOk();
        $this->assertSame('false', Setting::where('group', 'payment')->where('key', 'qris_enabled')->value('value'));
        $this->getJson('/api/settings/qris-image')->assertOk()->assertJsonPath('enabled', false)->assertJsonPath('url', null);
        $this->get($this->storeUrl('/payment'))->assertInertia(fn ($page) => $page->where('app_settings.customer_qris_enabled', false));
        $this->postJson('/api/settings/qris-image', ['qris_image' => UploadedFile::fake()->image('new.png')])
            ->assertOk()->assertJsonPath('enabled', false)->assertJsonPath('available', false);
    }

    public function test_an_enabled_flag_without_a_qr_image_still_cannot_make_qris_available(): void
    {
        $this->actingAs($this->staff());
        $this->setting('payment', 'qris_enabled', 'true');
        $this->getJson('/api/settings/qris-image')->assertOk()->assertJsonPath('enabled', true)->assertJsonPath('available', false)->assertJsonPath('url', null);
        $this->get($this->storeUrl('/payment'))->assertInertia(fn ($page) => $page->where('app_settings.customer_qris_enabled', false));
    }

    public function test_only_owner_can_toggle_and_invalid_values_are_rejected(): void
    {
        $this->configure();
        $this->toggle('true')->assertUnauthorized();
        $this->actingAs($this->staff('cashier'));
        $this->toggle('true')->assertForbidden();
        $this->getJson('/api/settings/qris-image')->assertOk()->assertJsonPath('enabled', false);
        $this->actingAs($this->staff());
        $this->toggle('yes')->assertUnprocessable()->assertJsonValidationErrors('settings.0.value');
        $this->assertSame('false', Setting::where('group', 'payment')->where('key', 'qris_enabled')->value('value'));
    }

    public function test_activation_is_scoped_to_the_owner_business(): void
    {
        $this->configure();
        $other = Business::create(['name' => 'Other QRIS', 'slug' => 'other-qris']);
        app(BusinessContext::class)->run($other->id, fn () => $this->configure());
        $this->actingAs($this->staff());
        $this->toggle('true')->assertOk();
        $this->assertTrue(app(QrisService::class)->configuration()['enabled']);
        $otherConfig = app(BusinessContext::class)->run($other->id, fn () => app(QrisService::class)->configuration());
        $this->assertFalse($otherConfig['enabled']);
        $this->assertFalse($otherConfig['available']);
    }
}
