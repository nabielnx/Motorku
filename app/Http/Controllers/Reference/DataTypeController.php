<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reference;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reference\DataTypeRequest;
use App\Models\DataType;
use App\Services\DataTypeService;
use App\Traits\ApiResponseHelpers;
use Inertia\Inertia;

class DataTypeController extends Controller
{
    use ApiResponseHelpers;

    public function __construct(private DataTypeService $types) {}

    public function index()
    {
        return Inertia::render('DataType/Index', ['types' => $this->types->listing()]);
    }

    public function store(DataTypeRequest $request)
    {
        return $this->successResponse('Jenis ditambahkan.', $this->types->save($request->validated()), 201);
    }

    public function update(DataTypeRequest $request, DataType $type)
    {
        return $this->successResponse('Jenis diperbarui.', $this->types->save($request->validated(), $type));
    }

    public function destroy(DataType $type)
    {
        $this->types->delete($type);

        return $this->successResponse('Jenis dihapus.');
    }
}
