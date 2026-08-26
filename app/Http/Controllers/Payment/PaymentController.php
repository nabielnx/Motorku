<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use App\Http\Requests\Payment\StorePaymentRequest;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use App\Models\Payment;

class PaymentController extends Controller implements HasMiddleware
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:payment.view', only: ['index', 'show']),
            new Middleware('permission:payment.create', only: ['store']),
            new Middleware('permission:payment.refund', only: ['updateStatus']),
        ];
    }

    public function index(Request $request)
    {
        Gate::authorize('viewAny', Payment::class);
        
        $perPage = $request->integer('per_page', 15);
        return response()->json($this->paymentService->getAllPayments($perPage));
    }

    public function show($id)
    {
        // 1. Ambil data dulu
        $payment = $this->paymentService->getPaymentById($id);

        if (!$payment) {
            return response()->json(['message' => 'Data pembayaran tidak ditemukan'], 404);
        }

        // 2. Cek Policy
        Gate::authorize('view', $payment);

        return response()->json($payment);
    }

    public function store(StorePaymentRequest $request)
    {
        Gate::authorize('create', Payment::class);

        $payment = $this->paymentService->processPayment($request->validated());

        return response()->json([
            'message' => 'Pembayaran berhasil diproses!',
            'data' => $payment
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        // 1. Ambil data dulu
        $payment = $this->paymentService->getPaymentById($id);

        if (!$payment) {
            return response()->json(['message' => 'Data pembayaran tidak ditemukan'], 404);
        }

        // 2. Cek Policy (Gate 3)
        // Pastikan di PaymentPolicy, method update()-nya sudah tidak me-return false
        Gate::authorize('update', $payment);

        // 3. Validasi (Gate 2 - Inline)
        $validated = $request->validate([
            'status' => ['required', 'in:pending,paid,failed,expired,cancelled,refunded']
        ]);

        // 4. Eksekusi
        $updatedPayment = $this->paymentService->updatePaymentStatus($id, $validated['status']);

        return response()->json([
            'message' => 'Status pembayaran berhasil diperbarui!',
            'data' => $updatedPayment
        ]);
    }

}
