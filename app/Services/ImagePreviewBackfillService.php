<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use App\Models\Setting;

final class ImagePreviewBackfillService
{
    public function __construct(private ImagePreviewService $previews) {}

    public function run(string $businessId, int $limit, ?string $after, bool $apply): array
    {
        return app(BusinessContext::class)->run($businessId, function () use ($limit, $after, $apply): array {
            $products = Product::whereNotNull('image_path')->when($after, fn ($query) => $query->where('id', '>', $after))->orderBy('id')->limit($limit)->get(['id', 'image_path']);
            $settings = Setting::where('group', 'store')->whereIn('key', ['logo', 'promo_banner_1', 'promo_banner_2', 'promo_banner_3'])->pluck('value');
            $created = $failed = $eligible = 0;
            foreach ($products->pluck('image_path')->merge($settings)->unique()->filter() as $path) {
                if (! ImagePreviewService::path($path) || $this->previews->existing($path)) {
                    continue;
                }
                $eligible++;
                if ($apply) {
                    try {
                        $created += $this->previews->generate($path) !== null ? 1 : 0;
                    } catch (\Throwable $exception) {
                        report($exception);
                        $failed++;
                    }
                }
            }
            if ($created) {
                CacheService::flushSettings();
            }

            return ['products' => $products->count(), 'candidates' => $eligible, 'created' => $created, 'failed' => $failed, 'after' => $products->last()?->id];
        });
    }
}
