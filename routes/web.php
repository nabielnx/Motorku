<?php

use App\Http\Controllers\Order\CustomerMenuController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Dashboard\PosController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Category\CategoryController;
use App\Http\Controllers\Order\OrderController;
use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\Inventory\InventoryController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\Setting\SettingController;
use App\Http\Controllers\Motorcycle\MotorSayaController;
use App\Http\Controllers\Motorcycle\MotorcycleController;
use Illuminate\Support\Facades\Route;

use Inertia\Inertia;

// Public QR Customer Menu (katalog sparepart)
Route::get('/', [CustomerMenuController::class, 'index'])->name('home');

// Public Customer QR Flow
// Rotasi token CSRF agar auto-refresh di frontend selalu mendapat token baru
// yang cocok dengan sesi server (cegah 419 berulang setelah deploy/sesi berubah).
Route::get('/sanctum/csrf-cookie', function (\Illuminate\Http\Request $request) {
    $request->session()->regenerateToken();
    return response()->noContent();
});
Route::get('/payment', fn() => Inertia::render('Payment/Index'))->name('customer.payment');
Route::get('/payment/qris', fn() => Inertia::render('Payment/Qris'))->name('customer.payment.qris');
Route::get('/order/waiting', fn() => Inertia::render('Order/Waiting'))->name('customer.order.waiting');
Route::get('/order/status', fn() => Inertia::render('Order/Status'))->name('customer.order.status');

// Public "Motor Saya" — motorcycle part finder
Route::get('/motor-saya', [MotorSayaController::class, 'index'])->name('motor-saya');
Route::get('/api/motor-saya/{motorcycleId}/parts', [MotorSayaController::class, 'compatibleParts'])->name('motor-saya.parts');

// Protected Web App
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'indexWeb'])->name('products.index');
    });

    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'indexWeb'])->name('orders.index');
        Route::get('/{orderId}', [OrderController::class, 'showWeb'])->name('orders.show');
    });

    Route::prefix('pos')->group(function () {
        Route::get('/', [PosController::class, 'index'])->name('pos.index');
    });

    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'indexWeb'])->name('users.index');
    });

    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingController::class, 'indexWeb'])->name('settings.index');
    });

    Route::prefix('inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'indexWeb'])->name('inventory.index');
    });

    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'indexWeb'])->name('reports.index');
    });

    // Motorcycle management (admin)
    Route::prefix('motorcycles')->middleware('role:owner')->group(function () {
        Route::get('/', [MotorcycleController::class, 'indexWeb'])->name('motorcycles.index');
        Route::post('/', [MotorcycleController::class, 'store'])->name('motorcycles.store');
        Route::post('/bulk-attach', [MotorcycleController::class, 'bulkAttach'])->name('motorcycles.bulk-attach');
        Route::put('/{id}', [MotorcycleController::class, 'update'])->name('motorcycles.update');
        Route::delete('/{id}', [MotorcycleController::class, 'destroy'])->name('motorcycles.destroy');
        Route::get('/{id}/parts', [MotorcycleController::class, 'parts'])->name('motorcycles.parts');
        Route::post('/{id}/parts', [MotorcycleController::class, 'attachPart'])->name('motorcycles.attach-part');
        Route::put('/{motorcycleId}/parts/{partId}', [MotorcycleController::class, 'updatePart'])->name('motorcycles.update-part');
        Route::delete('/{motorcycleId}/parts/{partId}', [MotorcycleController::class, 'detachPart'])->name('motorcycles.detach-part');
    });
});

require __DIR__ . '/auth.php';
