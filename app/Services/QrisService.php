<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Setting;
use App\Support\BusinessFiles;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class QrisService
{
    public function __construct(
        private QrisPayloadService $payloads,
        private ImageUploadService $images,
        private SettingService $settings,
        private OrderPricingService $pricing
    ) {}

    public function configuration(): array
    {
        $values = $this->values();
        $path = $values['qris_image'] ?? null;
        $merchant = null;
        if ($path && ! empty($values['qris_payload'])) {
            try {
                $merchant = $this->payloads->details($values['qris_payload']);
            } catch (InvalidArgumentException) {
                // An old image remains usable manually until the owner activates it again.
            }
        }

        $enabled = Setting::where('group', 'payment')->where('key', 'qris_enabled')->value('value') !== 'false';

        return [
            'enabled' => $enabled,
            'available' => $enabled && filled($path),
            'url' => $path ? Storage::url($path) : null,
            'image_revision' => $path ? hash('sha256', $path) : null,
            'dynamic_available' => $merchant !== null,
            'merchant' => $merchant,
        ];
    }

    public function storeImage(UploadedFile $file, ?string $payload): array
    {
        if ($payload !== null) {
            $this->validatePayload($payload);
        }
        $old = Setting::where('group', 'store')->where('key', 'qris_image')->value('value');
        $this->images->replace($file, 'qris', $old, function (string $path) use ($payload) {
            return DB::transaction(function () use ($path, $payload) {
                $this->settings->upsertSetting('store', 'qris_image', $path);
                $this->settings->upsertSetting('store', 'qris_payload', $payload ?? '');

                return $path;
            });
        }, 'qris_image');
        CacheService::flushSettings();

        return $this->configuration();
    }

    public function activate(string $payload, string $revision): array
    {
        $this->validatePayload($payload);
        DB::transaction(function () use ($payload, $revision) {
            $image = Setting::where('group', 'store')->where('key', 'qris_image')->lockForUpdate()->first();
            if (! $image?->value || ! hash_equals(hash('sha256', $image->value), $revision)) {
                throw ValidationException::withMessages(['qris_image' => 'Gambar QRIS sudah berubah. Muat ulang Pengaturan lalu coba lagi.']);
            }
            $this->settings->upsertSetting('store', 'qris_payload', $payload);
        });
        CacheService::flushSettings();

        return $this->configuration();
    }

    public function deleteImage(): void
    {
        $path = DB::transaction(function () {
            $rows = Setting::where('group', 'store')->whereIn('key', ['qris_image', 'qris_payload'])->lockForUpdate()->get();
            $path = $rows->firstWhere('key', 'qris_image')?->value;
            foreach ($rows as $row) {
                $row->update(['value' => null]);
            }
            $this->settings->upsertSetting('payment', 'qris_enabled', 'false');

            return $path;
        });
        CacheService::flushSettings();
        if ($path && str_starts_with($path, 'qris/')) {
            BusinessFiles::delete($path);
        }
    }

    public function quote(array $items, float $expectedAmount, string $userId): array
    {
        $payload = $this->sourcePayload();
        $amount = $this->pricing->quote($items);
        if (abs($expectedAmount - $amount) > 0.001) {
            throw ValidationException::withMessages(['amount' => 'Harga atau pajak berubah. Muat ulang POS sebelum menerima pembayaran.']);
        }

        return [
            'payload' => $this->withAmount($payload, $amount),
            'amount' => $amount,
            'merchant' => $this->validatePayload($payload),
            'quote_token' => $this->token($payload, $items, $amount, $userId),
        ];
    }

    public function forCustomerOrder(string $orderId, string $customerToken): array
    {
        $order = Order::whereKey($orderId)->first();
        abort_unless($order && $order->customer_access_token && hash_equals($order->customer_access_token, $customerToken), 401, 'Pesanan atau token tidak valid.');

        if ($order->payment_review_requested_at || $order->payment_status !== PaymentStatus::Unpaid
            || in_array($order->order_status, [OrderStatus::Cancelled, OrderStatus::Completed], true)
            || $order->expires_at?->isPast()) {
            throw ValidationException::withMessages(['order' => 'Pesanan ini tidak dapat dibayar dengan QRIS. Periksa status pesanan atau hubungi toko.']);
        }

        $configuration = $this->configuration();
        $enabled = Setting::where('group', 'payment')->where('key', 'qris_enabled')->value('value') !== 'false';
        if (! $enabled || ! $configuration['url']) {
            throw ValidationException::withMessages(['qris' => 'QRIS toko sedang tidak tersedia. Silakan bayar di kasir.']);
        }
        $amount = (float) $order->total;
        if ($amount <= 0 || $amount > 10000000) {
            throw ValidationException::withMessages(['amount' => 'Nominal pesanan tidak dapat dibayar dengan QRIS. Silakan hubungi kasir.']);
        }

        return [
            'order_id' => $order->id,
            'amount' => $amount,
            'payload' => $configuration['dynamic_available'] ? $this->withAmount($this->sourcePayload(), $amount) : null,
            'url' => $configuration['dynamic_available'] ? null : $configuration['url'],
            'merchant' => $configuration['merchant'],
            'expires_at' => $order->expires_at?->toIso8601String(),
        ];
    }

    public function assertSaleQuote(?string $token, array $items, float $amount, string $userId): void
    {
        $configured = ! empty($this->values()['qris_payload']);
        if (! $configured && ! $token) {
            return;
        }
        $payload = $this->sourcePayload();
        if (! $token || ! hash_equals($this->token($payload, $items, $amount, $userId), $token)) {
            throw ValidationException::withMessages(['qris_quote' => 'Tagihan atau QRIS toko berubah. Buka ulang pembayaran dan periksa kembali nominal dana yang masuk.']);
        }
        $this->withAmount($payload, $amount);
    }

    private function sourcePayload(): string
    {
        $values = $this->values();
        $enabled = Setting::where('group', 'payment')->where('key', 'qris_enabled')->value('value') !== 'false';
        if (! $enabled || empty($values['qris_image']) || empty($values['qris_payload'])) {
            throw ValidationException::withMessages(['qris_payload' => 'QRIS bernominal belum tersedia. Owner perlu mengaktifkannya di Pengaturan.']);
        }
        $this->validatePayload($values['qris_payload']);

        return $values['qris_payload'];
    }

    private function values(): array
    {
        return Setting::where('group', 'store')->whereIn('key', ['qris_image', 'qris_payload'])->pluck('value', 'key')->all();
    }

    private function validatePayload(string $payload): array
    {
        try {
            return $this->payloads->details($payload);
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['qris_payload' => $exception->getMessage()]);
        }
    }

    private function withAmount(string $payload, float $amount): string
    {
        try {
            return $this->payloads->withAmount($payload, $amount);
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['amount' => $exception->getMessage()]);
        }
    }

    private function token(string $payload, array $items, float $amount, string $userId): string
    {
        $quantities = collect($items)->groupBy('product_id')->map(fn ($rows) => $rows->sum('quantity'))->sortKeys()->all();
        $message = json_encode(['qris-v1', app(BusinessContext::class)->id(), $userId, hash('sha256', $payload), number_format($amount, 2, '.', ''), $quantities], JSON_THROW_ON_ERROR);

        return hash_hmac('sha256', $message, config('app.key'));
    }
}
