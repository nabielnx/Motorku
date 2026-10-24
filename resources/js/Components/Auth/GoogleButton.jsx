import { usePage } from '@inertiajs/react';

export default function GoogleButton() {
    const { google_login_enabled } = usePage().props;
    if (!google_login_enabled) return null;

    return <a href={route('google.redirect')} className="flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#dedfd7] bg-white px-4 py-2.5 text-sm font-semibold text-[#19231f] hover:bg-[#f3f3ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19231f]">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1a12.4 12.4 0 0 1-18.4-6.5H5.5v5.3A20.4 20.4 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.4 27.5a12.2 12.2 0 0 1 0-7.8v-5.3H5.5a20 20 0 0 0 0 18.4l6.9-5.3Z"/><path fill="#EA4335" d="M24 11.2c3 0 5.7 1 7.8 3.1l5.8-5.7A19.8 19.8 0 0 0 24 3.2a20.4 20.4 0 0 0-18.5 11.2l6.9 5.3A12.2 12.2 0 0 1 24 11.2Z"/></svg>
        Lanjutkan dengan Google
    </a>;
}
