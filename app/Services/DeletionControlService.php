<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;

class DeletionControlService
{
    public const MESSAGE = 'Penghapusan data admin sedang dikunci. Owner dapat mengaktifkannya di Pengaturan > Sistem.';

    public function enabled(): bool
    {
        // Read the current value, including when another browser tab just changed it.
        $setting = Setting::where('group', 'system')->where('key', 'deletion_enabled')->first(['value']);

        return $setting === null || $setting->value === 'true';
    }
}
