<?php

declare(strict_types=1);

namespace Tests\Feature\Performance;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use App\Services\BusinessContext;
use App\Services\ImagePreviewService;
use App\Services\ImageUploadService;
use App\Services\SettingService;
use App\Support\BusinessFiles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Vite;
use Intervention\Image\ImageManager;
use Tests\TestCase;

final class ImagePreviewTest extends TestCase
{
    use RefreshDatabase;

    private function photo(): UploadedFile
    {
        $image = imagecreatetruecolor(1200, 1200);
        for ($i = 0; $i < 240; $i++) {
            imagefilledrectangle($image, ($i * 37) % 1200, ($i * 79) % 1200, min(1199, ($i * 37) % 1200 + 80), min(1199, ($i * 79) % 1200 + 100), (($i * 137) % 0xFFFFFF));
        }
        ob_start();
        imagepng($image);
        $bytes = ob_get_clean();
        imagedestroy($image);

        return UploadedFile::fake()->createWithContent('photo.png', $bytes);
    }

    public function test_upload_keeps_the_original_and_creates_one_smaller_preview_used_by_the_public_catalog(): void
    {
        Storage::fake('public');
        $path = app(ImageUploadService::class)->store($this->photo(), 'products');
        $preview = app(ImagePreviewService::class)->existing($path);
        $this->assertNotNull($preview);
        $this->assertCount(2, Storage::disk('public')->allFiles());
        $this->assertLessThan(Storage::disk('public')->size($path), Storage::disk('public')->size($preview));
        $size = getimagesize(Storage::disk('public')->path($preview));
        $this->assertSame([480, 480], [$size[0], $size[1]]);
        $this->assertSame(IMAGETYPE_WEBP, $size[2]);
        $product = Product::factory()->create(['image_path' => $path]);
        $this->getJson($this->storeUrl('/catalog/products'))->assertOk()
            ->assertJsonPath('data.products.0.image_path', $path)->assertJsonPath('data.products.0.image_preview_path', $preview);
        $this->assertSame($preview, app(ImagePreviewService::class)->generate($path));
        $this->assertCount(2, Storage::disk('public')->allFiles());
        BusinessFiles::delete($product->image_path);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_foreign_paths_and_non_catalog_uploads_cannot_generate_or_delete_previews(): void
    {
        Storage::fake('public');
        $foreign = Business::create(['name' => 'Foreign', 'slug' => 'preview-foreign']);
        $path = 'products/'.$foreign->id.'/image.webp';
        Storage::disk('public')->put($path, 'foreign');
        Storage::disk('public')->put(str_replace('.webp', '.preview.webp', $path), 'foreign preview');
        $this->assertNull(app(ImagePreviewService::class)->generate($path));
        $this->assertFalse(BusinessFiles::delete($path));
        $this->assertCount(2, Storage::disk('public')->allFiles());
        foreach (['qris/image.webp', 'products/../image.webp', 'https://example.test/image.webp', '/products/image.webp'] as $invalid) {
            $this->assertNull(ImagePreviewService::path($invalid));
        }
        $small = app(ImageUploadService::class)->store(UploadedFile::fake()->image('small.png', 32, 32), 'products');
        $this->assertNull(app(ImagePreviewService::class)->existing($small));
    }

    public function test_initial_store_html_preloads_its_page_module_and_the_same_banner_preview_returned_to_react(): void
    {
        Vite::useHotFile(storage_path('framework/testing-storefront-assets.hot'));
        Storage::fake('public');
        $path = app(ImageUploadService::class)->store($this->photo(), 'promo_banners');
        $preview = app(ImagePreviewService::class)->existing($path);
        $this->assertNotNull($preview);
        app(SettingService::class)->upsertSetting('store', 'promo_banner_1', $path);
        $response = $this->get('/s/toko-utama')->assertOk()->assertInertia(fn ($page) => $page
            ->where('promoBanners.1', Storage::url($path))
            ->where('promoBannerImages', fn ($images) => $images[Storage::url($path)]['src'] === Storage::url($preview)));
        $response->assertSee('rel="preload" as="image" href="'.Storage::url($preview).'"', false);
        $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true, 512, JSON_THROW_ON_ERROR);
        $menuFile = $manifest['resources/js/Pages/Order/Menu.jsx']['file'];
        $this->assertMatchesRegularExpression('/<link\b[^>]*rel="modulepreload"[^>]*href="[^"]*'.preg_quote($menuFile, '/').'"/', $response->getContent());
        $this->get('/')->assertOk()->assertDontSee($menuFile, false);
    }

