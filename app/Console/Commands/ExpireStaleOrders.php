<?php

namespace App\Console\Commands;

use App\Enums\InventoryLogType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Services\InventoryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpireStaleOrders extends Command
{
    protected $signature = 'orders:expire-stale
                            {--dry-run : Tampilkan order yang akan di-expire tanpa melakukan perubahan}';

    protected $description = 'Batalkan order pending + unpaid yang sudah melewati batas waktu (expires_at).';

    public function handle(InventoryService $inventoryService): int
    {
        $staleOrders = Order::stale()->with('items')->get();

        if ($staleOrders->isEmpty()) {
            $this->info('Tidak ada order kadaluarsa yang ditemukan.');
            return self::SUCCESS;
        }

        $this->info("Ditemukan {$staleOrders->count()} order kadaluarsa.");

        if ($this->option('dry-run')) {
            $this->table(
                ['Order Number', 'Customer', 'Total', 'Ordered At', 'Expires At'],
                $staleOrders->map(fn (Order $o) => [
                    $o->order_number,
                    $o->customer_name,
                    'Rp ' . number_format((float) $o->total, 0, ',', '.'),
                    $o->ordered_at?->format('Y-m-d H:i'),
                    $o->expires_at?->format('Y-m-d H:i'),
                ])
            );
            $this->warn('Dry-run mode: tidak ada perubahan yang dilakukan.');
            return self::SUCCESS;
        }

        $expired = 0;
        $failed = 0;

        foreach ($staleOrders as $order) {
            try {
                $wasExpired = DB::transaction(function () use ($order, $inventoryService) {
                    $order = Order::whereKey($order->id)->lockForUpdate()->first();
                    if (! $order || ! Order::stale()->whereKey($order->id)->exists()) {
                        return false;
                    }

                    // Restore stock for each item
                    foreach ($order->items as $item) {
                        $inventoryService->adjustStock(
                            [
                                'product_id' => $item->product_id,
                                'type'       => InventoryLogType::StockReturn,
                                'quantity'   => $item->quantity,
                                'reference_type' => \App\Models\Order::class,
                                'reference_id' => $order->id,
                            ],
                            null, // system operation
                            'Stok dikembalikan — order ' . $order->order_number . ' kadaluarsa otomatis'
                        );
                    }

                    $order->update([
                        'order_status' => OrderStatus::Cancelled,
                        'sync_version' => $order->sync_version + 1,
                    ]);
                    return true;
                });

                if ($wasExpired) {
                    $expired++;
                    $this->line("  ✓ {$order->order_number} — dibatalkan.");
                }
            } catch (\Throwable $e) {
                $failed++;
                $this->error("  ✗ {$order->order_number} — gagal: {$e->getMessage()}");
                Log::error('ExpireStaleOrders failed', [
                    'order_id' => $order->id,
                    'error'    => $e->getMessage(),
                ]);
            }
        }

        $this->info("Selesai: {$expired} order dibatalkan, {$failed} gagal.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
