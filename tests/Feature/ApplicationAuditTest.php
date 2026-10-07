<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\ImageUploadService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ApplicationAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_image_endpoints_store_real_webp_and_replace_old_files(): void
    {
        Storage::fake('public');
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner);

        foreach ([['logo', 'logo'], ['qris-image', 'qris_image'], ['login-image', 'login_image'], ['banners', 'banner']] as [$route, $field]) {
            $key = $field === 'banner' ? 'promo_banner_1' : $field;
            Storage::disk('public')->put('old/'.$key.'.png', 'old image');
            Setting::create(['group' => 'store', 'key' => $key, 'value' => 'old/'.$key.'.png']);
            $this->postJson('/api/settings/'.$route, [$field => UploadedFile::fake()->image('photo.png', 900, 700), 'slot' => 1])->assertOk();
            $path = Setting::where('group', 'store')->where('key', $key)->value('value');
            $this->assertWebp($path);
            Storage::disk('public')->assertMissing('old/'.$key.'.png');
        }

        $this->postJson(route('profile.avatar'), ['avatar' => UploadedFile::fake()->image('avatar.jpg')])->assertOk();
        $this->assertWebp($owner->fresh()->avatar);

        $motor = $this->postJson(route('motorcycles.store'), ['brand' => 'Honda', 'model' => 'Audit', 'year_start' => 2020, 'engine_cc' => 150, 'engine_type' => 'Matic', 'image' => UploadedFile::fake()->image('motor.png')])->assertCreated();
        $this->assertWebp(substr($motor->json('data.image_url'), 9));

        $category = Category::factory()->create();
        $product = $this->postJson('/api/products', ['category_id' => $category->id, 'sku' => 'AUDIT-IMAGE', 'name' => 'Audit', 'price' => 1000, 'image' => UploadedFile::fake()->image('product.png')])->assertCreated();
        $this->assertWebp(Product::findOrFail($product->json('data.id'))->image_path);
    }

    public function test_conversion_compresses_a_noisy_image_below_one_megabyte(): void
    {
        Storage::fake('public');
        $image = imagecreatetruecolor(1600, 1600);
        mt_srand(123);
        for ($y = 0; $y < 1600; $y++) {
            for ($x = 0; $x < 1600; $x++) {
                imagesetpixel($image, $x, $y, mt_rand(0, 0xFFFFFF));
            }
        }
        ob_start();
        imagejpeg($image, null, 95);
        $bytes = ob_get_clean();
        imagedestroy($image);
        $this->assertGreaterThan(1_000_000, strlen($bytes));
        $file = UploadedFile::fake()->createWithContent('noise.jpg', $bytes);
        $path = app(ImageUploadService::class)->store($file, 'test');
        $this->assertWebp($path);
    }

    public function test_failed_persistence_keeps_old_image_and_removes_new_file(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('test/old.png', 'old');
        try {
            app(ImageUploadService::class)->replace(UploadedFile::fake()->image('new.png'), 'test', 'test/old.png', function () {
                throw new \RuntimeException('database failed');
            });
            $this->fail('Expected persistence failure');
        } catch (\RuntimeException $error) {
            $this->assertSame('database failed', $error->getMessage());
        }
        $this->assertSame(['test/old.png'], Storage::disk('public')->allFiles('test'));
    }

    public function test_invalid_conversion_reports_validation_error_without_orphans(): void
    {
        Storage::fake('public');
        try {
            app(ImageUploadService::class)->store(UploadedFile::fake()->createWithContent('bad.jpg', 'not an image'), 'test');
            $this->fail('Expected conversion failure');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('image', $error->errors());
        }
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_reset_endpoint_is_removed_and_tagline_is_configurable(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner)->postJson('/api/settings/reset-transactions')->assertStatus(405);
        $this->postJson('/api/settings', ['settings' => [['group' => 'store', 'key' => 'tagline', 'value' => 'Toko campuran dekat Anda']]])->assertOk();
        $this->get('/settings')->assertInertia(fn ($page) => $page->where('app_settings.store_tagline', 'Toko campuran dekat Anda'));
    }

    public function test_product_price_rejects_negative_or_ambiguous_formats(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner);
        $category = Category::factory()->create();
        foreach (['-1.-2356', '-100', '1e6', '1.000', '99999999999999'] as $value) {
            $this->postJson('/api/products', ['category_id' => $category->id, 'sku' => 'BAD-PRICE', 'name' => 'Audit', 'price' => $value])
                ->assertUnprocessable()->assertJsonValidationErrors('price');
        }
    }

    private function assertWebp(string $path): void
    {
        $this->assertStringEndsWith('.webp', $path);
        $bytes = Storage::disk('public')->get($path);
        $this->assertSame('image/webp', getimagesizefromstring($bytes)['mime']);
        $this->assertLessThan(1_000_000, strlen($bytes));
    }
}
