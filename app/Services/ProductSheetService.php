<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\InventoryLogType;
use App\Models\Category;
use App\Models\DataType;
use App\Models\Product;
use App\Services\ProductSheet\ProductSheetExporter;
use App\Services\ProductSheet\ProductSheetReader;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductSheetService
{
    public function __construct(
        private ProductSheetReader $reader,
        private ProductSheetExporter $exporter,
    ) {}

    public function export(string $format, ?string $group = null, bool $template = false)
    {
        return $this->exporter->export($format, $group, $template);
    }

    public const FIELDS = [
        'group' => 'Grup Barang', 'category' => 'Kategori', 'brand' => 'Merek',
        'name' => 'Nama Barang', 'description' => 'Spesifikasi / Keterangan',
        'estimated_cost' => 'Estimasi Modal (Rp)', 'price' => 'Harga Jual (Rp)',
        'stock' => 'Stok', 'unit' => 'Satuan', 'sku' => 'Kode Barang', 'cost_price' => 'Harga Beli (Rp)',
    ];

    public function inspect(UploadedFile $file, string $userId): array
    {
        $sheets = $this->reader->read($file);
        // Expired drafts contain private prices and are discarded, including when cron is not running.
        DB::table('product_sheet_imports')->where('expires_at', '<', now())->delete();
        $token = (string) Str::uuid();
        DB::table('product_sheet_imports')->insert([
            'id' => $token, 'user_id' => $userId, 'payload' => json_encode($sheets, JSON_THROW_ON_ERROR),
            'expires_at' => now()->addMinutes(30),
        ]);

        return ['token' => $token, 'fields' => self::FIELDS, 'sheets' => array_map(fn ($sheet) => [
            ...array_diff_key($sheet, ['rows' => true]), 'count' => count($sheet['rows']),
            'sample' => array_slice(array_column($sheet['rows'], 'values'), 0, 2),
        ], $sheets)];
    }

    public function preview(array $input, string $userId): array
    {
        return DB::transaction(function () use ($input, $userId) {
            $draft = $this->draft($input['token'], $userId, true);
            if ($draft->result) {
                $this->fail('Impor ini sudah disimpan. Upload ulang untuk membuat impor baru.');
            }
            $sheets = json_decode($draft->payload, true, flags: JSON_THROW_ON_ERROR);
            $catalog = $this->catalogIndex();
            $categories = Category::with('parent')->get();
            $input['catalog_groups'] = Category::catalogGroups();
            $rows = [];
            foreach ($input['sheets'] as $selection) {
                $sheet = collect($sheets)->firstWhere('id', $selection['id']);
                if (! $sheet) {
                    $this->fail('Tab tidak ditemukan.');
                }
                $mapping = array_filter($selection['mapping'], fn ($v) => $v !== null);
                if (count(array_unique($mapping)) !== count($mapping) || array_diff($mapping, array_keys($sheet['headers']))) {
                    $this->fail('Setiap kolom hanya boleh dipakai sekali dan harus ada di tab.');
                }
                foreach (['name', 'price', 'category'] as $required) {
                    if (! isset($mapping[$required])) {
                        $this->fail("Tab {$sheet['name']}: cocokkan kolom ".self::FIELDS[$required].'.');
                    }
                }
                foreach ($sheet['rows'] as $raw) {
                    $row = $this->normalize($raw, $mapping, $input);
                    $row['id'] = $sheet['id'].':'.$raw['number'];
                    $row['sheet'] = $sheet['name'];
                    $row['number'] = $raw['number'];
                    $nameMatches = $this->nameMatches($row['data'], $row['group'], $catalog);
                    $matches = $row['data']['sku'] ? collect($catalog['skus'][mb_strtolower($row['data']['sku'])] ?? []) : $nameMatches;
                    if ($matches->count() > 1) {
                        $row['errors'][] = 'Nama cocok dengan beberapa barang. Isi Kode Barang (SKU) yang tepat.';
                    }
                    $product = $matches->count() === 1 ? $matches->first() : null;
                    $row['product_id'] = $product?->id;
                    $row['version'] = $product?->sync_version;
                    $row['fingerprint'] = $product ? $this->fingerprint($product) : null;
                    $row['old_price'] = $product?->price;
                    $row['old_stock'] = $product?->stock;
                    $row['matched_name'] = $product?->name;
                    $row['action'] = $product ? 'update' : 'create';
                    if (($product && $input['mode'] === 'add') || (! $product && $input['mode'] === 'update')) {
                        $row['action'] = 'skip';
                    }
                    $row['update_stock'] = $product !== null && $row['action'] === 'update'
                        && (bool) ($input['update_stock'] ?? false) && $row['data']['stock'] !== null;
                    if ($product && $this->group($product->category) !== $row['group']) {
                        $row['errors'][] = 'Kode Barang berada di grup berbeda.';
                    }
                    // A new SKU must not silently create a duplicate name.
                    if (! $product && $row['data']['sku'] && $nameMatches->isNotEmpty()) {
                        $row['errors'][] = 'Nama sudah ada dengan kode lain. Gunakan kode dari ekspor sistem.';
                    }
                    $categoryMatches = app(ProductImportCategoryService::class)->matches($row['category'], $row['group'], $categories);
                    if (! $product && $categoryMatches->count() > 1) {
                        $row['errors'][] = 'Nama kategori ganda dalam grup ini. Rapikan kategori di sistem terlebih dahulu.';
                    }
                    $row['category_id'] = $categoryMatches->count() === 1 ? $categoryMatches->first()->id : null;
                    $row['category_name'] = $row['category_id'] ? app(ProductImportCategoryService::class)->displayName($categoryMatches->first()) : $row['category'];
                    if (! $product && ! $row['category_id']) {
                        $row['warnings'][] = 'Kategori baru: '.$row['category'];
                        if ($categories->contains(fn ($category) => $this->key($category->name) === $this->key($row['category']))) {
                            $row['errors'][] = 'Nama kategori sudah dipakai di grup lain. Gunakan nama kategori khusus untuk grup ini.';
                        }
                    }
                    if ($product) {
                        $row['warnings'][] = 'Harga jual dan modal terpilih diperbarui. Gambar, nama, kategori, dan satuan tetap.';
                        $row['warnings'][] = $row['update_stock']
                            ? 'Stok disetel sesuai file, bukan ditambahkan.'
                            : 'Stok tetap. Pembaruan stok harus dicentang dan kolom Stok harus terisi.';
                    } elseif ($row['data']['stock'] === null) {
                        $row['warnings'][] = 'Stok kosong: barang baru mulai dari 0.';
                    }
                    $rows[] = $row;
                }
            }
            $duplicates = [];
            foreach ($rows as $index => $row) {
                $identities = [$row['product_id'] ?: 'sku:'.mb_strtolower($row['data']['sku'])];
                if (! $row['product_id']) {
                    $identities = $row['data']['sku'] ? $identities : [];
                    foreach ($this->nameVariants($row['data']) as $name) {
                        $identities[] = $row['group'].':'.$this->key($row['data']['brand']).':'.$name;
                    }
                }
                foreach (array_unique($identities) as $identity) {
                    $duplicates[$identity][] = $index;
                }
            }
            foreach ($duplicates as $indexes) {
                if (count($indexes) > 1) {
                    foreach ($indexes as $index) {
                        $rows[$index]['errors'] = array_unique([...$rows[$index]['errors'], 'Barang muncul lebih dari sekali dalam file/tab yang dipilih.']);
                    }
                }
            }
            $newCategoryGroups = [];
            foreach ($rows as $row) {
                if ($row['action'] === 'create' && ! $row['category_id']) {
                    $newCategoryGroups[$this->key($row['category'])][$row['group']] = true;
                }
            }
            foreach ($rows as &$row) {
                if ($row['action'] === 'create' && ! $row['category_id'] && count($newCategoryGroups[$this->key($row['category'])]) > 1) {
                    $row['errors'][] = 'Nama kategori baru digunakan oleh beberapa grup dalam file. Beri nama kategori yang berbeda untuk setiap grup.';
                }
            }
            unset($row);
            $preview = ['revision' => (string) Str::uuid(), 'rows' => $rows];
            DB::table('product_sheet_imports')->where('id', $draft->id)->update(['preview' => json_encode($preview, JSON_THROW_ON_ERROR)]);

            return $preview;
        });
    }

    public function commit(array $input, string $userId): array
    {
        return Cache::lock('products:sheet-import', 120)->block(5, function () use ($input, $userId) {
            $result = DB::transaction(function () use ($input, $userId) {
                $draft = $this->draft($input['token'], $userId, true);
                $preview = json_decode($draft->preview ?? '{}', true, flags: JSON_THROW_ON_ERROR);
                if (($preview['revision'] ?? null) !== $input['revision']) {
                    $this->fail('Pratinjau berubah. Periksa ulang sebelum menyimpan.');
                }
                $selection = array_values($input['rows']);
                sort($selection);
                if ($draft->result) {
                    $receipt = json_decode($draft->result, true, flags: JSON_THROW_ON_ERROR);
                    if ($receipt['selection'] !== $selection) {
                        $this->fail('Impor sudah disimpan dengan pilihan berbeda.');
                    }

                    return $receipt['counts'];
                }
                $rows = collect($preview['rows'])->whereIn('id', $selection);
                if ($rows->count() !== count($selection) || $rows->contains(fn ($row) => $row['errors'] !== [] || $row['action'] === 'skip')) {
                    $this->fail('Pilih hanya baris yang valid dan tidak dilewati.');
                }
                $counts = ['created' => 0, 'updated' => 0];
                $groups = $rows->pluck('group')->unique()->values();
                if (DataType::where('kind', 'product')->whereIn('key', $groups)->orderBy('key')->lockForUpdate()->get()->count() !== $groups->count()) {
                    $this->fail('Jenis produk berubah. Buat pratinjau ulang.');
                }
                $catalog = $this->catalogIndex();
                foreach ($rows as $row) {
                    $data = $row['data'];
                    if ($row['product_id']) {
                        $product = Product::with('category.parent')->whereKey($row['product_id'])->lockForUpdate()->first();
                        if (! $product || $this->fingerprint($product) !== $row['fingerprint'] || $this->group($product->category) !== $row['group']) {
                            $this->fail('Data barang berubah setelah pratinjau. Buat pratinjau ulang.');
                        }
                        $changes = ['price' => $data['price'], 'sync_version' => $product->sync_version + 1];
                        if ($data['cost_price'] !== null) {
                            $changes['cost_price'] = $data['cost_price'];
                        }
                        $product->update($changes);
                        if (($row['update_stock'] ?? false) && $data['stock'] !== $product->stock) {
                            app(InventoryService::class)->adjustStock([
                                'product_id' => $product->id,
                                'type' => InventoryLogType::Adjustment,
                                'quantity' => $data['stock'],
                            ], $userId, 'Penyesuaian stok dari impor: '.$row['sheet'].' baris '.$row['number']);
                        }
                        $counts['updated']++;
                    } else {
                        $existing = isset($catalog['skus'][mb_strtolower($data['sku'])]) || $this->nameMatches($data, $row['group'], $catalog)->isNotEmpty();
                        if ($existing) {
                            $this->fail('Barang baru sudah ditambahkan setelah pratinjau. Buat pratinjau ulang.');
                        }
                        $categories = app(ProductImportCategoryService::class)->matches($row['category'], $row['group'], Category::with('parent')->get());
                        if ($categories->count() > 1) {
                            $this->fail('Kategori ganda. Buat pratinjau ulang.');
                        }
                        $category = $categories->first();
                        if ($row['category_id'] && (! $category || $category->id !== $row['category_id'])) {
                            $this->fail('Kategori berubah. Buat pratinjau ulang.');
                        }
                        if (! $category) {
                            if (Category::where('name', $row['category'])->exists()) {
                                $this->fail('Nama kategori sudah dipakai di grup lain. Buat pratinjau ulang.');
                            }
                            $category = Category::create(['name' => $row['category'], 'catalog_group' => $row['group']]);
                        }
                        $data['sku'] = $data['sku'] ?: 'IMP-'.strtoupper(substr(hash('sha256', $draft->id.':'.$row['id']), 0, 16));
                        $created = app(ProductService::class)->createProduct([...$data, 'stock' => $data['stock'] ?? 0, 'category_id' => $category->id, 'minimum_stock' => 0, 'is_available' => true]);
                        $this->indexProduct($created->load('category.parent'), $catalog);
                        $counts['created']++;
                    }
                }
                // Receipt and product writes commit together, so a retry cannot import twice.
                DB::table('product_sheet_imports')->where('id', $draft->id)->update([
                    'payload' => '[]', 'result' => json_encode(['selection' => $selection, 'counts' => $counts], JSON_THROW_ON_ERROR),
                ]);

                return $counts;
            });
            CacheService::flushMotorcycleParts();

            return $result;
        });
    }

    private function normalize(array $raw, array $mapping, array $options): array
    {
        $errors = [];
        $warnings = [];
        $read = fn ($field) => isset($mapping[$field]) ? ($raw['values'][$mapping[$field]] ?? null) : null;
        $text = function ($field, $max = 255) use ($read, &$errors) {
            $value = $read($field);
            if ($value === null || $value === '') {
                return '';
            }
            if (is_bool($value) || ! is_scalar($value) || mb_strlen((string) $value) > $max || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', (string) $value)) {
                $errors[] = self::FIELDS[$field]." tidak valid (maksimal {$max} karakter).";

                return '';
            }

            return trim((string) $value);
        };
        $groupText = $text('group');
        $catalogGroups = $options['catalog_groups'];
        $group = $groupText === '' ? $options['default_group'] : array_search($this->key($groupText), array_map(fn ($label) => $this->key($label), $catalogGroups), true);
        if ($group === false) {
            $legacy = array_search($this->key($groupText), array_map(fn ($label) => $this->key($label), Category::CATALOG_GROUPS), true);
            $group = $legacy !== false && isset($catalogGroups[$legacy]) ? $legacy : false;
        }
        if ($group === false && array_key_exists($groupText, $catalogGroups)) {
            $group = $groupText;
        }
        if ($group === false) {
            $errors[] = 'Grup tidak ditemukan. Tambahkan jenis produk di Kelola Jenis terlebih dahulu.';
            $group = $options['default_group'];
        }
        if ($groupText === '') {
            $warnings[] = 'Grup kosong: memakai '.$catalogGroups[$group].'.';
        }
        $data = ['name' => $text('name'), 'brand' => $text('brand'), 'sku' => $text('sku'), 'description' => $text('description', 2000), 'unit' => $text('unit', 50)];
        $category = $text('category');
        foreach (['name' => $data['name'], 'category' => $category] as $field => $value) {
            if ($value === '') {
                $errors[] = self::FIELDS[$field].' wajib diisi.';
            }
        }
        $data['price'] = $this->number($read('price'), 'Harga Jual', $errors, required: true);
        $cost = $read('cost_price');
        if (($cost === null || $cost === '') && $options['use_estimated_cost']) {
            $cost = $read('estimated_cost');
        }
        $data['cost_price'] = $this->number($cost, 'Harga Beli / Modal', $errors);
        $data['stock'] = $this->number($read('stock'), 'Stok', $errors, max: 99999999);
        if ($data['unit'] === '') {
            $data['unit'] = 'pcs';
            $warnings[] = 'Satuan kosong: barang baru memakai pcs.';
        }

        return ['data' => $data, 'category' => $category, 'group' => $group, 'errors' => $errors, 'warnings' => $warnings];
    }

    private function number(mixed $value, string $label, array &$errors, bool $required = false, int $max = 9999999999999): ?int
    {
        if ($value === null || $value === '') {
            if ($required) {
                $errors[] = "$label wajib diisi. Formula harus sudah dihitung/disimpan di Excel.";
            }

            return null;
        }
        if (is_string($value)) {
            $value = trim(str_replace(["\u{00A0}", "\u{202F}"], ' ', $value));
            $value = trim(preg_replace('/^Rp\.?\s*/i', '', $value));
            // Sheets exports CSV using its locale's displayed currency format.
            // Validate grouping before removing separators, so a decimal fraction
            // or malformed grouping can never silently become a different price.
            if (preg_match('/^\d{1,3}(\.\d{3})+(,00)?$/', $value)) {
                $value = str_replace('.', '', explode(',', $value)[0]);
            } elseif (preg_match('/^\d{1,3}(,\d{3})+(\.00)?$/', $value)) {
                $value = str_replace(',', '', explode('.', $value)[0]);
            } elseif (preg_match('/^\d+(,00|\.00)$/', $value)) {
                $value = substr($value, 0, -3);
            }
        }
        if (is_bool($value) || ! is_numeric($value) || (float) $value < 0 || (float) $value > $max || floor((float) $value) !== (float) $value || (is_string($value) && ! preg_match('/^\d+$/', $value))) {
            $errors[] = "$label harus angka bulat positif atau 0, tanpa pemisah yang ambigu.";

            return null;
        }

        return (int) $value;
    }

    private function draft(string $token, string $userId, bool $lock = false): object
    {
        $query = DB::table('product_sheet_imports')->where('id', $token)->where('user_id', $userId)->where('expires_at', '>', now());
        $draft = ($lock ? $query->lockForUpdate() : $query)->first();
        if (! $draft) {
            $this->fail('Pratinjau kedaluwarsa (30 menit) atau tidak ditemukan. Upload ulang file.');
        }

        return $draft;
    }

    private function key(string $text): string
    {
        return trim(preg_replace('/[^\pL\pN]+/u', ' ', mb_strtolower($text)));
    }

    private function identity(string $text): string
    {
        // Ignore word order/punctuation while retaining complete sizes and decimal volumes.
        $text = preg_replace('/(?<=\d)\s+(?=l\b)/i', '', mb_strtolower($text));
        $text = preg_replace('/[^\pL\pN\/.]+/u', ' ', $text);
        $tokens = preg_split('/\s+/', trim($text), flags: PREG_SPLIT_NO_EMPTY);
        sort($tokens, SORT_STRING);

        return implode(' ', $tokens);
    }

    private function nameVariants(array $data): array
    {
        return array_unique([$this->identity($data['name']), $this->identity(trim($data['brand'].' '.$data['name']))]);
    }

    private function catalogIndex(): array
    {
        $index = ['skus' => [], 'names' => []];
        foreach (Product::with('category.parent')->lazy(200) as $product) {
            $this->indexProduct($product, $index);
        }

        return $index;
    }

    private function indexProduct(Product $product, array &$index): void
    {
        $index['skus'][mb_strtolower($product->sku)][$product->id] = $product;
        $index['names'][$this->group($product->category).':'.$this->identity($product->name)][$product->id] = $product;
    }

    private function nameMatches(array $data, string $group, array $index): Collection
    {
        $matches = [];
        foreach ($this->nameVariants($data) as $name) {
            $matches += $index['names'][$group.':'.$name] ?? [];
        }

        return collect($matches)->filter(function ($product) use ($data) {
            if ($data['brand'] === '') {
                return true;
            }
            if ($product->brand) {
                return $this->key($product->brand) === $this->key($data['brand']);
            }
            // Older catalog entries sometimes store the brand in the full name only.
            $nameWords = explode(' ', $this->key($product->name));

            return array_diff(explode(' ', $this->key($data['brand'])), $nameWords) === [];
        });
    }

    private function group(Category $category): string
    {
        return $category->parent?->catalog_group ?? $category->catalog_group;
    }

    private function fingerprint(Product $product): string
    {
        return hash('sha256', json_encode([$product->sku, $product->name, $product->category_id, $product->price, $product->cost_price, $product->stock, $product->sync_version, $product->updated_at?->format('Y-m-d H:i:s.u')]));
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['sheet' => $message]);
    }
}
