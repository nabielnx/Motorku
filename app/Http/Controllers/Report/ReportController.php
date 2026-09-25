<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use App\Services\CashClosingService;
use App\Http\Requests\Report\StoreCashClosingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Carbon\Carbon;
use Inertia\Inertia;

class ReportController extends Controller implements HasMiddleware
{
    protected ReportService $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:report.view', only: ['indexWeb', 'index', 'sales', 'export', 'daily', 'cash']),
        ];
    }

    public function indexWeb(Request $request)
    {
        [$startDate, $endDate] = $this->dateRange($request);
        $reportStats = $this->reportService->getReportStats($startDate, $endDate);

        return Inertia::render('Report/Index', [
            'reportStats' => $reportStats,
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->dateRange($request);
        $data = $this->reportService->getSummaryByDateRange($startDate, $endDate);

        return response()->json([
            'data' => $data
        ]);
    }

    public function sales(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->dateRange($request);
        $items = $this->reportService->getSalesByDateRange($startDate, $endDate);

        return response()->json(['data' => $items]);
    }

    public function export(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->dateRange($request);
        $orders = $this->reportService->getExportDataByDateRange($startDate, $endDate);

        return response()->json(['data' => $orders]);
    }

    public function daily(Request $request): JsonResponse
    {
        $date = $request->validate(['date' => ['nullable', 'date']])['date'] ?? null;
        $summary = $this->reportService->getDailySummary($date);

        return response()->json([
            'message' => 'Laporan harian berhasil ditarik',
            'data' => $summary
        ]);
    }

    public function cash(Request $request, CashClosingService $cashClosing): JsonResponse
    {
        $date = $request->validate(['date' => ['required', 'date_format:Y-m-d']])['date'];

        return response()->json(['data' => $cashClosing->summary($date)]);
    }

    public function closeCash(StoreCashClosingRequest $request, CashClosingService $cashClosing): JsonResponse
    {
        return response()->json(['data' => $cashClosing->close($request->validated())], 201);
    }

    private function dateRange(Request $request): array
    {
        $start = Carbon::parse($request->query('start_date', now()->startOfMonth()->toDateString()))->startOfDay();
        $end = Carbon::parse($request->query('end_date', now()->toDateString()))->endOfDay();

        if ($end->lt($start)) {
            abort(422, 'Rentang tanggal tidak valid.');
        }

        return [$start, $end];
    }
}
