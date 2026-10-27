<?php

declare(strict_types=1);

namespace App\Services\ProductSheet;

final class ProductSheetColumns
{
    public const FIELDS = [
        'group' => 'Grup Barang', 'category' => 'Kategori', 'brand' => 'Merek',
        'name' => 'Nama Barang', 'description' => 'Deskripsi / Spesifikasi',
        'cost_price' => 'Harga Modal (Rp)', 'price' => 'Harga Jual (Rp)',
        'stock' => 'Stok', 'unit' => 'Satuan', 'sku' => 'Kode Barang',
    ];

    public const ALIASES = [
        'group' => ['grup barang', 'grup', 'kelompok', 'catalog group'],
        'category' => ['kategori', 'jenis barang', 'category'],
        'brand' => ['merek', 'merk', 'brand'],
        'name' => ['nama barang', 'nama produk', 'nama', 'produk', 'product name', 'name'],
        'description' => ['deskripsi spesifikasi', 'spesifikasi keterangan', 'keterangan', 'spesifikasi', 'deskripsi', 'description'],
        'cost_price' => ['harga modal rp', 'harga modal', 'harga beli rp', 'harga beli', 'modal rp', 'modal', 'cost price rp', 'cost price'],
        'price' => ['harga jual rp', 'harga jual', 'harga rp', 'harga', 'price'],
        'stock' => ['stok', 'stock', 'jumlah stok'],
        'unit' => ['satuan', 'unit'],
        'sku' => ['kode barang', 'sku', 'kode produk'],
    ];

    public const EXPORT_FIELDS = ['group', 'category', 'brand', 'name', 'description', 'cost_price', 'price', 'stock', 'unit', 'margin', 'sku'];

    public static function exportHeaders(): array
    {
        return array_map(fn ($field) => $field === 'margin' ? 'Margin (Rp)' : self::FIELDS[$field], self::EXPORT_FIELDS);
    }
}
