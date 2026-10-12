<?php

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\ProductSheetService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use OpenSpout\Common\Entity\Cell\FormulaCell;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Reader;
use OpenSpout\Writer\XLSX\Writer;
use Tests\TestCase;

class ProductSheetTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private array $temporary = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
        $this->actingAs($this->owner);
    }

    protected function tearDown(): void
    {
        foreach ($this->temporary as $path) {
            @unlink($path);
        }
        parent::tearDown();
    }

    private function csv(string $body): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('barang.csv', $body);
    }

    private function inspect(?UploadedFile $file = null): array
    {
        return $this->post('/api/products/sheets/inspect', ['file' => $file ?? $this->csv("Grup Barang,Kategori,Merek,Nama Barang,Estimasi Modal (Rp),Harga Jual (Rp),Stok,Satuan,Kode Barang\nSepeda,Ban Sepeda,IRC,Ban Luar 26,60000,80000,4,buah,\n")], ['Accept' => 'application/json'])->assertOk()->json();
    }

    private function preview(array $draft, array $options = []): array
    {
        return $this->postJson('/api/products/sheets/preview', $this->input($draft, $options))->assertOk()->json();
    }

    private function input(array $draft, array $options = []): array
    {
        return [...[
            'token' => $draft['token'], 'mode' => 'add', 'default_group' => 'automotive', 'use_estimated_cost' => false,
            'sheets' => array_map(fn ($sheet) => ['id' => $sheet['id'], 'mapping' => $sheet['mapping']], $draft['sheets']),
        ], ...$options];
    }

    private function commitInput(array $draft, array $preview): array
    {
        return ['token' => $draft['token'], 'revision' => $preview['revision'], 'rows' => array_column(array_filter($preview['rows'], fn ($row) => $row['errors'] === [] && $row['action'] !== 'skip'), 'id')];
    }

    public function test_owner_can_import_all_selected_tabs_with_indonesian_headers(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'sheet-test');
        $this->temporary[] = $path;
        $writer = new Writer;
        $writer->openToFile($path);
        foreach (['Oli' => ['Otomotif', 'Oli Mesin', 'Oli 1L'], 'Ban' => ['Otomotif', 'Ban Motor', 'Ban 70/90'], 'Rem' => ['Otomotif', 'Pengereman', 'Kampas Rem'], 'Sepeda' => ['Sepeda', 'Ban Sepeda', 'Ban 26']] as $name => $values) {
            if ($name !== 'Oli') {
                $writer->addNewSheetAndMakeItCurrent();
            }
            $writer->getCurrentSheet()->setName($name);
            $writer->addRow(Row::fromValues(['Grup Barang', 'Kategori', 'Nama Barang', 'Harga Jual (Rp)', 'Stok', 'Satuan']));
            $writer->addRow(Row::fromValues([...$values, 85000, null, null]));
        }
        $writer->close();
        $draft = $this->inspect(new UploadedFile($path, 'semua.xlsx', test: true));
        $this->assertCount(4, $draft['sheets']);
        $preview = $this->preview($draft);
        $this->assertCount(4, $preview['rows']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk()->assertJson(['created' => 4, 'updated' => 0]);
        $this->assertDatabaseHas('products', ['name' => 'Ban 26', 'stock' => 0, 'unit' => 'pcs']);
        $this->assertDatabaseHas('categories', ['name' => 'Ban Sepeda', 'catalog_group' => 'bicycle']);
    }

    public function test_estimated_cost_is_only_used_when_explicitly_selected(): void
    {
        $draft = $this->inspect();
        $preview = $this->preview($draft);
        $this->assertNull($preview['rows'][0]['data']['cost_price']);
        $preview = $this->preview($draft, ['use_estimated_cost' => true]);
        $this->assertSame(60000, $preview['rows'][0]['data']['cost_price']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertDatabaseHas('products', ['name' => 'Ban Luar 26', 'cost_price' => 60000, 'stock' => 4]);
    }

    public function test_existing_product_updates_preserve_stock_images_and_other_details(): void
    {
        $category = Category::factory()->create(['name' => 'Oli Mesin']);
        $product = Product::factory()->create(['category_id' => $category->id, 'sku' => 'OIL001', 'name' => 'Nama di sistem', 'price' => 60000, 'cost_price' => 40000, 'stock' => 17, 'unit' => 'botol', 'image_path' => 'products/oli.webp']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Stok,Satuan,Kode Barang\nKategori lain,Nama di file,75000,999,pcs,OIL001\n"));
        $preview = $this->preview($draft, ['mode' => 'upsert']);
        $this->assertSame('Nama di sistem', $preview['rows'][0]['matched_name']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk()->assertJson(['created' => 0, 'updated' => 1]);
        $product->refresh();
        $this->assertEquals(75000, $product->price);
        $this->assertEquals(40000, $product->cost_price);
        $this->assertSame(17, $product->stock);
        $this->assertSame('botol', $product->unit);
        $this->assertSame('Nama di sistem', $product->name);
        $this->assertSame('products/oli.webp', $product->image_path);
        $this->assertSame($category->id, $product->category_id);
    }

    public function test_retries_are_idempotent_and_cannot_change_selection(): void
    {
        $draft = $this->inspect();
        $preview = $this->preview($draft);
        $input = $this->commitInput($draft, $preview);
        $this->postJson('/api/products/sheets/commit', $input)->assertOk();
        $this->postJson('/api/products/sheets/commit', $input)->assertOk()->assertJson(['created' => 1]);
        $this->assertSame(1, Product::count());
        $this->postJson('/api/products/sheets/commit', [...$input, 'rows' => ['0:999']])->assertUnprocessable();
    }

    public function test_stale_preview_rolls_back_the_entire_selected_batch(): void
    {
        $product = Product::factory()->create(['sku' => 'OLD']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Kode Barang\nOli,Barang Baru,10000,NEW\nOli,Barang Lama,20000,OLD\n"));
        $preview = $this->preview($draft, ['mode' => 'upsert']);
        $product->update(['price' => 50000]);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertUnprocessable();
        $this->assertDatabaseMissing('products', ['sku' => 'NEW']);
        $this->assertDatabaseHas('products', ['sku' => 'OLD', 'price' => 50000]);
    }

    public function test_name_matching_ignores_word_order_but_preserves_tire_sizes(): void
    {
        Product::factory()->create(['name' => 'Ban Luar IRC Ring 14 - 70/90 Non-Tubeless', 'brand' => 'IRC', 'sku' => 'TIRE']);
        Product::factory()->create(['name' => 'Ban Luar IRC Ring 14 - 80/90 Non-Tubeless', 'brand' => 'IRC', 'sku' => 'OTHER']);
        $draft = $this->inspect($this->csv("Kategori,Merek,Nama Barang,Harga Jual\nBan Motor,IRC,Ban Luar IRC (Non-Tubeless) Ring 14 - 70/90,85000\n"));
        $preview = $this->preview($draft, ['mode' => 'upsert']);
        $this->assertSame('update', $preview['rows'][0]['action']);
        $this->assertSame(Product::where('sku', 'TIRE')->value('id'), $preview['rows'][0]['product_id']);
    }

    public function test_ambiguous_names_and_duplicate_rows_are_not_importable(): void
    {
        Product::factory()->count(2)->create(['name' => 'Oli Sama']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nOli,Oli Sama,10000\nOli,Oli Baru,10000\nOli,Oli Baru,20000\n"));
        $preview = $this->preview($draft, ['mode' => 'upsert']);
        foreach ($preview['rows'] as $row) {
            $this->assertNotEmpty($row['errors']);
        }
        $this->postJson('/api/products/sheets/commit', ['token' => $draft['token'], 'revision' => $preview['revision'], 'rows' => ['0:2']])->assertUnprocessable();
    }

    public function test_same_name_with_different_brands_is_separate_and_does_not_overwrite_prices(): void
    {
        $product = Product::factory()->create(['name' => 'Ban Luar Sepeda 18 x 2.125', 'brand' => 'Swallow', 'price' => 70000]);
        $draft = $this->inspect($this->csv("Grup Barang,Kategori,Merek,Nama Barang,Harga Jual\nOtomotif,Ban,Swallow,Ban Luar Sepeda 18 x 2.125,80000\nOtomotif,Ban,Atlantis,Ban Luar Sepeda 18 x 2.125,60000\n"));
        $preview = $this->preview($draft, ['mode' => 'upsert']);
        $this->assertSame('update', $preview['rows'][0]['action']);
        $this->assertSame('create', $preview['rows'][1]['action']);
        $this->assertSame([], $preview['rows'][1]['errors']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk()->assertJson(['created' => 1, 'updated' => 1]);
        $this->assertEquals(80000, $product->fresh()->price);
        $this->assertDatabaseHas('products', ['name' => 'Ban Luar Sepeda 18 x 2.125', 'brand' => 'Atlantis', 'price' => 60000]);
    }

    public function test_csv_aliases_semicolon_prices_and_manual_mapping(): void
    {
        $draft = $this->inspect($this->csv("Merk;Kategori;Nama Produk;Harga;Qty\nIRC;Ban Sepeda;Ban 26;Rp 80.000;3\n"));
        $input = $this->input($draft, ['default_group' => 'bicycle']);
        $input['sheets'][0]['mapping']['stock'] = 4;
        $preview = $this->postJson('/api/products/sheets/preview', $input)->assertOk()->json();
        $this->assertSame(80000, $preview['rows'][0]['data']['price']);
        $this->assertSame(3, $preview['rows'][0]['data']['stock']);
        $this->assertSame('bicycle', $preview['rows'][0]['group']);
        $input['sheets'][0]['mapping']['stock'] = 3;
        $this->postJson('/api/products/sheets/preview', $input)->assertUnprocessable();
    }

    public function test_negative_fractional_ambiguous_or_missing_prices_are_rejected(): void
    {
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nOli,Negatif,-100\nOli,Desimal,2.5\nOli,Ambigu,1.00.000\nOli,Kosong,\n"));
        $preview = $this->preview($draft);
        foreach ($preview['rows'] as $row) {
            $this->assertNotEmpty($row['errors']);
        }
    }

    public function test_cashiers_unverified_users_and_other_owners_cannot_access_private_drafts(): void
    {
        $draft = $this->inspect();
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->actingAs($cashier)->postJson('/api/products/sheets/preview', $this->input($draft))->assertForbidden();
        $this->getJson('/api/products/sheets/export')->assertForbidden();
        $other = User::factory()->create();
        $other->assignRole('owner');
        $this->actingAs($other)->postJson('/api/products/sheets/preview', $this->input($draft))->assertUnprocessable();
        $other->forceFill(['email_verified_at' => null])->save();
        $this->actingAs($other->fresh())->postJson('/api/products/sheets/preview', $this->input($draft))->assertForbidden();
    }

    public function test_expiration_and_revision_prevent_saving_old_previews(): void
    {
        $draft = $this->inspect();
        $preview = $this->preview($draft);
        $newPreview = $this->preview($draft);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertUnprocessable();
        $this->travel(31)->minutes();
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $newPreview))->assertUnprocessable();
        $this->artisan('products:prune-imports')->assertSuccessful();
        $this->assertSame(0, DB::table('product_sheet_imports')->count());
    }

    public function test_upload_extension_size_and_row_limits(): void
    {
        $this->post('/api/products/sheets/inspect', ['file' => UploadedFile::fake()->create('bad.xls', 1)], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->post('/api/products/sheets/inspect', ['file' => UploadedFile::fake()->create('big.csv', 4097, 'text/csv')], ['Accept' => 'application/json'])->assertUnprocessable();
        $file = $this->csv("Kategori,Nama Barang,Harga Jual\n".str_repeat("Oli,Barang,10000\n", 2001));
        $this->post('/api/products/sheets/inspect', ['file' => $file], ['Accept' => 'application/json'])->assertUnprocessable();
    }

    public function test_xlsx_rejects_oversized_expansion_and_unsafe_archive_paths(): void
    {
        foreach (['oversized', 'traversal'] as $case) {
            $path = tempnam(sys_get_temp_dir(), 'sheet-zip-test');
            $this->temporary[] = $path;
            $zip = new \ZipArchive;
            $zip->open($path, \ZipArchive::OVERWRITE);
            $zip->addFromString('xl/workbook.xml', '<workbook/>');
            $zip->addFromString($case === 'oversized' ? 'xl/sharedStrings.xml' : '../outside.txt', $case === 'oversized' ? str_repeat('x', 26 * 1024 * 1024) : 'rejected');
            $zip->close();
            try {
                app(ProductSheetService::class)->inspect(new UploadedFile($path, 'invalid.xlsx', test: true), $this->owner->id);
                $this->fail('Unsafe archive was accepted.');
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey('sheet', $exception->errors());
            }
        }
        $this->assertSame(0, DB::table('product_sheet_imports')->count());
    }

    public function test_export_xlsx_keeps_user_strings_literal_and_roundtrips_by_sku(): void
    {
        Product::factory()->create(['name' => '=HYPERLINK("https://example.com")', 'cost_price' => 5000, 'price' => 8000]);
        $response = $this->get('/api/products/sheets/export?format=xlsx')->assertOk();
        $path = $response->baseResponse->getFile()->getPathname();
        $this->temporary[] = $path;
        $reader = new Reader;
        $reader->open($path);
        $rows = [];
        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $rows[] = $row;
            }
        }
        $reader->close();
        $zip = new \ZipArchive;
        $zip->open($path);
        $this->assertStringNotContainsString('<f>', $zip->getFromName('xl/worksheets/sheet1.xml'));
        $zip->close();
        $this->assertSame('=HYPERLINK("https://example.com")', $rows[1]->getCells()[3]->getValue());
        $this->assertSame(3000, $rows[1]->getCells()[9]->getValue());
        $draft = $this->inspect(new UploadedFile($path, 'export.xlsx', test: true));
        $preview = $this->preview($draft, ['mode' => 'update']);
        $this->assertSame('update', $preview['rows'][0]['action']);
        $this->assertSame([], $preview['rows'][0]['errors']);
    }

    public function test_csv_export_neutralizes_formula_injection_and_filters_groups(): void
    {
        $category = Category::factory()->create(['catalog_group' => 'electronics']);
        Product::factory()->create(['category_id' => $category->id, 'name' => '+Danger', 'sku' => '@code']);
        Product::factory()->create(['name' => 'Oli']);
        $response = $this->get('/api/products/sheets/export?format=csv&group=electronics')->assertOk();
        $path = $response->baseResponse->getFile()->getPathname();
        $this->temporary[] = $path;
        $content = file_get_contents($path);
        $this->assertStringContainsString("'+Danger", $content);
        $this->assertStringContainsString("'@code", $content);
        $this->assertStringNotContainsString('Oli', $content);
        $this->assertStringContainsString('Elektronik', $content);
    }

    public function test_actual_cost_has_priority_and_update_only_skips_new_items(): void
    {
        Product::factory()->create(['sku' => 'OLD']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Harga Beli,Estimasi Modal,Kode Barang\nOli,Barang Lama,8000,5000,1000,OLD\nOli,Barang Baru,9000,4000,2000,NEW\n"));
        $preview = $this->preview($draft, ['mode' => 'update', 'use_estimated_cost' => true]);
        $this->assertSame(5000, $preview['rows'][0]['data']['cost_price']);
        $this->assertSame('skip', $preview['rows'][1]['action']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk()->assertJson(['updated' => 1, 'created' => 0]);
    }

    public function test_xlsx_formula_cached_price_is_read_without_executing_formula(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'sheet-test');
        $this->temporary[] = $path;
        $writer = new Writer;
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues(['Kategori', 'Nama Barang', 'Harga Jual']));
        $writer->addRow(new Row([new StringCell('Oli', null), new StringCell('Oli Formula', null), new FormulaCell('=40000*2', null, 80000)]));
        $writer->addRow(new Row([new StringCell('Oli', null), new StringCell('Belum dihitung', null), new FormulaCell('=40000*2', null)]));
        $writer->close();
        // The writer does not emit cached values; reproduce an Excel-saved numeric cache.
        $zip = new \ZipArchive;
        $zip->open($path);
        $xml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $xml = preg_replace('~(<c r="C2"[^>]*><f>.*?</f>)~', '$1<v>80000</v>', $xml, 1);
        $zip->addFromString('xl/worksheets/sheet1.xml', $xml);
        $zip->close();
        $draft = $this->inspect(new UploadedFile($path, 'formula.xlsx', test: true));
        $preview = $this->preview($draft);
        $this->assertSame(80000, $preview['rows'][0]['data']['price']);
        $this->assertNotEmpty($preview['rows'][1]['errors']);
    }
}
