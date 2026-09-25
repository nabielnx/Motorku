<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Toko Sparepart') }}</title>
        <meta name="description" content="Toko Sparepart - Sistem POS Kasir & Katalog QR Modern. Pesan online, ambil di toko tanpa antri.">

        <!-- Fonts (Non-blocking) -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700,800,900&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet" />
            <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700,800,900&display=swap" rel="stylesheet" />
        </noscript>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased h-full bg-amber-50/60">
        <div id="app" data-page="{{ json_encode($page) }}">
            <!-- Instant App Shell Skeleton (Paints in 0.1s before JS mounts) -->
            <div id="app-shell" class="min-h-screen bg-amber-50/60 font-sans flex justify-center">
                <div class="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-28">
                    <!-- HEADER SKELETON -->
                    <div class="bg-[#1E3A8A] px-4 py-3.5 text-white border-b-[3px] border-amber-400">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-md bg-white/20 animate-pulse shrink-0"></div>
                            <div class="space-y-1.5 flex-1">
                                <div class="h-4 bg-white/30 rounded w-36 animate-pulse"></div>
                                <div class="h-2.5 bg-white/20 rounded w-48 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    <!-- SEARCH + CATEGORY PILLS SKELETON -->
                    <div class="p-3 space-y-2.5 bg-white border-b border-slate-100">
                        <div class="h-8 bg-slate-100 rounded-md w-full animate-pulse"></div>
                        <div class="flex gap-2 overflow-hidden py-0.5">
                            <div class="h-6 w-20 bg-amber-400/40 rounded-md animate-pulse shrink-0"></div>
                            <div class="h-6 w-20 bg-slate-100 rounded-md animate-pulse shrink-0"></div>
                            <div class="h-6 w-24 bg-slate-100 rounded-md animate-pulse shrink-0"></div>
                            <div class="h-6 w-20 bg-slate-100 rounded-md animate-pulse shrink-0"></div>
                        </div>
                    </div>

                    <!-- ACTION BARS SKELETON -->
                    <div class="px-4 pt-3 space-y-2">
                        <div class="h-10 bg-slate-100 rounded-md animate-pulse"></div>
                        <div class="h-10 bg-emerald-50/60 border border-emerald-100 rounded-md animate-pulse"></div>
                    </div>

                    <!-- PRODUCT CARDS SKELETON -->
                    <div class="p-4 space-y-4 flex-1">
                        <div class="h-4 bg-slate-100 rounded w-28 animate-pulse"></div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            @for ($i = 0; $i < 6; $i++)
                            <div class="border border-slate-100 rounded-md p-2 space-y-2 bg-white">
                                <div class="h-28 bg-slate-100 rounded-md animate-pulse"></div>
                                <div class="h-3 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                                <div class="h-3 bg-red-100/60 rounded w-1/2 animate-pulse"></div>
                            </div>
                            @endfor
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
