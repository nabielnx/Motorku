<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;

final class CustomerResetPassword extends ResetPassword
{
    public function __construct(string $token, private ?string $shop = null)
    {
        parent::__construct($token);
    }

    protected function resetUrl($notifiable): string
    {
        return route('customer.password.reset', [
            'token' => $this->token, 'email' => $notifiable->getEmailForPasswordReset(),
            ...($this->shop ? ['shop' => $this->shop] : []),
        ]);
    }
}
