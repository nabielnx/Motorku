<?php

namespace App\Http\Requests\Report;

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

        $this->merge([
            'period' => $this->input('period', $hasDateRange ? 'custom' : 'this_month'),
            'start_date' => $this->input('start_date', now()->startOfMonth()->toDateString()),
            'end_date' => $this->input('end_date', now()->toDateString()),
        ]);
    }

    public function rules(): array
    {
        return [
            'period' => ['nullable', 'in:today,7_days,30_days,this_month,this_year,custom'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ];
    }
}
