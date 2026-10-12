<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Cell\FormulaCell;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Reader\CSV\Options as CsvOptions;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Options as XlsxOptions;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Options as WriterOptions;
use OpenSpout\Writer\XLSX\Writer;
use ZipArchive;

class ProductSheetService
{
    public const FIELDS = [
        'group' => 'Grup Barang', 'category' => 'Kategori', 'brand' => 'Merek',
        'name' => 'Nama Barang', 'description' => 'Spesifikasi / Keterangan',
        'estimated_cost' => 'Estimasi Modal (Rp)', 'price' => 'Harga Jual (Rp)',
        'stock' => 'Stok', 'unit' => 'Satuan', 'sku' => 'Kode Barang', 'cost_price' => 'Harga Beli (Rp)',
    ];

    private const ALIASES = [
        'group' => ['grup barang', 'grup', 'kelompok', 'catalog group'],
        'category' => ['kategori', 'jenis barang', 'category'],
        'brand' => ['merek', 'merk', 'brand'],
        'name' => ['nama barang', 'nama produk', 'nama', 'produk', 'product name', 'name'],
        'description' => ['spesifikasi keterangan', 'keterangan', 'spesifikasi', 'deskripsi', 'description'],
        'estimated_cost' => ['estimasi modal rp', 'estimasi modal', 'estimasi harga modal'],
        'price' => ['harga jual rp', 'harga jual', 'harga rp', 'harga', 'price'],
        'stock' => ['stok', 'stock', 'jumlah stok'],
        'unit' => ['satuan', 'unit'],
        'sku' => ['kode barang', 'sku', 'kode produk'],
        'cost_price' => ['harga beli rp', 'harga beli', 'modal', 'harga modal', 'cost price'],
    ];

