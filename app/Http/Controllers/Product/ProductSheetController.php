<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\ProductSheetRequest;
use App\Services\ProductSheetService;

class ProductSheetController extends Controller
{
    public function __construct(private ProductSheetService $sheets) {}

    public function inspect(ProductSheetRequest $request)
    {
        return response()->json($this->sheets->inspect($request->file('file'), $request->user()->id))->header('Cache-Control', 'private, no-store');
    }

    public function preview(ProductSheetRequest $request)
    {
        return response()->json($this->sheets->preview($request->validated(), $request->user()->id))->header('Cache-Control', 'private, no-store');
    }

    public function commit(ProductSheetRequest $request)
    {
        return response()->json($this->sheets->commit($request->validated(), $request->user()->id))->header('Cache-Control', 'private, no-store');
    }

    public function export(ProductSheetRequest $request)
    {
        return $this->sheets->export($request->validated()['format'] ?? 'xlsx', $request->validated()['group'] ?? null);
    }

    public function template(ProductSheetRequest $request)
    {
        return $this->sheets->export($request->validated()['format'] ?? 'xlsx', template: true);
    }
}
