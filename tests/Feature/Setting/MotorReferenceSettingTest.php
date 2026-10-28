<?php

declare(strict_types=1);

namespace Tests\Feature\Setting;

use App\Models\Business;
use App\Models\DataType;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\BusinessContext;
use App\Services\SettingService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MotorReferenceSettingTest extends TestCase
{
    use RefreshDatabase;

    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->business = Business::create(['name' => 'Empty reference shop', 'slug' => 'empty-reference-shop']);
        $this->business->forceFill(['activated_at' => now()])->save();
        $owner = $this->inside(fn () => User::factory()->create());
        $owner->assignRole('owner');
        $this->actingAs($owner);
    }

    private function inside(\Closure $callback): mixed
    {
        return app(BusinessContext::class)->run($this->business->id, $callback);
    }

    private function toggle(string $key, bool $enabled): void
    {
        $this->postJson('/api/settings', ['settings' => [['group' => 'references', 'key' => $key, 'value' => $enabled ? 'true' : 'false']]])->assertOk();
    }

    public function test_empty_store_gets_the_special_motor_module_automatically_and_only_once(): void
    {
        $this->get('/s/'.$this->business->slug)->assertInertia(fn ($page) => $page->where('app_settings.motorcycle_references_enabled', false)->where('public_reference_modules', []));
        $this->inside(fn () => $this->assertSame(0, DataType::count()));
        $this->toggle('enabled', false);
        $this->toggle('motorcycles_enabled', true);
        $motor = $this->inside(fn () => DataType::sole());
        $this->assertSame('motorcycles', $motor->driver);
        $this->assertSame([], $motor->fields);
        $this->inside(fn () => $this->assertSame(0, Motorcycle::count()));
        $this->get('/data-types?kind=reference')->assertInertia(fn ($page) => $page->has('types', 1)->where('types.0.driver', 'motorcycles')->where('app_settings.motorcycle_module_enabled', true)->where('reference_modules.0.path', '/motorcycles'));
        $this->get('/s/'.$this->business->slug)->assertInertia(fn ($page) => $page->where('app_settings.references_enabled', false)->has('public_reference_modules', 1)->where('public_reference_modules.0.path', '/motor-saya'));
        $this->toggle('motorcycles_enabled', true);
        $this->toggle('motorcycles_enabled', false);
        $this->get('/settings')->assertInertia(fn ($page) => $page->where('reference_modules', []));
        $this->get('/motor-saya?shop='.$this->business->slug)->assertRedirect('/s/'.$this->business->slug);
        $this->toggle('motorcycles_enabled', true);
        $this->assertSame($motor->id, $this->inside(fn () => DataType::sole()->id));
    }

    public function test_four_setting_combinations_control_motor_and_other_references_independently(): void
    {
        $custom = $this->inside(fn () => DataType::create(['kind' => 'reference', 'key' => 'bikes', 'name' => 'Sepeda', 'fields' => [], 'is_public' => true]));
        foreach ([[false, false], [true, false], [false, true], [true, true]] as [$motor, $other]) {
            $this->toggle('motorcycles_enabled', $motor);
            $this->toggle('enabled', $other);
            $this->get('/s/'.$this->business->slug)->assertInertia(fn ($page) => $page
                ->where('app_settings.motorcycle_references_enabled', $motor)
                ->has('public_reference_modules', (int) $motor + (int) $other)
                ->where('public_reference_modules', fn ($modules) => collect($modules)->contains('id', $custom->id) === $other));
            $finder = $this->get('/cari-kecocokan?shop='.$this->business->slug);
            $motor || $other ? $finder->assertOk() : $finder->assertRedirect('/s/'.$this->business->slug);
            $customPage = $this->get('/cari-kecocokan/'.$custom->id.'?shop='.$this->business->slug);
            if ($other) {
                $customPage->assertOk();
            } elseif ($motor) {
                $customPage->assertNotFound();
            } else {
                $customPage->assertRedirect('/s/'.$this->business->slug);
            }
            $motorPage = $this->get('/motor-saya?shop='.$this->business->slug);
            $motor ? $motorPage->assertOk() : $motorPage->assertRedirect('/s/'.$this->business->slug);
        }
    }

    public function test_turning_motor_off_and_on_preserves_models_mapping_stock_and_other_business(): void
    {
        $this->toggle('motorcycles_enabled', true);
        [$motorcycle, $product, $mapping] = $this->inside(function () {
            $motorcycle = Motorcycle::create(['brand' => 'Honda', 'model' => 'QA', 'slug' => 'motor-qa', 'year_start' => 2025, 'engine_cc' => 110]);
            $product = Product::factory()->create(['stock' => 17]);
            $mapping = MotorcyclePart::create(['motorcycle_id' => $motorcycle->id, 'product_id' => $product->id, 'part_category' => 'oli']);

            return [$motorcycle, $product, $mapping];
        });
        $this->toggle('motorcycles_enabled', false);
        $this->getJson('/api/motor-saya/'.$motorcycle->id.'/parts?shop='.$this->business->slug)->assertForbidden();
        $this->toggle('motorcycles_enabled', true);
        $this->getJson('/api/motor-saya/'.$motorcycle->id.'/parts?shop='.$this->business->slug)->assertOk();
        $this->inside(function () use ($motorcycle, $product, $mapping): void {
            $this->assertSame($motorcycle->id, Motorcycle::sole()->id);
            $this->assertSame($mapping->id, MotorcyclePart::sole()->id);
            $this->assertSame(17, $product->fresh()->stock);
            $this->assertSame(1, DataType::where('driver', 'motorcycles')->count());
        });
        $this->assertTrue(app(SettingService::class)->publicMotorcyclesEnabled());
        $this->assertSame(1, DataType::where('driver', 'motorcycles')->count());
    }

    public function test_name_collision_does_not_convert_custom_motor_to_the_special_module(): void
    {
        $custom = $this->inside(fn () => DataType::create(['kind' => 'reference', 'key' => 'motorcycles', 'name' => 'Motor', 'fields' => []]));
        $this->toggle('motorcycles_enabled', false);
        $setting = $this->inside(fn () => Setting::where('group', 'references')->where('key', 'motorcycles_enabled')->sole());
        $this->putJson('/api/settings/'.$setting->id, ['value' => 'true'])->assertOk();
        $this->inside(function () use ($custom): void {
            $this->assertNull($custom->fresh()->driver);
            $motor = DataType::where('driver', 'motorcycles')->sole();
            $this->assertNotSame($custom->id, $motor->id);
            $this->assertNotSame($custom->key, $motor->key);
            $this->assertNotSame($custom->name, $motor->name);
        });
    }

    public function test_deleting_motor_turns_its_flag_off_and_it_can_be_created_again(): void
    {
        $this->toggle('motorcycles_enabled', true);
        $motor = $this->inside(fn () => DataType::where('driver', 'motorcycles')->sole());
        $this->putJson('/data-types/'.$motor->id, ['kind' => 'reference', 'name' => 'Motor', 'fields' => [], 'version' => 1, 'is_public' => true])->assertUnprocessable();
        $this->deleteJson('/data-types/'.$motor->id)->assertOk();
        $this->inside(fn () => $this->assertFalse(app(SettingService::class)->publicMotorcyclesEnabled()));
        $this->get('/settings')->assertInertia(fn ($page) => $page->where('initialSettings.references_motorcycles_enabled', 'false'));
        $this->toggle('motorcycles_enabled', true);
        $this->inside(fn () => $this->assertNotSame($motor->id, DataType::where('driver', 'motorcycles')->sole()->id));
    }

    public function test_invalid_toggle_and_cashier_cannot_create_a_motor_module(): void
    {
        $this->postJson('/api/settings', ['settings' => [['group' => 'references', 'key' => 'motorcycles_enabled', 'value' => 'yes']]])->assertUnprocessable();
        $cashier = $this->inside(fn () => User::factory()->create());
        $cashier->assignRole('cashier');
        $this->actingAs($cashier)->postJson('/api/settings', ['settings' => [['group' => 'references', 'key' => 'motorcycles_enabled', 'value' => 'true']]])->assertForbidden();
        $this->inside(fn () => $this->assertSame(0, DataType::count()));
    }

    public function test_migration_preserves_previous_motor_visibility_without_creating_data(): void
    {
        foreach ([[true, true, true], [false, true, false], [true, false, false]] as $index => [$enabled, $public, $expected]) {
            $business = Business::create(['name' => 'Migration '.$index, 'slug' => 'migration-reference-'.$index]);
            app(BusinessContext::class)->run($business->id, function () use ($enabled, $public): void {
                app(SettingService::class)->upsertSetting('references', 'enabled', $enabled ? 'true' : 'false');
                $type = DataType::create(['kind' => 'reference', 'key' => 'motorcycles', 'name' => 'Motor', 'fields' => [], 'is_public' => $public]);
                $type->forceFill(['driver' => 'motorcycles'])->save();
            });
            $migration = require database_path('migrations/2026_10_28_000002_split_motorcycle_reference_setting.php');
            $migration->up();
            app(BusinessContext::class)->run($business->id, function () use ($expected): void {
                $this->assertSame($expected, app(SettingService::class)->publicMotorcyclesEnabled());
                $this->assertSame(1, DataType::count());
                $this->assertSame(0, Motorcycle::count());
            });
        }
        $this->inside(function (): void {
            $this->assertFalse(app(SettingService::class)->publicMotorcyclesEnabled());
            $this->assertSame(0, DataType::count());
        });
    }
}
