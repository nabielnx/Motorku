<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('category.view');
    }

    public function view(User $user, Category $category): bool
    {
        return $user->can('category.view');
    }

    public function create(User $user): bool
    {
        return $user->can('category.create');
    }

    public function update(User $user, Category $category): bool
    {
        return $user->can('category.update');
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->can('category.delete');
    }
}
