<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use BelongsToBusiness;
    use HasUuids;

    protected $fillable = ['name', 'contact_person', 'phone', 'email', 'address', 'notes', 'links'];

    protected $casts = ['links' => 'array'];
}
