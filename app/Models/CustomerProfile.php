<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

final class CustomerProfile extends Model
{
    use BelongsToBusiness, HasUuids;

    protected $fillable = ['customer_account_id', 'name', 'phone'];
}
