<?php

declare(strict_types=1);

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\SupplierIndexRequest;
use App\Http\Requests\Supplier\SupplierRequest;
use App\Models\Supplier;
use App\Services\SupplierService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function __construct(private SupplierService $suppliers) {}

    public function index(SupplierIndexRequest $request): Response
    {
        $filters = $request->validated();

        return Inertia::render('Supplier/Index', [
            'suppliers' => $this->suppliers->listing($filters),
            'filters' => ['search' => $filters['search'] ?? ''],
        ]);
    }

    public function store(SupplierRequest $request): RedirectResponse
    {
        $this->suppliers->save($request->validated());

        return back()->with('success', 'Supplier berhasil ditambahkan.');
    }

    public function update(SupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $this->suppliers->save($request->validated(), $supplier);

        return back()->with('success', 'Supplier berhasil diperbarui.');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $this->suppliers->delete($supplier);

        return back()->with('success', 'Supplier berhasil dihapus.');
    }
}
