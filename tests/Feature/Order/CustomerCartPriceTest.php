<?php

declare(strict_types=1);

namespace Tests\Feature\Order;

use App\Models\Product;
use App\Services\SettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerCartPriceTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_refresh_and_checkout_use_the_updated_product_price(): void
    {
        app(SettingService::class)->upsertSetting('tax', 'enabled', 'false');
        $product = Product::factory()->create(['price' => 10000, 'stock' => 10, 'is_available' => true]);
        $catalog = $this->get($this->storeUrl('/'))->assertOk();

        $product->update(['price' => 15000]);

        $catalog->assertInertia(fn ($page) => $page
            ->where('initialProducts.0.price', fn ($price) => (float) $price === 10000.0)
            ->reloadOnly(['initialProducts', 'initialCategories', 'settings'], fn ($reload) => $reload
                ->where('initialProducts.0.price', fn ($price) => (float) $price === 15000.0)));

        $this->postJson($this->storeUrl('/api/customer/order'), [
            'customer_name' => 'Pembeli',
            'subtotal' => 20000,
            'total' => 20000,
            'items' => [['product_id' => $product->id, 'quantity' => 2, 'price' => 10000]],
        ])->assertCreated()
            ->assertJsonPath('data.items.0.unit_price', fn ($price) => (float) $price === 15000.0)
            ->assertJsonPath('data.total', fn ($total) => (float) $total === 30000.0);
    }

    public function test_catalog_refresh_returns_empty_when_the_last_product_is_hidden(): void
    {
        $product = Product::factory()->create(['stock' => 10, 'is_available' => true]);
        $catalog = $this->get($this->storeUrl('/'))->assertOk();

        $product->update(['is_available' => false]);

        $catalog->assertInertia(fn ($page) => $page->has('initialProducts', 1)
            ->reloadOnly(['initialProducts', 'initialCategories', 'settings'], fn ($reload) => $reload
                ->has('initialProducts', 0)));
    }
}
