<?php

declare(strict_types=1);

namespace App\Models\Scopes;

use App\Services\BusinessContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

final class BusinessScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(BusinessContext::class);
        if ($context->ready()) {
            $builder->where($model->qualifyColumn('business_id'), $context->id());
        }
    }
}
