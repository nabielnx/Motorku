<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\LoadingSkeletonService;
use PHPUnit\Framework\TestCase;

class LoadingSkeletonServiceTest extends TestCase
{
    private string $directory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->directory = sys_get_temp_dir().'/motorku-skeleton-'.bin2hex(random_bytes(8));
        mkdir($this->directory);
    }

    protected function tearDown(): void
    {
        foreach (glob($this->directory.'/*') as $path) {
            if (is_dir($path)) {
                unlink($path.'/private.html');
                rmdir($path);
            } else {
                unlink($path);
            }
        }
        rmdir($this->directory);
        parent::tearDown();
    }

    private function manifest(array $definition): LoadingSkeletonService
    {
        file_put_contents($this->directory.'/manifest.json', json_encode([
            'version' => 1,
            'pages' => ['Order/Index' => 'orders'],
            'skeletons' => ['orders' => $definition],
        ], JSON_THROW_ON_ERROR));

        return new LoadingSkeletonService($this->directory);
    }

    public function test_reload_uses_generated_markup_and_the_same_padding_contract(): void
    {
        $markup = '<div data-page-skeleton="orders">Shared skeleton</div>';
        file_put_contents($this->directory.'/orders-default.html', $markup);
        $service = $this->manifest(['noPadding' => true, 'defaultView' => 'default', 'variants' => ['default' => 'orders-default.html']]);
        $page = $service->forPage('Order/Index');
        $this->assertSame($markup, $page['variants']['default']);
        $this->assertTrue($page['noPadding']);
        $this->assertNull($service->forPage('Order/Menu'));
        $this->assertNull($service->forPage('Auth/Login'));
    }

    public function test_view_preferences_and_all_available_variants_are_preserved(): void
    {
        file_put_contents($this->directory.'/orders-list.html', '<div>List</div>');
        file_put_contents($this->directory.'/orders-grid.html', '<div>Grid</div>');
        $page = $this->manifest(['storageKey' => 'product_view_mode_v2', 'defaultView' => 'list', 'variants' => ['list' => 'orders-list.html', 'grid' => 'orders-grid.html']])->forPage('Order/Index');
        $this->assertSame('product_view_mode_v2', $page['storageKey']);
        $this->assertSame('list', $page['defaultView']);
        $this->assertCount(2, $page['variants']);
    }

    public function test_missing_or_malformed_artifacts_have_a_safe_admin_fallback(): void
    {
        $service = new LoadingSkeletonService($this->directory);
        $this->assertSame([], $service->forPage('Order/Index')['variants']);
        file_put_contents($this->directory.'/manifest.json', '{broken');
        $this->assertSame([], $service->forPage('Reference/Index')['variants']);
        $this->assertNull($service->forPage('Motorcycle/MotorSaya'));
    }

    public function test_manifest_cannot_load_nested_or_parent_paths(): void
    {
        mkdir($this->directory.'/nested');
        file_put_contents($this->directory.'/nested/private.html', 'must not be rendered');
        $page = $this->manifest(['variants' => ['nested' => 'nested/private.html', 'parent' => '../private.html']])->forPage('Order/Index');
        $this->assertSame([], $page['variants']);
    }

    public function test_a_missing_variant_does_not_break_other_variants(): void
    {
        file_put_contents($this->directory.'/orders-grid.html', '<div>Grid</div>');
        $page = $this->manifest(['variants' => ['list' => 'orders-list.html', 'grid' => 'orders-grid.html']])->forPage('Order/Index');
        $this->assertSame(['grid' => '<div>Grid</div>'], $page['variants']);
    }
}
