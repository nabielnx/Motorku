<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Scopes\BusinessScope;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Laravel\Sanctum\PersonalAccessToken as SanctumToken;

/** Authentication may locate its account globally; authorization still uses business context. */
final class PersonalAccessToken extends SanctumToken
{
    public function tokenable(): MorphTo
    {
        return $this->morphTo('tokenable')->withoutGlobalScope(BusinessScope::class);
    }
}
