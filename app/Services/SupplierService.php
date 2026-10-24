<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Supplier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class SupplierService
{
    public function listing(array $filters): LengthAwarePaginator
    {
        $query = Supplier::query()->select(['id', 'name', 'contact_person', 'phone', 'email', 'address', 'notes'])->orderBy('name')->orderBy('id');
        $search = trim($filters['search'] ?? '');
        if ($search !== '') {
            $pattern = '%'.addcslashes($search, '\\%_').'%';
            $query->where(function (Builder $query) use ($pattern) {
                $query->where('name', 'like', $pattern)
                    ->orWhere('contact_person', 'like', $pattern)
                    ->orWhere('phone', 'like', $pattern)
                    ->orWhere('email', 'like', $pattern);
            });
        }
        $suppliers = $query->paginate(15)->withQueryString();
        if ($suppliers->currentPage() > $suppliers->lastPage()) {
            $suppliers = $query->paginate(15, page: $suppliers->lastPage())->withQueryString();
        }

        return $suppliers;
    }

    public function save(array $data, ?Supplier $supplier = null): Supplier
    {
        $supplier ??= new Supplier;
        $supplier->fill($data)->save();

        return $supplier;
    }

    public function delete(Supplier $supplier): void
    {
        $supplier->delete();
    }
}
