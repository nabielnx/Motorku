<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\CashClosing;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\Product;
use App\Models\User;
use App\Notifications\StoreActivity;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
    public function orderCreated(Order $order): void
    {
        $this->send('order', 'Pesanan baru', $order->order_number.' · '.$order->customer_name, $this->orderUrl($order));
    }

    public function orderUpdated(Order $order): void
    {
        if ($order->wasChanged('payment_status') && $order->payment_status === PaymentStatus::Paid) {
            $this->send('payment', 'Pembayaran diterima', $order->order_number.' sudah lunas.', $this->orderUrl($order));

            return;
        }
        if ($order->wasChanged('order_status') && ! ($order->order_status === OrderStatus::Completed && $order->payment_status === PaymentStatus::Unpaid)) {
            $this->send('order', 'Pesanan '.$order->order_status->label(), $order->order_number.' · '.$order->customer_name, $this->orderUrl($order));
        }
    }

    private function orderUrl(Order $order): string
    {
        // A search link remains usable even if an unpaid order is later deleted.
        return '/orders?search='.rawurlencode($order->order_number);
    }

    public function stockChanged(Product $product, bool $created = false): void
    {
        if (! $product->is_available || $product->stock > $product->minimum_stock) {
            return;
        }
        if (! $created) {
            if (! $product->wasChanged(['stock', 'minimum_stock', 'is_available'])) {
                return;
            }
            $wasLow = $product->getOriginal('is_available') && $product->getOriginal('stock') <= $product->getOriginal('minimum_stock');
            $becameEmpty = $product->stock === 0 && $product->getOriginal('stock') > 0;
            if ($wasLow && ! $becameEmpty) {
                return;
            }
        }
        $this->send('stock', $product->stock === 0 ? 'Stok produk habis' : 'Stok produk menipis',
            $product->name.' · '.$product->stock.' '.($product->unit ?? 'pcs').' tersisa.',
            '/products?search='.rawurlencode($product->sku ?: $product->name));
    }

    public function returned(OrderReturn $return): void
    {
        $order = Order::findOrFail($return->order_id);
        $this->send('return', 'Retur dicatat', $order->order_number.' · '.$return->quantity.' barang diretur.', $this->orderUrl($order));
    }

    public function cashClosed(CashClosing $closing): void
    {
        $different = (float) $closing->difference !== 0.0;
        $this->send('cash', $different ? 'Tutup kas memiliki selisih' : 'Kas harian ditutup',
            $closing->closing_date->format('d M Y').($different ? ' · Periksa selisih uang fisik.' : ' · Uang fisik sesuai rekap.'), '/reports', true);
    }

    public function send(string $category, string $title, string $message, string $url, bool $ownerOnly = false): void
    {
        $users = User::whereHas('roles', fn ($query) => $query->whereIn('name', $ownerOnly ? ['owner'] : ['owner', 'cashier']))
            ->where('is_active', true)->where('invitation_pending', false)
            ->whereNotNull('email_verified_at')->get();

        // Database-only delivery participates in the caller's transaction: rollback leaves no phantom alerts.
        Notification::send($users, new StoreActivity([
            'category' => $category, 'title' => $title, 'message' => $message,
            'url' => $url, 'owner_only' => $ownerOnly,
        ]));
    }

    private function visible(User $user): MorphMany
    {
        return $user->notifications()->where('type', StoreActivity::class)
            ->when(! $user->hasRole('owner'), fn ($query) => $query->where('data->owner_only', false));
    }

    public function summary(User $user): array
    {
        return [
            'unread_count' => $this->visible($user)->whereNull('read_at')->count(),
            'active_order_count' => Order::whereIn('order_status', ['pending', 'preparing', 'ready'])->count(),
            'low_stock_count' => Product::whereColumn('stock', '<=', 'minimum_stock')->count(),
            'out_stock_count' => Product::where('stock', '<=', 0)->count(),
        ];
    }

    public function list(User $user, bool $unreadOnly, int $page): array
    {
        $items = $this->visible($user)->when($unreadOnly, fn ($query) => $query->whereNull('read_at'))
            ->reorder()->orderByDesc('created_at')->orderByDesc('id')->paginate(10, ['*'], 'page', $page);

        return [...$this->summary($user), 'items' => $items->through(fn ($item) => [
            'id' => $item->id, ...$item->data,
            'read_at' => $item->read_at?->toIso8601String(),
            'created_at' => $item->created_at->toIso8601String(),
        ])];
    }

    public function markRead(User $user, string $id): void
    {
        $this->visible($user)->findOrFail($id)->markAsRead();
    }

    public function markAllRead(User $user): void
    {
        $this->visible($user)->whereNull('read_at')->update(['read_at' => now()]);
    }
}
