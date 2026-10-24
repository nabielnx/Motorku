<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

final class Business extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'slug'];

    protected function casts(): array
    {
        return ['activated_at' => 'datetime'];
    }

    public function publicUrl(): string
    {
        return url('/s/'.$this->slug);
    }
}
