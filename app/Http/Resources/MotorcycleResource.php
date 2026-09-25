<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MotorcycleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'brand' => $this->brand,
            'model' => $this->model,
            'slug' => $this->slug,
            'year_start' => $this->year_start,
            'year_end' => $this->year_end,
            'engine_cc' => $this->engine_cc,
            'engine_type' => $this->engine_type,
            'image_url' => $this->image_url,
            'display_name' => $this->display_name,
            'products' => ProductResource::collection($this->whenLoaded('products')),
        ];
    }
}
