<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;

final class CustomerVerifyEmail extends VerifyEmail
{
    public function __construct(private ?string $shop = null) {}

    protected function verificationUrl($notifiable): string
    {
        return URL::temporarySignedRoute('customer.verification.verify', now()->addMinutes(60), [
            'id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification()),
            ...($this->shop ? ['shop' => $this->shop] : []),
        ]);
    }
}
