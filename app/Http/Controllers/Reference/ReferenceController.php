<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reference;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reference\ReferenceEntryRequest;
use App\Http\Requests\Reference\ReferenceQueryRequest;
use App\Models\DataType;
use App\Models\ReferenceEntry;
use App\Services\ReferenceService;
use App\Traits\ApiResponseHelpers;
use Inertia\Inertia;

class ReferenceController extends Controller
{
    use ApiResponseHelpers;

    public function __construct(private ReferenceService $references) {}

    public function index(ReferenceQueryRequest $request, DataType $type)
    {
        abort_unless($type->kind === 'reference', 404);
        if ($type->driver === 'motorcycles') {
            return redirect()->route('motorcycles.index');
        }
        $search = $request->validated('search', '') ?? '';

        return Inertia::render('Reference/Index', ['type' => $type, 'entries' => $this->references->entries($type, $search), 'filters' => ['search' => $search]]);
    }

    public function products(ReferenceQueryRequest $request, DataType $type)
    {
        $search = $request->validated('search', '') ?? '';

        return $this->successResponse('Produk.', $this->references->products($type, $search));
    }

    public function store(ReferenceEntryRequest $request, DataType $type)
    {
        return $this->successResponse('Data ditambahkan.', $this->references->save($type, $request->validated()), 201);
    }

    public function update(ReferenceEntryRequest $request, DataType $type, ReferenceEntry $entry)
    {
        return $this->successResponse('Data diperbarui.', $this->references->save($type, $request->validated(), $entry));
    }

    public function destroy(DataType $type, ReferenceEntry $entry)
    {
        $this->references->delete($type, $entry);

        return $this->successResponse('Data dihapus.');
    }
}
