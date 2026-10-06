<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\ReportDateRangeRequest;
use App\Http\Requests\Report\StoreCashClosingRequest;
use App\Services\CashClosingService;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
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

    public function indexWeb(ReportDateRangeRequest $request)
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

    public function index(ReportDateRangeRequest $request): JsonResponse
    {
        [$startDate, $endDate] = $this->dateRange($request);
        $data = $this->reportService->getSummaryByDateRange($startDate, $endDate);

        return response()->json([
            'data' => $data,
        ]);
    }

    public function sales(ReportDateRangeRequest $request): JsonResponse
    {
        [$startDate, $endDate] = $this->dateRange($request);
        $items = $this->reportService->getSalesByDateRange($startDate, $endDate);

        return response()->json(['data' => $items]);
    }

    public function export(ReportDateRangeRequest $request): JsonResponse
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
            'data' => $summary,
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

    private function dateRange(ReportDateRangeRequest $request): array
    {
        $start = Carbon::parse($request->validated('start_date'))->startOfDay();
        $end = Carbon::parse($request->validated('end_date'))->endOfDay();

        if ($end->lt($start)) {
            abort(422, 'Rentang tanggal tidak valid.');
        }

        return [$start, $end];
    }
}