    public function test_failed_persistence_removes_preview_and_new_original_without_deleting_the_old_image(): void
    {
        Storage::fake('public');
        $old = 'products/'.app(BusinessContext::class)->id().'/old.webp';
        Storage::disk('public')->put($old, 'old');
        try {
            app(ImageUploadService::class)->replace($this->photo(), 'products', $old, fn () => throw new \RuntimeException('database failed'));
            $this->fail('Expected persistence failure');
        } catch (\RuntimeException $exception) {
            $this->assertSame('database failed', $exception->getMessage());
        }
        $this->assertSame([$old], Storage::disk('public')->allFiles());
    }

    public function test_backfill_is_dry_run_by_default_and_resumes_with_a_bounded_product_cursor(): void
    {
        Storage::fake('public');
        $id = app(BusinessContext::class)->id();
        $firstPath = 'products/'.$id.'/first.webp';
        $secondPath = 'products/'.$id.'/second.webp';
        $file = $this->photo();
        $bytes = (string) ImageManager::gd()->read($file->getRealPath())->toWebp(quality: 85, strip: true);
        Storage::disk('public')->put($firstPath, $bytes);
        Storage::disk('public')->put($secondPath, $bytes);
        $category = Category::factory()->create();
        $first = Product::factory()->create(['id' => '10000000-0000-4000-8000-000000000001', 'image_path' => $firstPath, 'category_id' => $category->id]);
        Product::factory()->create(['id' => '20000000-0000-4000-8000-000000000002', 'image_path' => $secondPath, 'category_id' => $category->id]);
        $this->artisan('images:previews', ['business' => $id, '--limit' => 1])->assertSuccessful();
        $this->assertCount(2, Storage::disk('public')->allFiles());
        $sourceHash = hash_file('sha256', Storage::disk('public')->path($firstPath));
        $this->artisan('images:previews', ['business' => $id, '--limit' => 1, '--apply' => true])->assertSuccessful();
        $this->assertSame($sourceHash, hash_file('sha256', Storage::disk('public')->path($firstPath)));
        $this->assertNotNull(app(ImagePreviewService::class)->existing($firstPath));
        $this->assertNull(app(ImagePreviewService::class)->existing($secondPath));
        $this->artisan('images:previews', ['business' => $id, '--limit' => 1, '--after' => $first->id, '--apply' => true])->assertSuccessful();
        $this->assertNotNull(app(ImagePreviewService::class)->existing($secondPath));
        $this->assertCount(4, Storage::disk('public')->allFiles());
        $this->artisan('images:previews', ['business' => $id, '--limit' => 5000])->assertFailed();
    }

    public function test_backfill_leaves_other_business_files_untouched(): void
    {
        Storage::fake('public');
        $foreign = Business::create(['name' => 'Foreign', 'slug' => 'backfill-foreign']);
        $path = 'products/'.$foreign->id.'/foreign.webp';
        Storage::disk('public')->put($path, 'foreign original');
        app(BusinessContext::class)->run($foreign->id, fn () => Product::factory()->create(['image_path' => $path]));
        $this->artisan('images:previews', ['business' => BusinessContext::LEGACY_ID, '--apply' => true])->assertSuccessful();
        $this->assertSame([$path], Storage::disk('public')->allFiles());
        $this->assertSame('foreign original', Storage::disk('public')->get($path));
    }
}
