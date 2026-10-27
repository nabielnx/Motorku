<?php

declare(strict_types=1);

namespace App\Services;

use App\Support\BusinessFiles;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;

final class ImagePreviewService
{
    private const SIZES = ['products' => [480, 480], 'logo' => [96, 96], 'promo_banners' => [480, 960]];

    public static function path(?string $path): ?string
    {
        if (! $path || ! BusinessFiles::owns($path) || strpbrk($path, '?#') !== false
            || ! isset(self::SIZES[explode('/', $path)[0]]) || str_ends_with($path, '.preview.webp')) {
            return null;
        }

        return preg_match('/\.(?:webp|png|jpe?g)$/i', $path)
            ? preg_replace('/\.[^.\/]+$/', '.preview.webp', $path) : null;
    }

    public function existing(?string $path): ?string
    {
        $preview = self::path($path);

        return $preview && Storage::disk('public')->exists($preview) ? $preview : null;
    }

    public function generate(string $path): ?string
    {
        $preview = self::path($path);
        if (! $preview) {
            return null;
        }
        $disk = Storage::disk('public');
        if ($disk->exists($preview)) {
            return $preview;
        }
        if ($disk->size($path) > 4 * 1024 * 1024) {
            throw new \RuntimeException('File sumber pratinjau maksimal 4 MB.');
        }
        [$width, $height] = self::SIZES[explode('/', $path)[0]];
        $source = $disk->get($path);
        $size = @getimagesizefromstring($source);
        if (! $size || $size[0] * $size[1] > 16_000_000) {
            throw new \RuntimeException('Gambar pratinjau tidak valid atau terlalu besar.');
        }
        if ($size[0] <= $width && $size[1] <= $height) {
            return null;
        }
        $image = ImageManager::gd()->read($source)->scaleDown(width: $width, height: $height);
        $bytes = (string) $image->toWebp(quality: 75, strip: true);
        if (strlen($bytes) >= strlen($source)) {
            return null;
        }
        if (! $disk->put($preview, $bytes)) {
            $disk->delete($preview);
            throw new \RuntimeException('Penyimpanan gambar pratinjau gagal.');
        }
        if (! $disk->exists($path)) {
            $disk->delete($preview);

            return null;
        }

        return $preview;
    }

    public function banner(?string $path): ?array
    {
        if (! $path) {
            return null;
        }
        if (! BusinessFiles::owns($path)) {
            return null;
        }
        $selected = $this->existing($path) ?? $path;
        $size = @getimagesize(Storage::disk('public')->path($selected));

        return ['src' => Storage::url($selected), 'width' => $size[0] ?? null, 'height' => $size[1] ?? null];
    }
}
