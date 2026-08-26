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

    public function updateLog($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $log = InventoryLog::findOrFail($id);

            // Revert the old log's effect
            $product = Product::whereKey($log->product_id)->lockForUpdate()->firstOrFail();

            $logType = $log->type instanceof InventoryLogType ? $log->type : InventoryLogType::from($log->type);

            if ($logType === InventoryLogType::StockIn) {
                $this->decrementStock($product, $log->quantity);
            } elseif ($logType === InventoryLogType::StockOut) {
                $product->increment('stock', $log->quantity);
            } elseif ($logType === InventoryLogType::Adjustment) {
                $this->applyAdjustment($product, -$log->quantity);
            }

            // Apply the new effect
            $newProduct = $log->product_id == ($data['product_id'] ?? $log->product_id) 
                ? $product 
                : Product::whereKey($data['product_id'])->lockForUpdate()->firstOrFail();

            $newQuantity = (float) ($data['quantity'] ?? $log->quantity);
            $newTypeRaw = $data['type'] ?? $logType->value;
            $newType = $newTypeRaw instanceof InventoryLogType ? $newTypeRaw : InventoryLogType::from($newTypeRaw);

            match ($newType) {
                InventoryLogType::StockOut   => $this->decrementStock($newProduct, $newQuantity),
                InventoryLogType::StockIn    => $newProduct->increment('stock', $newQuantity),
                InventoryLogType::Adjustment => $this->applyAdjustment($newProduct, $newQuantity),
            };

            $log->update($data);
            return $log;
        });
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

            $type = $data['type'] instanceof InventoryLogType
                ? $data['type']
                : InventoryLogType::from($data['type']);

            match ($type) {
                InventoryLogType::StockOut   => $this->decrementStock($product, $quantity),
                InventoryLogType::StockIn    => $product->increment('stock', $quantity),
                InventoryLogType::Adjustment => $this->applyAdjustment($product, $quantity),
            };

            return InventoryLog::create([
                'product_id' => $data['product_id'],
                'user_id'    => $userId ?? auth()->id(),
                'type'       => $type,
                'quantity'   => $quantity,
                'note'       => $note ?? $data['note'] ?? 'Penyesuaian stok manual',
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

    private function applyAdjustment(Product $product, float $quantity): void
    {
        if ($quantity > 0) {
            $product->increment('stock', $quantity);
        } else if ($quantity < 0) {
            $qty = abs($quantity);
            if ((float) $product->stock < $qty) {
                $product->update(['stock' => 0]);
            } else {
                $product->decrement('stock', $qty);
            }
        }
    }
}
