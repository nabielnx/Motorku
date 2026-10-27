<?php

declare(strict_types=1);

namespace Tests\Feature\Product;

use App\Enums\InventoryLogType;
use App\Models\Category;
use App\Models\DataType;
use App\Models\InventoryLog;
use App\Models\Product;
use App\Models\User;
use App\Services\BusinessContext;
use App\Services\BusinessOnboardingService;
use App\Services\InventoryService;
use App\Services\ProductSheetService;
use Barryvdh\DomPDF\Facade\Pdf;
use Database\Seeders\CategorySeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
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

    public function test_custom_group_import_creates_a_missing_category_once_when_the_file_has_no_group_column(): void
    {
        $type = $this->postJson('/data-types', ['kind' => 'product', 'name' => 'Makanan', 'fields' => []])
            ->assertCreated()->json('data');
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Stok\nCamilan,Keripik,10000,5\nCamilan,Kacang,15000,8\n"));
        $preview = $this->preview($draft, ['default_group' => $type['key']]);
        foreach ($preview['rows'] as $row) {
            $this->assertSame([], $row['errors']);
            $this->assertSame($type['key'], $row['group']);
            $this->assertNull($row['category_id']);
            $this->assertContains('Kategori baru: Camilan', $row['warnings']);
        }
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))
            ->assertOk()->assertJson(['created' => 2, 'updated' => 0]);
        $category = Category::where('catalog_group', $type['key'])->sole();
        $this->assertSame('Camilan', $category->name);
        $this->assertSame(2, Product::where('category_id', $category->id)->count());
    }

    public function test_import_suggests_existing_oil_and_tire_parents_and_creates_shared_children_once(): void
    {
        $type = $this->postJson('/data-types', ['kind' => 'product', 'name' => 'Motor Kustom', 'fields' => []])->assertCreated()->json('data');
        $oil = Category::factory()->create(['name' => 'Oli & Pelumas', 'catalog_group' => $type['key']]);
        $tire = Category::factory()->create(['name' => 'Ban', 'catalog_group' => $type['key']]);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nOli Mesin (4T),Oli A,50000\nOli Samping (2T),Oli B,30000\nOli Gardan / Transmisi,Oli C,20000\nBan Dalam,Ban A,40000\nOli Mesin (4T),Oli D,60000\n"));
        $preview = $this->preview($draft, ['default_group' => $type['key']]);
        foreach ($preview['rows'] as $index => $row) {
            $parent = $index === 3 ? $tire : $oil;
            $this->assertSame([], $row['errors']);
            $this->assertSame($parent->id, $row['category_parent_id']);
            $this->assertSame($parent->name.' / '.$row['category'], $row['category_name']);
        }
        $input = $this->commitInput($draft, $preview);
        $this->postJson('/api/products/sheets/commit', $input)->assertOk()->assertJson(['created' => 5]);
        $this->postJson('/api/products/sheets/commit', $input)->assertOk()->assertJson(['created' => 5]);
        $this->assertSame(3, Category::where('parent_id', $oil->id)->count());
        $this->assertSame(1, Category::where('parent_id', $tire->id)->count());
        $this->assertSame(5, Product::count());
        $this->assertSame(0, Category::whereNull('parent_id')->whereIn('name', ['Oli Mesin (4T)', 'Ban Dalam'])->count());
    }

    public function test_parent_suggestion_is_scoped_and_does_not_guess_when_names_are_ambiguous(): void
    {
        Category::factory()->create(['name' => 'Oli Motor', 'catalog_group' => 'automotive']);
        Category::factory()->create(['name' => 'Oli Industri', 'catalog_group' => 'automotive']);
        Category::factory()->create(['name' => 'Ban', 'catalog_group' => 'bicycle']);
        Category::factory()->create(['name' => 'Ban Luar', 'catalog_group' => 'automotive']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nOli Mesin (4T),Oli A,50000\nBantalan,Bearing,30000\n"));
        $preview = $this->preview($draft);
        foreach ($preview['rows'] as $row) {
            $this->assertNull($row['category_parent_id']);
        }
    }

    public function test_user_can_correct_or_remove_parent_suggestions_and_stale_previews_are_rejected(): void
    {
        $oil = Category::factory()->create(['name' => 'Oli & Pelumas']);
        $other = Category::factory()->create(['name' => 'Perawatan']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nOli Mesin (4T),Oli A,50000\n"));
        $first = $this->preview($draft);
        $this->assertSame($oil->id, $first['rows'][0]['category_parent_id']);
        $choice = ['key' => $first['rows'][0]['category_key'], 'parent_id' => $other->id];
        $corrected = $this->preview($draft, ['category_parents' => [$choice]]);
        $this->assertSame($other->id, $corrected['rows'][0]['category_parent_id']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $first))->assertUnprocessable();
        $standalone = $this->preview($draft, ['category_parents' => [[...$choice, 'parent_id' => null]]]);
        $this->assertNull($standalone['rows'][0]['category_parent_id']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $standalone))->assertOk();
        $this->assertDatabaseHas('categories', ['name' => 'Oli Mesin (4T)', 'parent_id' => null]);
    }

    public function test_parent_choices_reject_other_groups_and_nested_or_deleted_categories(): void
    {
        $root = Category::factory()->create(['name' => 'Perawatan']);
        $other = Category::factory()->create(['name' => 'Ban', 'catalog_group' => 'bicycle']);
        $child = Category::factory()->create(['name' => 'Pembersih', 'parent_id' => $root->id]);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nOli Mesin (4T),Oli A,50000\n"));
        $first = $this->preview($draft);
        $choice = ['key' => $first['rows'][0]['category_key'], 'parent_id' => $other->id];
        $invalid = $this->preview($draft, ['category_parents' => [$choice]]);
        $this->assertNotEmpty($invalid['rows'][0]['errors']);
        $this->postJson('/api/products/sheets/commit', [...$this->commitInput($draft, $invalid), 'rows' => ['0:2']])->assertUnprocessable();
        $this->postJson('/api/products/sheets/preview', $this->input($draft, ['category_parents' => [[...$choice, 'parent_id' => $child->id]]]))->assertUnprocessable();
        $other->delete();
        $this->postJson('/api/products/sheets/preview', $this->input($draft, ['category_parents' => [$choice]]))->assertUnprocessable();
    }

    public function test_parent_changes_after_preview_roll_back_the_import(): void
    {
        $parent = Category::factory()->create(['name' => 'Oli & Pelumas']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nOli Mesin (4T),Oli A,50000\n"));
        $preview = $this->preview($draft);
        $parent->update(['name' => 'Pelumas']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertUnprocessable();
        $this->assertDatabaseMissing('categories', ['name' => 'Oli Mesin (4T)']);
        $this->assertSame(0, Product::count());
    }

    public function test_category_created_elsewhere_after_preview_cannot_override_the_chosen_parent(): void
    {
        Category::factory()->create(['name' => 'Oli & Pelumas']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nOli Mesin (4T),Oli A,50000\n"));
        $preview = $this->preview($draft);
        Category::factory()->create(['name' => 'Oli Mesin (4T)']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertUnprocessable();
        $this->assertSame(0, Product::count());
    }

    public function test_import_parent_suggestions_and_manual_choices_cannot_use_another_business_category(): void
    {
        Notification::fake();
        $otherOwner = app(BusinessOnboardingService::class)->register([
            'name' => 'Owner B', 'email' => 'parent-b@example.test', 'business_name' => 'Usaha B', 'business_slug' => 'parent-usaha-b', 'password' => 'Strong@1234',
        ], ['id' => 'parent-owner-b', 'email' => 'parent-b@example.test', 'trusted_email' => true]);
        $foreign = app(BusinessContext::class)->run($otherOwner->business_id, function () {
            DataType::create(['kind' => 'product', 'key' => 'automotive', 'name' => 'Motor', 'fields' => []]);

            return Category::factory()->create(['name' => 'Oli & Pelumas']);
        });
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nOli Mesin (4T),Oli A,50000\n"));
        $preview = $this->preview($draft);
        $this->assertNull($preview['rows'][0]['category_parent_id']);
        $this->assertNotContains($foreign->id, array_column($preview['category_parents'], 'id'));
        $this->postJson('/api/products/sheets/preview', $this->input($draft, ['category_parents' => [[
            'key' => $preview['rows'][0]['category_key'], 'parent_id' => $foreign->id,
        ]]]))->assertUnprocessable();
    }

    public function test_import_keeps_existing_product_and_category_placement(): void
    {
        Category::factory()->create(['name' => 'Oli & Pelumas']);
        $standalone = Category::factory()->create(['name' => 'Oli Mesin (4T)']);
        $product = Product::factory()->create(['category_id' => $standalone->id, 'sku' => 'KEEP-ROOT']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Kode Barang\nOli Mesin (4T),Barang Lama,50000,KEEP-ROOT\nOli Mesin (4T),Barang Baru,40000,NEW-ROOT\n"));
        $preview = $this->preview($draft, ['mode' => 'upsert']);
        foreach ($preview['rows'] as $row) {
            $this->assertSame($standalone->id, $row['category_id']);
            $this->assertNull($row['category_parent_id']);
        }
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertSame($standalone->id, $product->fresh()->category_id);
        $this->assertNull($standalone->fresh()->parent_id);
    }

    public function test_short_brake_category_names_use_existing_subcategories_without_creating_roots(): void
    {
        $this->seed(CategorySeeder::class);
        $count = Category::count();
        $mapping = [
            'Kampas Rem Cakram' => 'Kampas Rem Cakram (Brake Pad)',
            'Kampas Rem Tromol' => 'Kampas Rem Tromol (Brake Shoe)',
            'Piringan Cakram' => 'Piringan Cakram (Disc)',
            'Master Rem' => 'Master Rem & Kaliper (Kit Seal)',
        ];
        $csv = "Grup Barang,Kategori,Nama Barang,Harga Jual,Stok\n";
        foreach (array_keys($mapping) as $index => $name) {
            $csv .= "Otomotif,{$name},Barang Rem {$index},75000,12\n";
        }
        $draft = $this->inspect($this->csv($csv));
        $preview = $this->preview($draft);
        foreach (array_values($mapping) as $index => $canonical) {
            $this->assertSame([], $preview['rows'][$index]['errors']);
            $this->assertSame(Category::where('name', $canonical)->value('id'), $preview['rows'][$index]['category_id']);
            $this->assertSame('Pengereman / '.$canonical, $preview['rows'][$index]['category_name']);
        }
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk()->assertJson(['created' => 4]);
        $this->assertSame($count, Category::count());
        foreach (array_values($mapping) as $index => $canonical) {
            $this->assertDatabaseHas('products', ['name' => 'Barang Rem '.$index, 'category_id' => Category::where('name', $canonical)->value('id'), 'price' => 75000, 'stock' => 12]);
        }
    }

    public function test_existing_duplicate_root_does_not_override_the_canonical_brake_subcategory(): void
    {
        $this->seed(CategorySeeder::class);
        Category::create(['name' => 'Kampas Rem Cakram', 'catalog_group' => 'automotive']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nKampas Rem Cakram,Rem Baru,10000\n"));
        $preview = $this->preview($draft);
        $target = Category::where('name', 'Kampas Rem Cakram (Brake Pad)')->firstOrFail();
        $this->assertSame($target->id, $preview['rows'][0]['category_id']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertDatabaseHas('products', ['name' => 'Rem Baru', 'category_id' => $target->id]);
    }

    public function test_brake_alias_matching_is_scoped_to_automotive_and_the_pengereman_parent(): void
    {
        $this->seed(CategorySeeder::class);
        $draft = $this->inspect($this->csv("Grup Barang,Kategori,Nama Barang,Harga Jual\nSepeda,Master Rem,Rem Sepeda,10000\nElektronik,Kampas Rem Cakram,Perangkat Rem,10000\n"));
        $preview = $this->preview($draft);
        $this->assertNull($preview['rows'][0]['category_id']);
        $this->assertNull($preview['rows'][1]['category_id']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertDatabaseHas('categories', ['name' => 'Master Rem', 'catalog_group' => 'bicycle', 'parent_id' => null]);
        $this->assertDatabaseHas('categories', ['name' => 'Kampas Rem Cakram', 'catalog_group' => 'electronics', 'parent_id' => null]);
    }

    public function test_short_brake_alias_does_not_match_a_category_under_another_parent(): void
    {
        $parent = Category::create(['name' => 'Kategori Khusus', 'catalog_group' => 'automotive']);
        Category::create(['name' => 'Master Rem & Kaliper (Kit Seal)', 'parent_id' => $parent->id, 'catalog_group' => 'automotive']);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nMaster Rem,Rem Baru,10000\n"));
        $preview = $this->preview($draft);
        $this->assertNull($preview['rows'][0]['category_id']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertDatabaseHas('categories', ['name' => 'Master Rem', 'parent_id' => null]);
    }

    public function test_category_names_conflicting_across_groups_are_reported_before_save(): void
    {
        Category::create(['name' => 'Kategori Terpakai', 'catalog_group' => 'electronics']);
        $draft = $this->inspect($this->csv("Grup Barang,Kategori,Nama Barang,Harga Jual\nSepeda,Kategori Terpakai,Barang A,10000\nSepeda,Kategori Baru,Barang B,10000\nElektronik,Kategori Baru,Barang C,10000\n"));
        $preview = $this->preview($draft);
        foreach ($preview['rows'] as $row) {
            $this->assertNotEmpty($row['errors']);
        }
        $this->postJson('/api/products/sheets/commit', ['token' => $draft['token'], 'revision' => $preview['revision'], 'rows' => array_column($preview['rows'], 'id')])->assertUnprocessable();
        $this->assertSame(0, Product::count());
    }

    public function test_renamed_category_after_preview_requires_a_new_preview(): void
    {
        $this->seed(CategorySeeder::class);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual\nKampas Rem Cakram,Rem Baru,10000\n"));
        $preview = $this->preview($draft);
        Category::where('id', $preview['rows'][0]['category_id'])->update(['name' => 'Kategori Diubah']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertUnprocessable();
        $this->assertDatabaseMissing('products', ['name' => 'Rem Baru']);
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

    public function test_reimporting_xlsx_can_set_previously_empty_stock_without_duplicating_products_or_logs(): void
    {
        $files = [];
        foreach ([null, 12, 12] as $stock) {
            $path = tempnam(sys_get_temp_dir(), 'sheet-stock');
            $this->temporary[] = $path;
            $writer = new Writer;
            $writer->openToFile($path);
            $writer->addRow(Row::fromValues(['Grup Barang', 'Kategori', 'Merek', 'Nama Barang', 'Harga Jual (Rp)', 'Stok', 'Satuan']));
            $writer->addRow(Row::fromValues(['Otomotif', 'V-Belt & Roller', 'Honda (AHM)', 'Vanbelt Set K0J', 150000, $stock, 'set']));
            $writer->close();
            $files[] = new UploadedFile($path, 'penggerak.xlsx', test: true);
        }

        $draft = $this->inspect($files[0]);
        $preview = $this->preview($draft);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $product = Product::sole();
        $this->assertSame(0, $product->stock);

        $draft = $this->inspect($files[1]);
        $preview = $this->preview($draft, ['mode' => 'upsert', 'update_stock' => true]);
        $this->assertSame($product->id, $preview['rows'][0]['product_id']);
        $this->assertSame(0, $preview['rows'][0]['old_stock']);
        $this->assertTrue($preview['rows'][0]['update_stock']);
        $this->assertSame(12, $preview['rows'][0]['data']['stock']);
        $input = $this->commitInput($draft, $preview);
        $this->postJson('/api/products/sheets/commit', $input)->assertOk()->assertJson(['created' => 0, 'updated' => 1]);
        $this->postJson('/api/products/sheets/commit', $input)->assertOk();
        $this->assertSame(1, Product::count());
        $this->assertSame(12, $product->fresh()->stock);
        $this->assertSame(1, InventoryLog::count());
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id, 'user_id' => $this->owner->id,
            'type' => 'adjustment', 'quantity' => 12, 'previous_stock' => 0, 'new_stock' => 12,
        ]);

        $draft = $this->inspect($files[2]);
        $preview = $this->preview($draft, ['mode' => 'update', 'update_stock' => true]);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertSame(12, $product->fresh()->stock);
        $this->assertSame(1, InventoryLog::count());
    }

    public function test_stock_update_can_reduce_stock_and_explicitly_set_zero_while_preserving_product_details(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id, 'sku' => 'STOCK-001', 'stock' => 17,
            'name' => 'Nama asli', 'unit' => 'set', 'image_path' => 'products/belt.webp',
        ]);
        foreach ([5, 0] as $stock) {
            $previousStock = $product->fresh()->stock;
            $previousVersion = $product->fresh()->sync_version;
            $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Stok,Satuan,Kode Barang\nKategori lain,Nama file,75000,{$stock},pcs,STOCK-001\n"));
            $preview = $this->preview($draft, ['mode' => 'update', 'update_stock' => true]);
            $this->assertTrue($preview['rows'][0]['update_stock']);
            $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
            $product->refresh();
            $this->assertSame($stock, $product->stock);
            $this->assertSame($previousVersion + 1, $product->sync_version);
            $this->assertSame('Nama asli', $product->name);
            $this->assertSame('set', $product->unit);
            $this->assertSame('products/belt.webp', $product->image_path);
            $this->assertSame($category->id, $product->category_id);
            $this->assertDatabaseHas('inventory_logs', ['product_id' => $product->id, 'previous_stock' => $previousStock, 'new_stock' => $stock]);
        }
        $this->assertSame(2, InventoryLog::count());
    }

    public function test_blank_and_unmapped_stock_preserve_existing_stock_even_when_updates_are_enabled(): void
    {
        $product = Product::factory()->create(['sku' => 'STOCK-001', 'stock' => 17]);
        foreach ([true, false] as $mapped) {
            $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Stok,Kode Barang\nOli,Barang,75000,".($mapped ? '' : '99').",STOCK-001\n"));
            $input = $this->input($draft, ['mode' => 'update', 'update_stock' => true]);
            if (! $mapped) {
                $input['sheets'][0]['mapping']['stock'] = null;
            }
            $preview = $this->postJson('/api/products/sheets/preview', $input)->assertOk()->json();
            $this->assertNull($preview['rows'][0]['data']['stock']);
            $this->assertFalse($preview['rows'][0]['update_stock']);
            $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
            $this->assertSame(17, $product->fresh()->stock);
        }
        $this->assertSame(0, InventoryLog::count());
    }

    public function test_stock_option_cannot_be_enabled_after_preview_or_override_add_only_mode(): void
    {
        $product = Product::factory()->create(['sku' => 'STOCK-001', 'stock' => 17]);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Stok,Kode Barang\nOli,Barang,75000,99,STOCK-001\n"));
        $preview = $this->preview($draft, ['mode' => 'update']);
        $this->assertFalse($preview['rows'][0]['update_stock']);
        $this->postJson('/api/products/sheets/commit', [...$this->commitInput($draft, $preview), 'update_stock' => true])->assertOk();
        $this->assertSame(17, $product->fresh()->stock);

        $preview = $this->preview($this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Stok,Kode Barang\nOli,Barang,75000,99,STOCK-001\n")), ['mode' => 'add', 'update_stock' => true]);
        $this->assertSame('skip', $preview['rows'][0]['action']);
        $this->assertFalse($preview['rows'][0]['update_stock']);
        $this->assertSame(0, InventoryLog::count());
    }

    public function test_stock_changes_after_preview_in_the_same_second_roll_back_the_entire_import(): void
    {
        $this->freezeTime();
        $first = Product::factory()->create(['sku' => 'FIRST', 'stock' => 5, 'price' => 10000]);
        $second = Product::factory()->create(['sku' => 'SECOND', 'stock' => 10, 'price' => 10000]);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Stok,Kode Barang\nOli,Barang A,20000,50,FIRST\nOli,Barang B,20000,50,SECOND\n"));
        $preview = $this->preview($draft, ['mode' => 'update', 'update_stock' => true]);
        app(InventoryService::class)->adjustStock(['product_id' => $second->id, 'type' => InventoryLogType::StockOut, 'quantity' => 1]);

        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertUnprocessable()->assertJsonValidationErrors('sheet');
        $this->assertSame(5, $first->fresh()->stock);
        $this->assertEquals(10000, $first->fresh()->price);
        $this->assertSame(9, $second->fresh()->stock);
        $this->assertEquals(10000, $second->fresh()->price);
        $this->assertSame(1, InventoryLog::count());
        $this->assertNull(DB::table('product_sheet_imports')->where('id', $draft['token'])->value('result'));
    }

    public function test_invalid_stock_and_invalid_update_option_cannot_be_saved(): void
    {
        $product = Product::factory()->create(['sku' => 'STOCK-001', 'stock' => 17]);
        foreach (['-1', '1.5', '100000000'] as $stock) {
            $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Jual,Stok,Kode Barang\nOli,Barang,75000,{$stock},STOCK-001\n"));
            $preview = $this->preview($draft, ['mode' => 'update', 'update_stock' => true]);
            $this->assertNotEmpty($preview['rows'][0]['errors']);
            $this->postJson('/api/products/sheets/commit', ['token' => $draft['token'], 'revision' => $preview['revision'], 'rows' => ['0:2']])->assertUnprocessable();
        }
        $this->postJson('/api/products/sheets/preview', $this->input($draft, ['update_stock' => 'yes']))->assertUnprocessable()->assertJsonValidationErrors('update_stock');
        $this->assertSame(17, $product->fresh()->stock);
        $this->assertSame(0, InventoryLog::count());
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

    public function test_csv_prices_with_google_sheets_comma_grouping_are_imported_at_the_correct_value(): void
    {
        $draft = $this->inspect($this->csv("Grup Barang,Kategori,Merek,Nama Barang,Harga Jual (Rp)\nSepeda,Ban Luar Sepeda,Swallow,Ban Luar Sepeda 12 1/2 x 2 1/4,\"Rp 52,000\"\n"));
        $preview = $this->preview($draft);
        $this->assertSame([], $preview['rows'][0]['errors']);
        $this->assertSame(52000, $preview['rows'][0]['data']['price']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk()->assertJson(['created' => 1]);
        $this->assertDatabaseHas('products', ['name' => 'Ban Luar Sepeda 12 1/2 x 2 1/4', 'price' => 52000]);
    }

    public function test_price_and_cost_formats_preserve_nominal_values_and_reject_fractions(): void
    {
        $values = [
            ['Rp 52,000', 52000], ['52,000', 52000], ['Rp 52.000', 52000],
            ['Rp 1,234,000.00', 1234000], ['Rp 1.234.000,00', 1234000],
            ['52000.00', 52000], ['52000,00', 52000], ["Rp\u{00A0}52,000", 52000],
            ["Rp\u{202F}52.000", 52000], ['Rp. 52.000', 52000], ['Rp 0.00', 0],
            ['52,000.50', null], ['52.000,50', null], ['1,00,000', null],
            ['1.00.000', null], ['1,234.567', null], ['1.234,567', null],
            ['-52,000', null], ['5.2e4', null], ['52,000 extra', null],
        ];
        $stream = fopen('php://temp', 'w+');
        fputcsv($stream, ['Kategori', 'Nama Barang', 'Harga Jual', 'Harga Beli'], ',', '"', '');
        foreach ($values as $index => [$value]) {
            fputcsv($stream, ['Oli', 'Format '.$index, $value, $value], ',', '"', '');
        }
        rewind($stream);
        $draft = $this->inspect($this->csv(stream_get_contents($stream)));
        fclose($stream);
        $preview = $this->preview($draft);
        foreach ($values as $index => [$value, $expected]) {
            $row = $preview['rows'][$index];
            $this->assertSame($expected, $row['data']['price'], $value);
            $this->assertSame($expected, $row['data']['cost_price'], $value);
            if ($expected === null) {
                $this->assertNotEmpty($row['errors'], $value);
            } else {
                $this->assertSame([], $row['errors'], $value);
            }
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
        $this->post('/api/products/sheets/inspect', ['file' => $this->csv("Kategori,Nama Barang,Harga Jual\nOli,Oli Baru,10000\n")->size(10240)], ['Accept' => 'application/json'])->assertOk();
        $this->post('/api/products/sheets/inspect', ['file' => UploadedFile::fake()->create('big.csv', 10241, 'text/csv')], ['Accept' => 'application/json'])->assertUnprocessable();
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

    public function test_pdf_export_downloads_catalog_and_filters_groups(): void
    {
        $category = Category::factory()->create(['catalog_group' => 'electronics']);
        Product::factory()->create(['category_id' => $category->id, 'name' => 'Kabel Busi', 'sku' => 'ELC-001', 'price' => 35000, 'cost_price' => 25000]);
        Product::factory()->create(['name' => 'Oli Mesin']);

        $response = $this->get('/api/products/sheets/export?format=pdf&group=electronics')->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('.pdf', (string) $response->headers->get('Content-Disposition'));

        $path = $response->baseResponse->getFile()->getPathname();
        $this->temporary[] = $path;
        $this->assertFileExists($path);

        $content = file_get_contents($path);
        $this->assertStringStartsWith('%PDF-', $content);
        $this->assertGreaterThan(1000, strlen($content));
    }

    public function test_pdf_export_disables_embedded_php_and_keeps_numbered_footers_on_every_page(): void
    {
        $pdf = app('dompdf.wrapper');
        $pdf->setOption('isPhpEnabled', true);
        Pdf::swap($pdf);
        $category = Category::factory()->create();
        Product::factory()->count(50)->create(['category_id' => $category->id]);

        $response = $this->get('/api/products/sheets/export?format=pdf')->assertOk();
        $this->temporary[] = $response->baseResponse->getFile()->getPathname();

        $this->assertFalse($pdf->getDomPDF()->getOptions()->getIsPhpEnabled());
        $pages = $pdf->getDomPDF()->getCanvas()->get_page_count();
        $this->assertGreaterThan(1, $pages);
        $content = $pdf->output(['compress' => 0]);
        for ($page = 1; $page <= $pages; $page++) {
            $this->assertStringContainsString(mb_convert_encoding("Halaman {$page} dari {$pages}", 'UTF-16BE', 'UTF-8'), $content);
        }
        $this->assertSame($pages, substr_count($content, mb_convert_encoding('TokoM · Dokumen Rahasia Perusahaan', 'UTF-16BE', 'UTF-8')));
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

    public function test_canonical_web_column_names_are_mapped_and_saved_to_the_correct_product_fields(): void
    {
        $draft = $this->inspect($this->csv("Grup Barang,Kategori,Merek,Nama Barang,Deskripsi / Spesifikasi,Harga Modal (Rp),Harga Jual (Rp),Stok,Satuan,Kode Barang\nOtomotif,Oli,Brand A,Oli 4T,10W-40,42000,55000,7,botol,MODAL-001\n"));
        $mapping = $draft['sheets'][0]['mapping'];
        $this->assertSame(5, $mapping['cost_price']);
        $this->assertSame(4, $mapping['description']);
        $this->assertArrayNotHasKey('estimated_cost', $mapping);
        $this->assertSame('Harga Modal (Rp)', $draft['fields']['cost_price']);
        $preview = $this->preview($draft);
        $row = $preview['rows'][0];
        $this->assertSame('cost_price', $row['cost_source']);
        $this->assertSame(42000, $row['data']['cost_price']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertDatabaseHas('products', ['sku' => 'MODAL-001', 'brand' => 'Brand A', 'description' => '10W-40', 'cost_price' => 42000, 'price' => 55000, 'stock' => 7, 'unit' => 'botol']);
    }

    public function test_legacy_purchase_cost_headers_remain_compatible_with_the_modal_field(): void
    {
        foreach (['Harga Beli (Rp)', 'Harga Beli', 'Harga Modal', 'Modal (Rp)', 'Cost Price'] as $header) {
            $draft = $this->inspect($this->csv("Kategori,Nama Barang,{$header},Harga Jual\nOli,Oli 4T,42000,55000\n"));
            $this->assertSame(2, $draft['sheets'][0]['mapping']['cost_price'], $header);
            $preview = $this->preview($draft);
            $this->assertSame(42000, $preview['rows'][0]['data']['cost_price'], $header);
            $this->assertSame('cost_price', $preview['rows'][0]['cost_source'], $header);
        }
    }

    public function test_unused_estimates_warn_and_preserve_old_modal_until_explicitly_enabled(): void
    {
        $product = Product::factory()->create(['sku' => 'KEEP-MODAL', 'cost_price' => 42000]);
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Estimasi Modal (Rp),Harga Jual,Kode Barang\nOli,Oli 4T,30000,55000,KEEP-MODAL\n"));
        $preview = $this->preview($draft, ['mode' => 'update']);
        $row = $preview['rows'][0];
        $this->assertSame(42000, (int) $row['old_cost_price']);
        $this->assertNull($row['data']['cost_price']);
        $this->assertNull($row['cost_source']);
        $this->assertStringContainsString('Estimasi Modal tidak digunakan', implode(' ', $row['warnings']));
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertSame(42000, (int) $product->fresh()->cost_price);

        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Estimasi Modal (Rp),Harga Jual,Kode Barang\nOli,Oli 4T,30000,55000,KEEP-MODAL\n"));
        $preview = $this->preview($draft, ['mode' => 'update', 'use_estimated_cost' => true]);
        $this->assertSame('estimated_cost', $preview['rows'][0]['cost_source']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertSame(30000, (int) $product->fresh()->cost_price);
    }

    public function test_zero_modal_is_a_real_value_and_never_replaced_by_an_estimate(): void
    {
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Modal (Rp),Estimasi Modal (Rp),Harga Jual\nOli,Oli 4T,0,30000,55000\n"));
        $preview = $this->preview($draft, ['use_estimated_cost' => true]);
        $this->assertSame(0, $preview['rows'][0]['data']['cost_price']);
        $this->assertSame('cost_price', $preview['rows'][0]['cost_source']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertDatabaseHas('products', ['name' => 'Oli 4T', 'cost_price' => 0]);
    }

    public function test_duplicate_cost_headers_require_manual_source_selection_instead_of_using_the_first(): void
    {
        $draft = $this->inspect($this->csv("Kategori,Nama Barang,Harga Beli,Harga Modal (Rp),Modal,Harga Jual\nOli,Oli 4T,42000,30000,20000,55000\n"));
        $this->assertNull($draft['sheets'][0]['mapping']['cost_price']);
        $this->assertSame(['cost_price'], $draft['sheets'][0]['ambiguous_fields']);
        $input = $this->input($draft);
        $input['sheets'][0]['mapping']['cost_price'] = 3;
        $preview = $this->postJson('/api/products/sheets/preview', $input)->assertOk()->json();
        $this->assertSame(30000, $preview['rows'][0]['data']['cost_price']);
        $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk();
        $this->assertDatabaseHas('products', ['name' => 'Oli 4T', 'cost_price' => 30000]);
    }

    public function test_csv_and_xlsx_exports_roundtrip_modal_zero_and_empty_values_without_estimate_opt_in(): void
    {
        $category = Category::factory()->create(['name' => 'Oli']);
        foreach (['ACTUAL' => 42000, 'ZERO' => 0, 'EMPTY' => null] as $sku => $cost) {
            Product::factory()->create(['category_id' => $category->id, 'sku' => $sku, 'name' => 'Produk '.$sku, 'cost_price' => $cost, 'price' => 55000, 'stock' => 7, 'description' => '10W-40', 'unit' => 'botol']);
        }
        $expectedHeaders = ['Grup Barang', 'Kategori', 'Merek', 'Nama Barang', 'Deskripsi / Spesifikasi', 'Harga Modal (Rp)', 'Harga Jual (Rp)', 'Stok', 'Satuan', 'Margin (Rp)', 'Kode Barang'];
        foreach (['csv', 'xlsx'] as $format) {
            $response = $this->get('/api/products/sheets/export?format='.$format)->assertOk();
            $path = $response->baseResponse->getFile()->getPathname();
            $this->temporary[] = $path;
            $draft = $this->inspect(new UploadedFile($path, 'export.'.$format, test: true));
            $this->assertSame($expectedHeaders, $draft['sheets'][0]['headers']);
            $this->assertSame([], $draft['sheets'][0]['ambiguous_fields']);
            $this->assertSame(5, $draft['sheets'][0]['mapping']['cost_price']);
            $this->assertArrayNotHasKey('estimated_cost', $draft['sheets'][0]['mapping']);
            $preview = $this->preview($draft, ['mode' => 'update']);
            $rows = collect($preview['rows'])->keyBy('data.sku');
            $this->assertSame(42000, $rows['ACTUAL']['data']['cost_price']);
            $this->assertSame(0, $rows['ZERO']['data']['cost_price']);
            $this->assertNull($rows['EMPTY']['data']['cost_price']);
            $this->assertSame('cost_price', $rows['ACTUAL']['cost_source']);
            $this->assertSame('10W-40', $rows['ACTUAL']['data']['description']);
            $this->postJson('/api/products/sheets/commit', $this->commitInput($draft, $preview))->assertOk()->assertJson(['created' => 0, 'updated' => 3]);
            $this->assertDatabaseHas('products', ['sku' => 'ACTUAL', 'cost_price' => 42000, 'price' => 55000, 'stock' => 7]);
            $this->assertDatabaseHas('products', ['sku' => 'ZERO', 'cost_price' => 0]);
            $this->assertDatabaseHas('products', ['sku' => 'EMPTY', 'cost_price' => null]);
        }
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
