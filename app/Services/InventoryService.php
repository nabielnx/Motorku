<?php

namespace App\Services;

use App\Enums\InventoryLogType;
use App\Models\InventoryLog;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function getAllLogs(?int $perPage = null)
    {
        $query = InventoryLog::with('product')->latest();

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    public function getLogById($id)
    {
        return InventoryLog::with('product')->find($id);
    }

    public function deleteLog($id)
    {
        throw new \BadMethodCallException('Log inventori tidak dapat dihapus. Buat entri koreksi baru untuk memperbaiki stok.');
    }

    /**
     * Central stock mutation method. ALL stock changes MUST go through this.
     *
     * @param array $data  Must contain: product_id, type (string|InventoryLogType), quantity
     * @param string|null $userId  Override auth()->id() for guest/system operations
     * @param string|null $note  Custom note, defaults to 'Penyesuaian stok manual'
     */
    public function adjustStock(array $data, ?string $userId = null, ?string $note = null): InventoryLog
    {
        return DB::transaction(function () use ($data, $userId, $note) {
            $product = Product::whereKey($data['product_id'])->lockForUpdate()->firstOrFail();
            $quantity = (float) $data['quantity'];
            $previousStock = $product->stock;

            $type = $data['type'] instanceof InventoryLogType
                ? $data['type']
                : InventoryLogType::from($data['type']);

            match ($type) {
                InventoryLogType::StockOut   => $this->decrementStock($product, $quantity),
                InventoryLogType::StockIn    => $product->increment('stock', $quantity),
                InventoryLogType::StockReturn => $product->increment('stock', $quantity),
                InventoryLogType::Adjustment => $product->update(['stock' => $quantity]),
            };

            return InventoryLog::create([
                'product_id' => $data['product_id'],
                'user_id'    => $userId ?? auth()->id(),
                'type'       => $type,
                'quantity'   => $quantity,
                'note'       => $note ?? $data['note'] ?? 'Penyesuaian stok manual',
                'previous_stock' => $previousStock,
                'new_stock'      => $product->fresh()->stock,
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id'   => $data['reference_id'] ?? null,
            ]);
        });
    }

    private function decrementStock(Product $product, float $quantity): void
    {
        if ((float) $product->stock < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => 'Stok tidak mencukupi untuk pengeluaran ini.',
            ]);
        }
        $product->decrement('stock', $quantity);
    }

}
