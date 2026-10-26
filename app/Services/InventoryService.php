<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\InventoryLogType;
use App\Models\InventoryLog;
use App\Models\Product;
use App\Support\DomainLimits;
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
     * @param  array  $data  Must contain: product_id, type (string|InventoryLogType), quantity
     * @param  string|null  $userId  Override auth()->id() for guest/system operations
     * @param  string|null  $note  Custom note, defaults to 'Penyesuaian stok manual'
     */
    public function adjustStock(array $data, ?string $userId = null, ?string $note = null): InventoryLog
    {
        $result = DB::transaction(function () use ($data, $userId, $note) {
            $product = Product::whereKey($data['product_id'])->lockForUpdate()->firstOrFail();
            $quantity = (float) $data['quantity'];
            $previousStock = (float) $product->getRawOriginal('stock');

            $type = $data['type'] instanceof InventoryLogType
                ? $data['type']
                : InventoryLogType::from($data['type']);

            if (! is_finite($quantity) || $quantity !== floor($quantity) || $quantity < ($type === InventoryLogType::Adjustment ? 0 : 1)) {
                throw ValidationException::withMessages(['quantity' => 'Jumlah stok harus berupa bilangan bulat yang valid.']);
            }
            if ($type !== InventoryLogType::Adjustment && $previousStock !== floor($previousStock)) {
                throw ValidationException::withMessages(['quantity' => 'Stok lama masih pecahan. Lakukan opname fisik sebelum transaksi.']);
            }
            $nextStock = match ($type) {
                InventoryLogType::StockOut => $previousStock - $quantity,
                InventoryLogType::Adjustment => $quantity,
                default => $previousStock + $quantity,
            };
            if ($nextStock > DomainLimits::MAX_STOCK || $quantity > DomainLimits::MAX_STOCK) {
                throw ValidationException::withMessages(['quantity' => 'Jumlah stok melebihi batas penyimpanan.']);
            }

            match ($type) {
                InventoryLogType::StockOut => $this->decrementStock($product, $quantity),
                InventoryLogType::StockIn => $product->increment('stock', $quantity),
                InventoryLogType::StockReturn => $product->increment('stock', $quantity),
                InventoryLogType::Adjustment => $product->update(['stock' => $quantity]),
            };
            $product->increment('sync_version');

            return InventoryLog::create([
                'product_id' => $data['product_id'],
                'product_name' => $product->name,
                'user_id' => $userId ?? (! request()->attributes->get('public_store') && auth()->user()?->business_id === app(BusinessContext::class)->id() ? auth()->id() : null),
                'type' => $type,
                'quantity' => $quantity,
                'note' => $note ?? $data['note'] ?? 'Penyesuaian stok manual',
                'previous_stock' => $previousStock,
                'new_stock' => $product->fresh()->stock,
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
            ]);
        });

        if (DB::transactionLevel() > 0) {
            DB::afterCommit(fn () => CacheService::flushMotorcycleParts());
        } else {
            CacheService::flushMotorcycleParts();
        }

        return $result;
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
