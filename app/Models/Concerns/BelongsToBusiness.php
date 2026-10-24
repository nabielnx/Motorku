<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Models\Scopes\BusinessScope;
use App\Services\BusinessContext;
use Illuminate\Database\Eloquent\Model;

trait BelongsToBusiness
{
    public static function bootBelongsToBusiness(): void
    {
        static::addGlobalScope(new BusinessScope);
        static::saving(function (Model $model): void {
            $context = app(BusinessContext::class);
            if (! $context->ready()) {
                return;
            }
            if (! $model->exists) {
                if ($model->business_id !== null && $model->business_id !== $context->id()) {
                    throw new \LogicException('Kepemilikan data tidak sesuai usaha aktif.');
                }
                $model->business_id = $context->id();
            } elseif ($model->isDirty('business_id') || ($model->business_id !== null && $model->business_id !== $context->id())) {
                throw new \LogicException('Kepemilikan data tidak dapat dipindahkan.');
            }
            $context->assertReferences($model);
        });
        static::deleting(function (Model $model): void {
            if (app(BusinessContext::class)->ready() && $model->business_id !== app(BusinessContext::class)->id()) {
                throw new \LogicException('Data bukan milik usaha aktif.');
            }
        });
    }
}
