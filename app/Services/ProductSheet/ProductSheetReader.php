<?php

declare(strict_types=1);

namespace App\Services\ProductSheet;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use OpenSpout\Common\Entity\Cell\FormulaCell;
use OpenSpout\Reader\CSV\Options as CsvOptions;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Options as XlsxOptions;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use ZipArchive;

class ProductSheetReader
{
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

    public function read(UploadedFile $file): array
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

        return $sheets;
    }

    private function key(string $text): string
    {
        return trim(preg_replace('/[^\pL\pN]+/u', ' ', mb_strtolower($text)));
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
