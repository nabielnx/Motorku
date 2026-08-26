<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('product.view');
    }

    public function view(User $user, Product $product): bool
    {
        return $user->can('product.view');
    }

    public function create(User $user): bool
    {
        return $user->can('product.create');
    }

    public function update(User $user, Product $product): bool
    {
        return $user->can('product.update');
    }

    public function delete(User $user, Product $product): bool
    {
        // Contoh aturan ketat tambahan: 
        // Product nggak boleh dihapus kalau stoknya masih ada (opsional, sesuaikan bisnis)
        return $user->can('product.delete');
    }
}
