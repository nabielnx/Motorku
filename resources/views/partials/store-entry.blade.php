<div class="min-h-dvh bg-[#f3f3ed] text-[#19231f]">
    <header class="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-5">
        <a href="{{ route('home') }}" class="font-heading text-xl font-semibold">TokoM</a>
        <a href="{{ auth()->check() ? route('dashboard') : route('login') }}" class="rounded-lg border border-[#dedfd7] bg-white px-4 py-2 text-sm font-semibold">{{ auth()->check() ? 'Buka admin' : 'Masuk pengelola' }}</a>
    </header>
    <main class="mx-auto flex max-w-xl flex-col items-center px-5 py-16 text-center sm:py-24">
        <div class="mb-6 h-16 w-16 rounded-2xl bg-[#19231f]" aria-hidden="true"></div>
        <h1 class="font-heading text-3xl font-semibold sm:text-4xl">Buka toko pilihanmu</h1>
        <p class="mt-4 text-sm leading-7 text-[#526159]">Gunakan tautan atau pindai QR yang dibagikan penjual untuk melihat katalog dan memesan dari toko yang tepat.</p>
        <div class="mt-8 w-full rounded-xl border border-[#dedfd7] bg-white p-5 text-left">
            <h2 class="text-sm font-semibold">Sudah punya akun pelanggan?</h2>
            <p class="mt-2 text-sm leading-6 text-[#526159]">Akunmu tetap bisa dipakai di berbagai toko. Buka tautan toko untuk belanja dan melihat pesanan di sana.</p>
            <a href="{{ route('customer.account') }}" class="mt-4 inline-block text-sm font-semibold">Buka akun pelanggan</a>
        </div>
    </main>
</div>
