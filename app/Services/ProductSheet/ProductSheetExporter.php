<?php

declare(strict_types=1);

namespace App\Services\ProductSheet;

use App\Models\Category;
use App\Models\Product;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\ValidationException;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Options as WriterOptions;
use OpenSpout\Writer\XLSX\Writer;

class ProductSheetExporter
{
    public function export(string $format, ?string $group = null, bool $template = false)
    {
        // Keep the familiar sheet order, but label exported cost as actual purchase price.
        $headers = ['Grup Barang', 'Kategori', 'Merek', 'Nama Barang', 'Spesifikasi / Keterangan', 'Harga Beli (Rp)', 'Harga Jual (Rp)', 'Stok', 'Satuan', 'Margin (Rp)', 'Kode Barang'];
        $path = tempnam(sys_get_temp_dir(), 'tokom-sheet-');
        $name = ($template ? 'template-barang' : 'daftar-barang-'.now()->format('Ymd')).'.'.$format;
        $catalogGroups = Category::catalogGroups();
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

                if (! $template) {
                    foreach (Product::with('category.parent')->inCatalogGroup($group)->orderBy('name')->lazy(200) as $product) {
                        $values = [$catalogGroups[$this->group($product->category)], $product->category->name, $product->brand ?? '', $product->name, $product->description ?? '', $product->cost_price === null ? null : (float) $product->cost_price, (float) $product->price, (int) $product->stock, $product->unit, $product->cost_price === null ? null : (float) $product->price - (float) $product->cost_price, $product->sku];
                        $writer->addRow($this->exportRow($values));
                    }
                }
                $writer->close();
            } elseif ($format === 'csv') {
                $stream = fopen($path, 'wb');
                fwrite($stream, "\xEF\xBB\xBF");
                fputcsv($stream, $headers, ',', '"', '');

                if (! $template) {
                    foreach (Product::with('category.parent')->inCatalogGroup($group)->orderBy('name')->lazy(200) as $product) {
                        $values = [$catalogGroups[$this->group($product->category)], $product->category->name, $product->brand ?? '', $product->name, $product->description ?? '', $product->cost_price === null ? null : (float) $product->cost_price, (float) $product->price, (int) $product->stock, $product->unit, $product->cost_price === null ? null : (float) $product->price - (float) $product->cost_price, $product->sku];
                        fputcsv($stream, array_map(fn ($v) => is_string($v) && preg_match('/^[\s]*[=+\-@]/u', $v) ? "'".$v : $v, $values), ',', '"', '');
                    }
                }
                fclose($stream);
            } elseif ($format === 'pdf') {
                if (! $template && Product::inCatalogGroup($group)->count() > 1000) {
                    throw ValidationException::withMessages(['format' => 'PDF maksimal 1.000 produk. Pilih kelompok yang lebih kecil atau gunakan XLSX/CSV.']);
                }
                $products = $template ? collect() : Product::query()
                    ->select(['id', 'category_id', 'sku', 'name', 'description', 'brand', 'price', 'cost_price', 'stock', 'unit'])
                    ->with('category:id,name')
                    ->inCatalogGroup($group)
                    ->orderBy('name')
                    ->limit(1000)
                    ->get();
                $groupLabel = $group ? ($catalogGroups[$group] ?? $group) : 'Seluruh Katalog';
                $pdf = Pdf::loadView('pdf.products', [
                    'products' => $products,
                    'group' => $group,
                    'groupLabel' => $groupLabel,
                    'isTemplate' => $template,
                    'generatedAt' => now()->translatedFormat('d F Y H:i'),
                ])->setPaper('a4', 'landscape')->setOption('isPhpEnabled', false);

                // Add footers after rendering without enabling embedded PHP in the document.
                $pdf->render();
                $dompdf = $pdf->getDomPDF();
                $canvas = $dompdf->getCanvas();
                $font = $dompdf->getFontMetrics()->getFont('DejaVu Sans', 'normal');
                $canvas->page_text(730, 560, 'Halaman {PAGE_NUM} dari {PAGE_COUNT}', $font, 7.5, [0.3, 0.3, 0.3]);
                $canvas->page_text(28, 560, 'TokoM · Dokumen Rahasia Perusahaan', $font, 7.5, [0.3, 0.3, 0.3]);

                $pdf->save($path);
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

    private function group(Category $category): string
    {
        return $category->parent?->catalog_group ?? $category->catalog_group;
    }
}
