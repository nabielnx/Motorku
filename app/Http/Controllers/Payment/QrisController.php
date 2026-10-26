<?php

declare(strict_types=1);

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\QrisQuoteRequest;
use App\Models\Payment;
use App\Services\QrisService;
use App\Traits\ApiResponseHelpers;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class QrisController extends Controller
{
    use ApiResponseHelpers;

    public function quote(QrisQuoteRequest $request, QrisService $qris): JsonResponse
    {
        Gate::authorize('create', Payment::class);
        $data = $request->validated();

        return $this->successResponse('QRIS bernominal siap ditampilkan.', $qris->quote($data['items'], (float) $data['expected_amount'], (string) $request->user()->id))
            ->header('Cache-Control', 'no-store');
    }
}
