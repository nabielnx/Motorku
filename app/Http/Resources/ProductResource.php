<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'name' => $this->name,
            'description' => $this->description,
            'price' => (float) $this->price,
            'stock' => (int) $this->stock,
            'minimum_stock' => (int) $this->minimum_stock,
            'unit' => $this->unit,
            'image_url' => $this->image_path ? asset('storage/'.$this->image_path) : null,
            'is_available' => (bool) $this->is_available,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'motorcycles' => MotorcycleResource::collection($this->whenLoaded('motorcycles')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