    public function inspect(UploadedFile $file, string $userId): array
    {
        $xlsx = strtolower($file->getClientOriginalExtension()) === 'xlsx';
        $formulas = [];
        if ($xlsx) {
            $this->checkArchive($file->getPathname());
            $options = new XlsxOptions;
            $options->SHOULD_PRESERVE_EMPTY_ROWS = true;
            $reader = new XlsxReader($options);
        } else {
            $options = new CsvOptions;
            $options->FIELD_DELIMITER = $this->delimiter($file->getPathname());
            $options->SHOULD_PRESERVE_EMPTY_ROWS = true;
            $reader = new CsvReader($options);
        }
        $sheets = [];
        $count = 0;
        $scanned = 0;
        $bytes = 0;
        try {
            if ($xlsx) {
                $formulas = $this->formulaMetadata($file->getPathname());
            }
            $reader->open($file->getPathname());
            foreach ($reader->getSheetIterator() as $sheet) {
                if (method_exists($sheet, 'isVisible') && ! $sheet->isVisible()) {
                    continue;
                }
                if (count($sheets) >= 16) {
                    $this->fail('Maksimal 16 tab dalam satu file.');
                }
                $headers = null;
                $rows = [];
                $mapping = [];
                foreach ($sheet->getRowIterator() as $rowNumber => $row) {
                    if (++$scanned > 16000 || $rowNumber > 10000) {
                        $this->fail('Terlalu banyak baris. Hapus baris kosong berlebih atau pecah file.');
                    }
                    $values = [];
                    foreach ($row->getCells() as $column => $cell) {
                        $value = $cell->getValue();
                        if ($xlsx && $cell instanceof FormulaCell && isset($formulas[$sheet->getIndex()][$rowNumber][$column])) {
                            $value = $formulas[$sheet->getIndex()][$rowNumber][$column] ? $cell->getComputedValue() : null;
                        }
                        if (! is_null($value) && ! is_scalar($value)) {
                            $value = ['invalid_type' => true];
                        }
                        if (is_string($value)) {
                            $value = trim(str_starts_with($value, "\xEF\xBB\xBF") ? substr($value, 3) : $value);
                            if (! mb_check_encoding($value, 'UTF-8') || mb_strlen($value) > 2000) {
                                $this->fail('Sel harus berupa UTF-8 dan maksimal 2.000 karakter.');
                            }
                            $bytes += strlen($value);
                        }
                        $values[] = $value;
                    }
                    if (count($values) > 40 || $bytes > 5 * 1024 * 1024) {
                        $this->fail('Maksimal 40 kolom dan 5 MB isi sel.');
                    }
                    if (! array_filter($values, fn ($v) => $v !== null && $v !== '')) {
                        continue;
                    }
                    if ($headers === null) {
                        $guess = $this->guessMapping($values);
                        // Prefer a recognizable header after a short title; otherwise allow manual mapping.
                        if ($rowNumber <= 10 && count($guess) < 2 && count(array_filter($values)) <= 1) {
                            continue;
                        }
                        $headers = array_map(fn ($v) => is_scalar($v) ? (string) $v : '', $values);
                        $mapping = $guess;

                        continue;
                    }
                    if (++$count > 2000) {
                        $this->fail('Maksimal 2.000 barang per impor. Pecah file menjadi beberapa bagian.');
                    }
                    $rows[] = ['number' => $rowNumber, 'values' => $values];
                }
                if ($headers !== null && $rows !== []) {
                    $sheets[] = ['id' => count($sheets), 'name' => $sheet->getName() ?: 'Daftar Barang', 'headers' => $headers, 'mapping' => $mapping, 'rows' => $rows];
                }
            }
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            $this->fail('File tidak dapat dibaca. Unduh ulang sebagai Excel (.xlsx) atau CSV UTF-8.');
        } finally {
            $reader->close();
        }
        if ($sheets === []) {
            $this->fail('Tidak ada barang yang ditemukan di file.');
        }
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
                    $row['matched_name'] = $product?->name;
                    $row['action'] = $product ? 'update' : 'create';
                    if (($product && $input['mode'] === 'add') || (! $product && $input['mode'] === 'update')) {
                        $row['action'] = 'skip';
                    }
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
                        $row['warnings'][] = 'Hanya harga jual dan modal terpilih diperbarui. Stok, gambar, nama, dan kategori tetap.';
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
                        $created = app(ProductService::class)->createProduct([...$data, 'category_id' => $category->id, 'minimum_stock' => 0, 'is_available' => true]);
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

    public function export(string $format, ?string $group = null, bool $template = false)
    {
        // Keep the familiar sheet order, but label exported cost as actual purchase price.
        $headers = ['Grup Barang', 'Kategori', 'Merek', 'Nama Barang', 'Spesifikasi / Keterangan', 'Harga Beli (Rp)', 'Harga Jual (Rp)', 'Stok', 'Satuan', 'Margin (Rp)', 'Kode Barang'];
        $path = tempnam(sys_get_temp_dir(), 'motorku-sheet-');
        $name = ($template ? 'template-barang' : 'daftar-barang-'.now()->format('Ymd')).'.'.$format;
        try {
            if ($format === 'xlsx') {
                $options = new WriterOptions;
                $options->SHOULD_USE_INLINE_STRINGS = false;
                $options->DEFAULT_ROW_STYLE = (new Style)->setShouldWrapText(true);
                foreach ([16, 24, 18, 42, 48, 20, 20, 12, 14, 20, 26] as $column => $width) {
                    $options->setColumnWidth($width, $column + 1);
                }
                $writer = new Writer($options);
                $writer->openToFile($path);
                $writer->getCurrentSheet()->setName('Daftar Barang');
                $view = new SheetView;
                $view->setFreezeRow(2);
                $writer->getCurrentSheet()->setSheetView($view);
                $writer->addRow($this->exportRow($headers, (new Style)->setFontBold()));
            } else {
                $stream = fopen($path, 'wb');
                fwrite($stream, "\xEF\xBB\xBF");
                fputcsv($stream, $headers, ',', '"', '');
            }
            if (! $template) {
                foreach (Product::with('category.parent')->inCatalogGroup($group)->orderBy('name')->lazy(200) as $product) {
                    $values = [Category::CATALOG_GROUPS[$this->group($product->category)], $product->category->name, $product->brand ?? '', $product->name, $product->description ?? '', $product->cost_price === null ? null : (float) $product->cost_price, (float) $product->price, (int) $product->stock, $product->unit, $product->cost_price === null ? null : (float) $product->price - (float) $product->cost_price, $product->sku];
                    if ($format === 'xlsx') {
                        $writer->addRow($this->exportRow($values));
                    } else {
                        fputcsv($stream, array_map(fn ($v) => is_string($v) && preg_match('/^[\s]*[=+\-@]/u', $v) ? "'".$v : $v, $values), ',', '"', '');
                    }
                }
            }
            if ($format === 'xlsx') {
                $writer->close();
            } else {
                fclose($stream);
            }
        } catch (\Throwable $exception) {
            if (isset($writer)) {
                $writer->close();
            }
            if (isset($stream) && is_resource($stream)) {
                fclose($stream);
            }
            @unlink($path);
            throw $exception;
        }

        return response()->download($path, $name, ['Cache-Control' => 'private, no-store'])->deleteFileAfterSend();
    }

    private function exportRow(array $values, ?Style $style = null): Row
    {
        return new Row(array_map(fn ($value) => is_string($value) ? new StringCell($value, null) : Cell::fromValue($value), $values), $style);
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
        $group = $groupText === '' ? $options['default_group'] : array_search($this->key($groupText), array_map(fn ($label) => $this->key($label), Category::CATALOG_GROUPS), true);
        if ($group === false && array_key_exists($groupText, Category::CATALOG_GROUPS)) {
            $group = $groupText;
        }
        if ($group === false) {
            $errors[] = 'Grup harus Otomotif, Sepeda, Elektronik, atau Alat Bangunan.';
            $group = $options['default_group'];
        }
        if ($groupText === '') {
            $warnings[] = 'Grup kosong: memakai '.Category::CATALOG_GROUPS[$group].'.';
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
        $data['stock'] = $this->number($read('stock'), 'Stok', $errors, max: 99999999) ?? 0;
        if ($read('stock') === null || $read('stock') === '') {
            $warnings[] = 'Stok kosong: barang baru mulai dari 0.';
        }
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
        return hash('sha256', json_encode([$product->sku, $product->name, $product->category_id, $product->price, $product->cost_price, $product->sync_version, $product->updated_at?->format('Y-m-d H:i:s.u')]));
    }

    private function guessMapping(array $headers): array
    {
        $mapping = [];
        foreach ($headers as $index => $header) {
            foreach (self::ALIASES as $field => $aliases) {
                if (! isset($mapping[$field]) && in_array($this->key((string) $header), $aliases, true)) {
                    $mapping[$field] = $index;
                    break;
                }
            }
        }

        return $mapping;
    }

    private function delimiter(string $path): string
    {
        $handle = fopen($path, 'rb');
        $sample = fgets($handle, 8192) ?: '';
        fclose($handle);
        $scores = [];
        foreach ([',', ';', "\t"] as $delimiter) {
            $scores[$delimiter] = count(str_getcsv($sample, $delimiter, '"', ''));
        }
        arsort($scores);

        return array_key_first($scores);
    }

    private function checkArchive(string $path): void
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            $this->fail('Excel tidak valid. Gunakan file .xlsx.');
        }
        try {
            if ($zip->numFiles > 1000 || $zip->locateName('xl/workbook.xml') === false) {
                $this->fail('Struktur Excel tidak didukung.');
            }
            $size = 0;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->statIndex($i);
                if (preg_match('~(^[/\\\\]|(^|[/\\\\])\.\.([/\\\\]|$)|^[a-zA-Z]:)~', $entry['name'])) {
                    $this->fail('Struktur Excel tidak aman. Unduh ulang file.');
                }
                $size += $entry['size'];
                if ($size > 25 * 1024 * 1024) {
                    $this->fail('Isi Excel terlalu besar (maksimal 25 MB setelah diekstrak).');
                }
            }
        } finally {
            $zip->close();
        }
    }

    private function formulaMetadata(string $path): array
    {
        // OpenSpout maps an uncached numeric formula to 0, and literal '=text' to
        // FormulaCell. Check the bounded XML to distinguish both before using prices.
        $zip = new ZipArchive;
        $zip->open($path);
        $metadata = [];
        $document = function (string $name) use ($zip): \DOMDocument {
            $xml = $zip->getFromName($name);
            if ($xml === false || stripos($xml, '<!DOCTYPE') !== false) {
                $this->fail('Struktur XML Excel tidak didukung.');
            }
            $doc = new \DOMDocument;
            if (! @$doc->loadXML($xml, LIBXML_NONET)) {
                $this->fail('Struktur XML Excel tidak valid.');
            }

            return $doc;
        };
        try {
            $relationships = [];
            foreach ($document('xl/_rels/workbook.xml.rels')->getElementsByTagName('Relationship') as $relation) {
                $target = $relation->getAttribute('Target');
                $relationships[$relation->getAttribute('Id')] = str_starts_with($target, '/') ? ltrim($target, '/') : 'xl/'.$target;
            }
            foreach ($document('xl/workbook.xml')->getElementsByTagName('sheet') as $index => $sheet) {
                $id = $sheet->getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
                $xml = $zip->getFromName($relationships[$id] ?? '');
                if ($xml === false || stripos($xml, '<!DOCTYPE') !== false) {
                    $this->fail('Struktur tab Excel tidak valid.');
                }
                $reader = \XMLReader::XML($xml, null, LIBXML_NONET);
                try {
                    while ($reader->read()) {
                        if ($reader->nodeType !== \XMLReader::ELEMENT || $reader->localName !== 'c') {
                            continue;
                        }
                        if (! preg_match('/^([A-Z]{1,2})([1-9]\d*)$/', $reader->getAttribute('r') ?? '', $coordinate)) {
                            continue;
                        }
                        $column = 0;
                        foreach (str_split($coordinate[1]) as $letter) {
                            $column = $column * 26 + ord($letter) - 64;
                        }
                        if ($column > 40 || (int) $coordinate[2] > 10000) {
                            continue;
                        }
                        $node = $reader->expand();
                        if ($node && $node->getElementsByTagName('f')->length > 0) {
                            $value = $node->getElementsByTagName('v')->item(0)?->textContent;
                            $metadata[$index][(int) $coordinate[2]][$column - 1] = $value !== null && $value !== '';
                        }
                    }
                } finally {
                    $reader->close();
                }
            }
        } finally {
            $zip->close();
        }

        return $metadata;
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['sheet' => $message]);
    }
}
