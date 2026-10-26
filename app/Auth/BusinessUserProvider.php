<?php

declare(strict_types=1);

namespace App\Auth;

use App\Models\Scopes\BusinessScope;
use App\Services\BusinessContext;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;

/** Login/reset tokens identify an account globally; staff administration stays scoped. */
final class BusinessUserProvider extends EloquentUserProvider
{
    protected function newModelQuery($model = null)
    {
        return parent::newModelQuery($model)->withoutGlobalScope(BusinessScope::class);
    }

    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false)
    {
        return app(BusinessContext::class)->run($user->business_id ?? BusinessContext::LEGACY_ID,
            fn () => parent::rehashPasswordIfRequired($user, $credentials, $force));
    }
}
