<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use App\Models\Setting;
use Illuminate\Validation\ValidationException;

class OrderPricingService
{
    public function totals(float $subtotal, float $discount = 0): array
    {
        $tax = Setting::where('group', 'tax')->pluck('value', 'key');
        $enabled = filter_var($tax['enabled'] ?? 'true', FILTER_VALIDATE_BOOLEAN);
        $rate = (float) ($tax['percentage'] ?? 0) / 100;
        $taxAmount = $enabled ? round($subtotal * $rate) : 0;

        return ['tax_amount' => $taxAmount, 'total' => max(0, $subtotal - $discount + $taxAmount)];
    }

    public function quote(array $items): float
    {
        $products = Product::whereIn('id', array_column($items, 'product_id'))->get(['id', 'price', 'stock', 'is_available'])->keyBy('id');
        $required = collect($items)->groupBy('product_id')->map(fn ($rows) => $rows->sum('quantity'));
        $subtotal = 0.0;
        foreach ($items as $item) {
            $product = $products->get($item['product_id']);
            if (! $product || ! $product->is_available || (float) $product->stock < $required[$product->id]) {
                throw ValidationException::withMessages(['items' => 'Produk atau stok berubah. Muat ulang POS sebelum menerima pembayaran.']);
            }
            $subtotal += round((float) $product->price * $item['quantity'], 2);
        }

        return (float) $this->totals($subtotal)['total'];
    }
}
