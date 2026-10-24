<?php

declare(strict_types=1);

namespace Tests\Feature\Supplier;

use App\Models\Supplier;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SupplierTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner);
    }

    private function input(array $overrides = []): array
    {
        return array_replace([
            'name' => 'PT Suku Cadang', 'contact_person' => 'Budi', 'phone' => '+62 812-3456-7890',
            'email' => 'sales@example.test', 'address' => "Jl. Merdeka 12\nDemak", 'notes' => 'Pengiriman setiap Senin.',
        ], $overrides);
    }

    public function test_owner_can_create_update_and_permanently_delete_supplier(): void
    {
        $this->from('/suppliers')->post('/suppliers', $this->input(['name' => '  PT Suku Cadang  ', 'id' => fake()->uuid(), 'created_at' => '2000-01-01']))
            ->assertRedirect('/suppliers')->assertSessionHas('success');
        $supplier = Supplier::sole();
        $this->assertSame('PT Suku Cadang', $supplier->name);
        $this->assertMatchesRegularExpression('/^[a-f0-9-]{36}$/', $supplier->id);
        $this->assertNotSame('2000-01-01', $supplier->created_at->toDateString());
        $this->get('/suppliers')->assertInertia(fn (Assert $page) => $page->component('Supplier/Index')
            ->has('suppliers.data', 1)->where('suppliers.data.0.notes', 'Pengiriman setiap Senin.'));
        $this->from('/suppliers')->put('/suppliers/'.$supplier->id, $this->input(['name' => 'PT Baru', 'notes' => '']))->assertRedirect('/suppliers');
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id, 'name' => 'PT Baru', 'notes' => null]);
        $this->from('/suppliers')->delete('/suppliers/'.$supplier->id)->assertRedirect('/suppliers');
        $this->assertDatabaseMissing('suppliers', ['id' => $supplier->id]);
    }

    public function test_only_name_is_required_and_optional_contacts_can_be_cleared(): void
    {
        $this->post('/suppliers', ['name' => 'Toko Mandiri'])->assertRedirect();
        $supplier = Supplier::sole();
        $this->assertNull($supplier->email);
        $this->put('/suppliers/'.$supplier->id, $this->input())->assertRedirect();
        $this->put('/suppliers/'.$supplier->id, $this->input(['contact_person' => '', 'phone' => '', 'email' => '', 'address' => '', 'notes' => '']))->assertRedirect();
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id, 'contact_person' => null, 'phone' => null, 'email' => null, 'address' => null, 'notes' => null]);
    }

    public function test_listing_is_paginated_sorted_and_searches_across_pages(): void
    {
        for ($i = 0; $i < 18; $i++) {
            Supplier::create($this->input(['name' => sprintf('Supplier %02d', $i), 'email' => 'sales'.$i.'@example.test', 'phone' => '081200000'.sprintf('%03d', $i)]));
        }
        $this->get('/suppliers')->assertInertia(fn (Assert $page) => $page->has('suppliers.data', 15)
            ->where('suppliers.total', 18)->where('suppliers.data.0.name', 'Supplier 00')->where('suppliers.last_page', 2));
        $this->get('/suppliers?page=2')->assertInertia(fn (Assert $page) => $page->has('suppliers.data', 3)->where('suppliers.data.0.name', 'Supplier 15'));
        foreach (['Supplier 17', 'sales17@', '081200000017'] as $search) {
            $this->get('/suppliers?'.http_build_query(['search' => $search]))->assertInertia(fn (Assert $page) => $page
                ->has('suppliers.data', 1)->where('suppliers.data.0.name', 'Supplier 17')->where('filters.search', $search));
        }
        $this->get('/suppliers?search=Budi&page=2')->assertInertia(fn (Assert $page) => $page->where('suppliers.current_page', 2)
            ->where('suppliers.prev_page_url', url('/suppliers?search=Budi&page=1')));
    }

    public function test_search_treats_wildcards_as_literal_text_and_handles_empty_or_missing_pages(): void
    {
        Supplier::create($this->input(['name' => 'PT 100% Asli_1']));
        Supplier::create($this->input(['name' => 'PT Biasa']));
        foreach (['%', '_'] as $search) {
            $this->get('/suppliers?'.http_build_query(['search' => $search]))->assertInertia(fn (Assert $page) => $page->has('suppliers.data', 1)->where('suppliers.data.0.name', 'PT 100% Asli_1'));
        }
        $this->get('/suppliers?page=99')->assertInertia(fn (Assert $page) => $page->where('suppliers.current_page', 1)->has('suppliers.data', 2));
        $this->get('/suppliers?search=TidakAda&page=2')->assertInertia(fn (Assert $page) => $page->has('suppliers.data', 0)->where('suppliers.current_page', 1));
    }

    public function test_validation_rejects_invalid_fields_and_never_changes_existing_records(): void
    {
        $supplier = Supplier::create($this->input());
        $invalid = $this->input(['name' => ' ', 'contact_person' => str_repeat('a', 151), 'phone' => 'javascript:alert(1)',
            'email' => 'not-an-email', 'address' => str_repeat('a', 1001), 'notes' => str_repeat('a', 2001)]);
        $this->postJson('/suppliers', $invalid)->assertUnprocessable()->assertJsonValidationErrors(['name', 'contact_person', 'phone', 'email', 'address', 'notes']);
        $this->putJson('/suppliers/'.$supplier->id, $invalid)->assertUnprocessable();
        $this->assertSame('PT Suku Cadang', $supplier->fresh()->name);
        $this->assertDatabaseCount('suppliers', 1);
        $this->getJson('/suppliers?search='.str_repeat('a', 101))->assertUnprocessable();
        $this->getJson('/suppliers?page=0')->assertUnprocessable();
        $this->getJson('/suppliers?search[]=x')->assertUnprocessable();
    }

    public function test_cashier_and_manager_cannot_read_or_mutate_suppliers(): void
    {
        $supplier = Supplier::create($this->input());
        foreach (['cashier', 'manager'] as $role) {
            Role::findOrCreate($role, 'web');
            $staff = User::factory()->create();
            $staff->assignRole($role);
            $this->actingAs($staff);
            $this->get('/suppliers')->assertForbidden();
            $this->postJson('/suppliers', $this->input())->assertForbidden();
            $this->putJson('/suppliers/'.$supplier->id, $this->input(['name' => 'Changed']))->assertForbidden();
            $this->deleteJson('/suppliers/'.$supplier->id)->assertForbidden();
        }
        $this->assertDatabaseCount('suppliers', 1);
        $this->assertSame('PT Suku Cadang', $supplier->fresh()->name);
    }

    public function test_guests_and_unverified_owners_are_blocked(): void
    {
        $supplier = Supplier::create($this->input());
        auth()->logout();
        $this->get('/suppliers')->assertRedirect('/login?expired=1');
        $this->postJson('/suppliers', $this->input())->assertUnauthorized();
        $this->putJson('/suppliers/'.$supplier->id, $this->input())->assertUnauthorized();
        $this->deleteJson('/suppliers/'.$supplier->id)->assertUnauthorized();
        $owner = User::factory()->unverified()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner)->get('/suppliers')->assertRedirect('/verify-email');
        $this->postJson('/suppliers', $this->input())->assertForbidden();
    }

    public function test_unknown_supplier_and_non_uuid_routes_return_not_found(): void
    {
        $this->putJson('/suppliers/'.fake()->uuid(), $this->input())->assertNotFound();
        $this->deleteJson('/suppliers/'.fake()->uuid())->assertNotFound();
        $this->putJson('/suppliers/not-a-uuid', $this->input())->assertNotFound();
    }

    public function test_owner_can_store_edit_and_clear_multiple_platform_links(): void
    {
        $links = [
            ['label' => 'Shopee', 'url' => 'https://shopee.co.id/toko-uji'],
            ['label' => 'Tokopedia', 'url' => 'https://www.tokopedia.com/toko-uji?source=supplier'],
            ['label' => 'Website', 'url' => 'http://supplier.example.test/katalog'],
        ];
        $this->from('/suppliers')->post('/suppliers', $this->input(['links' => $links]))->assertRedirect('/suppliers');
        $supplier = Supplier::sole();
        $this->assertEquals($links, $supplier->links);
        $this->get('/suppliers')->assertInertia(fn (Assert $page) => $page->has('suppliers.data.0.links', 3)
            ->where('suppliers.data.0.links.0.label', 'Shopee')->where('suppliers.data.0.links.0.url', $links[0]['url'])
            ->where('suppliers.data.0.links.1.label', 'Tokopedia')->where('suppliers.data.0.links.1.url', $links[1]['url']));
        $this->put('/suppliers/'.$supplier->id, $this->input(['name' => 'Supplier Diperbarui']))->assertRedirect();
        $this->assertEquals($links, $supplier->fresh()->links); // Older forms that omit links must preserve them.
        $links = [['label' => 'Tokopedia Baru', 'url' => 'https://www.tokopedia.com/toko-baru']];
        $this->put('/suppliers/'.$supplier->id, $this->input(['links' => $links]))->assertRedirect();
        $this->assertEquals($links, $supplier->fresh()->links);
        $this->put('/suppliers/'.$supplier->id, $this->input(['links' => []]))->assertRedirect();
        $this->assertSame([], $supplier->fresh()->links);
        $this->assertSame('PT Suku Cadang', $supplier->fresh()->name);
    }

    public function test_links_are_optional_for_existing_and_new_suppliers(): void
    {
        $supplier = Supplier::create($this->input());
        $this->assertNull($supplier->links);
        $this->get('/suppliers')->assertInertia(fn (Assert $page) => $page->where('suppliers.data.0.links', null));
        $this->post('/suppliers', $this->input(['name' => 'Supplier Tanpa Link', 'links' => []]))->assertRedirect();
        $this->assertSame([], Supplier::where('name', 'Supplier Tanpa Link')->sole()->links);
    }

    public function test_store_links_reject_unsafe_urls_invalid_shapes_and_excessive_entries(): void
    {
        foreach (['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd', 'ftp://example.test/shop', '//shopee.co.id/shop', 'shopee.co.id/shop', 'https://'.str_repeat('a', 2050).'.com'] as $url) {
            $this->postJson('/suppliers', $this->input(['links' => [['label' => 'Toko', 'url' => $url]]]))
                ->assertUnprocessable()->assertJsonValidationErrors('links.0.url');
        }
        $this->postJson('/suppliers', $this->input(['links' => [['label' => ' ', 'url' => 'https://example.test']]]))
            ->assertUnprocessable()->assertJsonValidationErrors('links.0.label');
        $this->postJson('/suppliers', $this->input(['links' => array_fill(0, 11, ['label' => 'Toko', 'url' => 'https://example.test'])]))
            ->assertUnprocessable()->assertJsonValidationErrors('links');
        $this->postJson('/suppliers', $this->input(['links' => [['label' => 'Toko', 'url' => 'https://example.test', 'extra' => 'not allowed']]]))
            ->assertUnprocessable()->assertJsonValidationErrors('links.0');
        $this->postJson('/suppliers', $this->input(['links' => 'https://example.test']))->assertUnprocessable();
        $this->postJson('/suppliers', $this->input(['links' => ['shop' => ['label' => 'Toko', 'url' => 'https://example.test']]]))
            ->assertUnprocessable()->assertJsonValidationErrors('links');
        $this->assertDatabaseCount('suppliers', 0);
        $supplier = Supplier::create($this->input(['links' => [['label' => 'Toko', 'url' => 'https://example.test']]]));
        $this->putJson('/suppliers/'.$supplier->id, $this->input(['links' => [['label' => 'Toko', 'url' => 'javascript:alert(1)']]]))->assertUnprocessable();
        $this->assertSame('https://example.test', $supplier->fresh()->links[0]['url']);
    }
}
