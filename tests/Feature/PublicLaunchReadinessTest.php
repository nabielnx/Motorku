<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Motorcycle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicLaunchReadinessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_sitemap_only_lists_public_catalog_pages(): void
    {
        Motorcycle::create([
            'brand' => 'Honda',
            'model' => 'Beat',
            'slug' => 'honda-beat-2020',
            'year_start' => 2020,
            'engine_cc' => 110,
        ]);

        $sitemap = $this->get('/sitemap.xml');
        $sitemap->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
            ->assertSee(route('home'), false)
            ->assertSee(route('motor-saya', ['slug' => 'honda-beat-2020']), false)
            ->assertDontSee('/dashboard', false)
            ->assertDontSee('/payment', false);
        $this->assertNotFalse(simplexml_load_string($sitemap->getContent()));

    }

    public function test_transaction_pages_are_noindex_and_catalog_has_canonical_url(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('rel="canonical"', false)
            ->assertDontSee('name="robots" content="noindex', false)
            ->assertHeaderMissing('X-Robots-Tag');

        $this->get('/payment')
            ->assertOk()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow');

        $this->get('/login')
            ->assertOk()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow');
    }

    public function test_unknown_motorcycle_has_branded_404_page(): void
    {
        $this->get('/motor-saya/motor-tidak-ada')
            ->assertNotFound()
            ->assertSee('Halaman yang kamu cari tidak ditemukan');
    }
}
