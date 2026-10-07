<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StaffInvitation extends Notification
{
    public function __construct(public string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Undangan akun Motorku')
            ->greeting('Halo '.$notifiable->name.',')
            ->line('Anda diundang untuk mengakses Motorku sebagai '.($notifiable->hasRole('owner') ? 'Owner (akses penuh pengelolaan toko)' : 'Kasir').'.')
            ->line('Buat password Anda sendiri untuk mengaktifkan akun dan memverifikasi alamat email ini.')
            ->action('Aktifkan akun', route('staff.invitation.show', ['token' => $this->token, 'email' => $notifiable->email]))
            ->line('Tautan berlaku selama 24 jam dan hanya dapat digunakan sekali. Jika kedaluwarsa, minta owner mengirim ulang undangan.');
    }
}
