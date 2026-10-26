<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use BelongsToBusiness;
    use HasUuids;

    protected $fillable = [
        'group',
        'key',
        'value',
        'type',
        'sync_version',
    ];
}
