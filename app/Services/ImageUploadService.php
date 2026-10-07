<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Intervention\Image\ImageManager;
use Throwable;

class ImageUploadService
{
    public static function rules(string $presence = 'required'): array
    {
        return [$presence, 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096', 'dimensions:max_width=6000,max_height=6000', function ($attribute, $value, $fail) {
            $size = $value instanceof UploadedFile ? @getimagesize($value->getRealPath()) : false;
            if ($size && $size[0] * $size[1] > 16_000_000) {
                $fail('Resolusi gambar maksimal 16 megapiksel.');
            }
        }];
    }

    public function store(UploadedFile $file, string $directory, string $field = 'image'): string
    {
        $path = $directory.'/'.Str::uuid().'.webp';
        try {
            $image = ImageManager::gd()->read($file->getRealPath());
            $image->scaleDown(width: 2400, height: 2400);
            do {
                foreach ([85, 75, 65, 55] as $quality) {
                    $bytes = (string) $image->toWebp(quality: $quality, strip: true);
                    if (strlen($bytes) < 1_000_000) {
                        if (! Storage::disk('public')->put($path, $bytes)) {
                            throw new \RuntimeException('Penyimpanan gambar gagal.');
                        }

                        return $path;
                    }
                }
                $image->scaleDown(width: max(1, (int) ($image->width() * 0.8)), height: max(1, (int) ($image->height() * 0.8)));
            } while (max($image->width(), $image->height()) >= 128);
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($path);
            report($exception);
        }

        throw ValidationException::withMessages([$field => 'Gambar gagal dikonversi ke WebP di bawah 1 MB. Gunakan JPEG, PNG, atau WebP yang valid (maksimal 4 MB).']);
    }

    public function replace(UploadedFile $file, string $directory, ?string $oldPath, callable $save, string $field = 'image'): mixed
    {
        $path = $this->store($file, $directory, $field);
        try {
            $result = $save($path);
            if ($result === false) {
                throw new \RuntimeException('Referensi gambar gagal disimpan.');
            }
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($path);
            throw $exception;
        }
        if ($oldPath && ! str_starts_with($oldPath, 'http')) {
            Storage::disk('public')->delete($oldPath);
        }

        return $result;
    }
}
