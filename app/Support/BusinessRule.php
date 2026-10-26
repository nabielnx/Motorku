<?php

declare(strict_types=1);

namespace App\Support;

use App\Services\BusinessContext;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Illuminate\Validation\Rules\Unique;

final class BusinessRule
{
    public static function exists(string $table, string $column = 'id'): Exists
    {
        return Rule::exists($table, $column)->where('business_id', app(BusinessContext::class)->id());
    }

    public static function unique(string $table, string $column): Unique
    {
        return Rule::unique($table, $column)->where('business_id', app(BusinessContext::class)->id());
    }
}
