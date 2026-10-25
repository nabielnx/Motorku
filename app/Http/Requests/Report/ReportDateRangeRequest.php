<?php

declare(strict_types=1);

namespace App\Http\Requests\Report;

use App\Services\DateRangeService;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class ReportDateRangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('report.view') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $hasDateRange = $this->query->has('start_date') || $this->query->has('end_date');

        $period = $this->input('period', $hasDateRange ? 'custom' : 'this_month');
        $this->merge(['period' => $period]);
        if (is_string($period) && in_array($period, ['today', '7_days', '30_days', 'this_month', 'this_year'], true)) {
            $this->merge(app(DateRangeService::class)->preset($period));
        }
    }

    public function rules(): array
    {
        return [
            'period' => ['nullable', 'in:today,7_days,30_days,this_month,this_year,custom'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            if (Carbon::parse($this->input('start_date'))->diffInDays(Carbon::parse($this->input('end_date'))) > 365) {
                $validator->errors()->add('end_date', 'Rentang laporan maksimal 366 hari.');
            }
        }];
    }
}
