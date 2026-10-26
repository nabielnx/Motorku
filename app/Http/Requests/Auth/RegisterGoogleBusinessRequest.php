<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Services\GoogleLoginService;

final class RegisterGoogleBusinessRequest extends RegisterBusinessRequest
{
    public function authorize(): bool
    {
        return parent::authorize() && app(GoogleLoginService::class)->pending($this) !== null;
    }

    public function rules(): array
    {
        return [...parent::rules(), 'email' => ['prohibited']];
    }
}
