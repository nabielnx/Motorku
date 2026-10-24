@php $adminLoading = app(\App\Services\LoadingSkeletonService::class)->forPage($page['component'] ?? ''); @endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full{{ $adminLoading ? ' admin-viewport' : '' }}">
    <head>
        <meta charset="utf-8">
        @if ($adminLoading)
            <script nonce="{{ Illuminate\Support\Facades\Vite::cspNonce() }}">
                try {
                    const savedTheme = localStorage.getItem('theme');
                    const darkTheme = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.toggle('dark', darkTheme);
                } catch {}
            </script>
        @endif
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#19231f">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

        <title inertia>{{ config('app.name', 'Motorku') }}</title>
        <meta name="description" content="Motorku - Sistem POS Kasir & Katalog QR Sparepart Modern. Pesan online, ambil di toko tanpa antri.">
        <link rel="icon" href="{{ asset('favicon.ico') }}" sizes="any">
        <link rel="manifest" href="{{ asset('manifest.webmanifest') }}">
        <link rel="apple-touch-icon" href="{{ asset('icons/motorku-v2-192.png') }}">
        @if (request()->routeIs('home', 'shop.home', 'motor-saya'))
            <link rel="canonical" href="{{ request()->routeIs('home', 'shop.home') ? (data_get($page, 'props.shop_slug') ? data_get($page, 'props.business.public_url') : route('home')) : route('motor-saya', array_filter(['slug' => data_get($page, 'props.initialPartsData.motorcycle.slug'), 'shop' => data_get($page, 'props.shop_slug')])) }}">
        @endif

        <!-- Fonts (Non-blocking) -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link data-app-font href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet" media="print" />
        <link data-app-font href="https://fonts.bunny.net/css?family=figtree:400,500,600,700,800,900&display=swap" rel="stylesheet" media="print" />
        <script nonce="{{ Illuminate\Support\Facades\Vite::cspNonce() }}">
            document.querySelectorAll('[data-app-font]').forEach(function (link) {
                const activate = function () { link.media = 'all'; };
                link.addEventListener('load', activate, { once: true });
                if (link.sheet) activate();
            });
        </script>
        <noscript>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet" />
            <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700,800,900&display=swap" rel="stylesheet" />
        </noscript>

        <!-- Scripts -->
        @routes(null, Illuminate\Support\Facades\Vite::cspNonce())
        @php $firstPromoBanner = collect(data_get($page, 'props.promoBanners', []))->filter()->first(); @endphp
        @if (request()->routeIs('home') && $firstPromoBanner)
            <link rel="preload" as="image" href="{{ $firstPromoBanner }}" fetchpriority="high">
        @endif
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased h-full bg-[#f3f3ed]">
        <script nonce="{{ Illuminate\Support\Facades\Vite::cspNonce() }}" data-page="app" type="application/json">{!! json_encode($page) !!}</script>
        <div id="app">
            @php $comp = $page['component'] ?? ''; @endphp
            @if ($comp === 'Order/Menu')
                <!-- Motorku Customer Storefront Catalog Shell (1:1 Exact Monochromatic Parity) -->
                <div class="customer-storefront min-h-screen bg-[#f3f3ed] text-slate-900" aria-busy="true" aria-label="Memuat katalog sparepart">
                    <!-- Store actions above a full-width search field -->
                    <header class="store-header">
                        <div class="store-header-shell">
                            <div class="store-brand">
                                <div class="h-7 w-7 shrink-0 rounded-lg bg-slate-200 animate-pulse"></div>
                                <div class="store-brand-name h-5 w-20 rounded bg-slate-200 animate-pulse"></div>
                            </div>
                            <div class="store-actions">
                                <div class="h-10 w-10 rounded-md bg-slate-200 animate-pulse"></div>
                                <div class="h-10 w-24 rounded-md bg-slate-200 animate-pulse"></div>
                                <div class="h-10 w-10 rounded-md bg-slate-200 animate-pulse"></div>
                                <div class="h-10 w-10 rounded-md bg-slate-200 animate-pulse"></div>
                            </div>
                            <div class="store-tools h-10 rounded-md bg-slate-100 animate-pulse"></div>
                        </div>
                    </header>

                    <!-- Main Storefront Content -->
                    <div class="store-catalog mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pb-12">
                        <!-- Promo Banner Section -->
                        <section class="pb-3">
                            <div class="rounded-2xl sm:rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden p-2.5 sm:p-3 shadow-2xs">
                                <div class="flex items-stretch gap-2.5">
                                    <div class="w-[45%] sm:w-[35%] shrink-0 rounded-xl sm:rounded-2xl bg-slate-200 p-3 flex flex-col justify-between">
                                        <div class="space-y-1.5">
                                            <div class="h-3 w-16 rounded-full bg-slate-300 animate-pulse"></div>
                                            <div class="h-4 w-28 rounded bg-slate-300 animate-pulse"></div>
                                        </div>
                                        <div class="h-6 w-20 rounded-lg bg-slate-300 animate-pulse"></div>
                                    </div>
                                    <div class="flex-1 flex gap-2 sm:gap-2.5 overflow-x-hidden">
                                        @for ($k = 0; $k < 2; $k++)
                                            <div class="w-[calc((100%-20px)/3.25)] sm:w-[calc((100%-24px)/3.35)] md:w-[155px] shrink-0 rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                                                <div class="aspect-square w-full bg-slate-100 animate-pulse"></div>
                                                <div class="p-1.5 sm:p-2 space-y-1.5">
                                                    <div class="h-2.5 w-5/6 rounded bg-slate-200 animate-pulse"></div>
                                                    <div class="h-2.5 w-3/5 rounded bg-slate-200 animate-pulse"></div>
                                                    <div class="h-3 w-14 rounded bg-slate-200 animate-pulse"></div>
                                                </div>
                                            </div>
                                        @endfor
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- Responsive Layout (Desktop Sidebar + Main Product Shelves) -->
                        <div class="grid grid-cols-1 gap-y-2.5 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-x-9 lg:gap-y-0">
                            <!-- Desktop Category Sidebar -->
                            <aside class="min-w-0 hidden lg:block">
                                <div class="sticky top-24 space-y-2">
                                    @for ($s = 0; $s < 5; $s++)
                                        <div class="h-9 w-full rounded-xl bg-slate-100 animate-pulse"></div>
                                    @endfor
                                </div>
                            </aside>

                            <!-- Mobile Category Pills -->
                            <div class="lg:hidden py-1 mb-2">
                                <div class="flex gap-1.5 overflow-x-hidden py-0.5">
                                    <div class="h-8 w-24 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                    <div class="h-8 w-28 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                    <div class="h-8 w-32 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                    <div class="h-8 w-24 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                </div>
                            </div>

                            <!-- Main Products Shelves -->
                            <main class="min-w-0 lg:col-start-2 space-y-6">
                                @for ($shelf = 1; $shelf <= 2; $shelf++)
                                    <section>
                                        <div class="mb-2 flex items-center justify-between">
                                            <div class="h-4 sm:h-5 w-36 rounded bg-slate-200 animate-pulse"></div>
                                            <div class="h-3 w-16 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                        <div class="flex gap-2 sm:gap-2.5 overflow-x-hidden pb-2">
                                            @for ($c = 0; $c < 4; $c++)
                                                <div class="w-[calc((100%-20px)/3.25)] sm:w-[calc((100%-24px)/3.35)] md:w-[155px] shrink-0 rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                                                    <div class="aspect-square w-full bg-slate-100 animate-pulse"></div>
                                                    <div class="p-1.5 sm:p-2 space-y-1.5">
                                                        <div class="h-2.5 sm:h-3 w-5/6 rounded bg-slate-200 animate-pulse"></div>
                                                        <div class="h-2.5 sm:h-3 w-3/5 rounded bg-slate-200 animate-pulse"></div>
                                                        <div class="mt-1 flex items-center gap-1">
                                                            <div class="h-3 w-7 rounded-[3px] bg-slate-200 animate-pulse"></div>
                                                            <div class="h-2 w-10 rounded bg-slate-200 animate-pulse"></div>
                                                        </div>
                                                        <div class="h-3.5 sm:h-4 w-14 rounded bg-slate-200 animate-pulse"></div>
                                                    </div>
                                                </div>
                                            @endfor
                                        </div>
                                    </section>
                                @endfor
                            </main>
                        </div>
                    </div>
                </div>
            @elseif ($comp === 'Motorcycle/MotorSaya')
                <!-- Motor Saya Customer Shell (Matches MotorcycleSelectionSkeleton & CompatiblePartsPageSkeleton) -->
                @php
                    $isPartsSlug = !empty($page['props']['initialPartsData']['motorcycle']);
                @endphp
                @if ($isPartsSlug)
                    <div class="customer-storefront customer-motor min-h-screen bg-[#f3f3ed] font-sans text-slate-800 flex justify-center" aria-busy="true" aria-label="Memuat sparepart kompatibel">
                        <div class="customer-frame w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-24">
                            <div class="sticky top-0 z-30 bg-white shadow-2xs">
                                <header class="motor-header relative bg-white border-b-[3px] border-[#FFDD00] shadow-2xs overflow-hidden">
                                    <div class="flex items-center justify-between min-h-[52px] sm:min-h-[58px] px-3.5 sm:px-5 gap-3">
                                        <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                            <div class="w-6 h-6 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                                            <div class="space-y-1 min-w-0">
                                                <div class="h-3.5 sm:h-4 w-28 sm:w-36 rounded bg-slate-200 animate-pulse"></div>
                                                <div class="h-2.5 w-24 sm:w-32 rounded bg-slate-200 animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div class="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                                            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 animate-pulse"></div>
                                            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 animate-pulse"></div>
                                        </div>
                                    </div>
                                </header>
                                <div class="p-2.5 sm:p-3 bg-white border-b border-slate-100 space-y-2 shadow-2xs">
                                    <div class="h-10 w-full rounded-md bg-slate-100 border border-slate-200 flex items-center px-3.5 gap-2">
                                        <div class="w-3.5 h-3.5 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                        <div class="h-3 w-48 rounded bg-slate-200 animate-pulse"></div>
                                    </div>
                                    <div class="flex gap-1.5 overflow-x-hidden pb-0.5 items-center">
                                        <div class="h-7 sm:h-8 w-24 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                        <div class="h-7 sm:h-8 w-28 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
                                        <div class="h-7 sm:h-8 w-20 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
                                        <div class="h-7 sm:h-8 w-26 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
                                        <div class="h-7 sm:h-8 w-24 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex-1 p-3 sm:p-4 space-y-4">
                                @for ($g = 0; $g < 2; $g++)
                                    <div class="space-y-2">
                                        <div class="h-3.5 sm:h-4 w-32 rounded bg-slate-200 animate-pulse px-0.5"></div>
                                        <div class="space-y-2">
                                            @for ($i = 0; $i < 3; $i++)
                                                <div class="flex items-stretch bg-white border border-slate-200 rounded-lg shadow-2xs h-[82px] sm:h-[88px] overflow-hidden">
                                                    <div class="w-[82px] sm:w-[88px] h-full bg-slate-100 animate-pulse shrink-0"></div>
                                                    <div class="flex-1 p-2 sm:p-2.5 min-w-0 flex flex-col justify-between">
                                                        <div>
                                                            <div class="h-3 sm:h-3.5 w-4/5 rounded bg-slate-200 animate-pulse"></div>
                                                            <div class="mt-1 h-3 w-16 rounded bg-slate-200 animate-pulse"></div>
                                                        </div>
                                                        <div class="h-3.5 sm:h-4 w-20 rounded bg-slate-200 animate-pulse"></div>
                                                    </div>
                                                    <div class="h-full w-9 sm:w-10 shrink-0 border-l border-slate-200 bg-slate-50 flex items-center justify-center">
                                                        <div class="w-4 h-4 rounded-full bg-slate-200 animate-pulse"></div>
                                                    </div>
                                                </div>
                                            @endfor
                                        </div>
                                    </div>
                                @endfor
                            </div>
                        </div>
                    </div>
                @else
                    <div class="customer-storefront customer-motor min-h-screen bg-[#f3f3ed] font-sans text-slate-800 flex justify-center" aria-busy="true" aria-label="Memuat katalog motor">
                        <div class="customer-frame w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-24">
                            <div class="sticky top-0 z-30 bg-white shadow-2xs">
                                <header class="motor-header relative bg-white border-b-[3px] border-[#FFDD00] shadow-2xs overflow-hidden">
                                    <div class="flex items-center justify-between min-h-[52px] sm:min-h-[58px] px-3.5 sm:px-5 gap-3">
                                        <div class="flex items-center gap-2.5 min-w-0">
                                            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                                            <div class="space-y-1">
                                                <div class="h-3.5 sm:h-4 w-20 rounded bg-slate-200 animate-pulse"></div>
                                                <div class="h-2.5 w-28 rounded bg-slate-200 animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div class="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                                            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 animate-pulse"></div>
                                            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 animate-pulse"></div>
                                        </div>
                                    </div>
                                </header>
                                <div class="p-2.5 sm:p-3 bg-white border-b border-slate-100 space-y-2 shadow-2xs">
                                    <div class="h-10 w-full rounded-md bg-slate-100 border border-slate-200 flex items-center px-3.5 gap-2">
                                        <div class="w-3.5 h-3.5 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                        <div class="h-3 w-40 rounded bg-slate-200 animate-pulse"></div>
                                    </div>
                                    <div class="space-y-1.5">
                                        <div class="flex w-full gap-1 items-center">
                                            @for ($i = 0; $i < 5; $i++)
                                                <div class="h-10 flex-1 rounded-lg bg-slate-100 animate-pulse"></div>
                                            @endfor
                                        </div>
                                        <div class="flex w-full gap-1 items-center">
                                            @for ($i = 0; $i < 4; $i++)
                                                <div class="h-10 flex-1 rounded-full bg-slate-100 animate-pulse"></div>
                                            @endfor
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex-1 p-3 sm:p-4 space-y-4">
                                <div class="space-y-3 pt-1">
                                    <div class="h-4 w-28 rounded bg-slate-200 animate-pulse px-0.5"></div>
                                    <div class="motor-selection-grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        @for ($i = 0; $i < 8; $i++)
                                            <div class="bg-white border border-slate-200 rounded-lg text-left flex flex-col justify-between shadow-2xs overflow-hidden">
                                                <div class="p-2 sm:p-2.5 flex flex-col flex-1 justify-between w-full">
                                                    <div class="w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                                        <div class="w-full h-full bg-slate-200 animate-pulse"></div>
                                                    </div>
                                                    <div class="pt-2 w-full space-y-1.5">
                                                        <div class="h-2 w-10 rounded bg-slate-200 animate-pulse"></div>
                                                        <div class="h-3 sm:h-3.5 w-4/5 rounded bg-slate-200 animate-pulse"></div>
                                                        <div class="h-2 sm:h-2.5 w-3/5 rounded bg-slate-200 animate-pulse"></div>
                                                    </div>
                                                </div>
                                                <div class="h-8 w-full bg-slate-100 animate-pulse"></div>
                                            </div>
                                        @endfor
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                @endif
            @elseif (in_array($comp, ['Payment/Index', 'Order/Waiting', 'Order/Status']))
                @include('partials.customer-order-loading')
            @elseif (str_starts_with($comp, 'Auth/'))
                <!-- Auth Pages Shell -->
                <div class="min-h-screen bg-[#f3f3ed] flex flex-col justify-center items-center p-4">
                    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
                        <div class="flex flex-col items-center space-y-2">
                            <div class="w-12 h-12 rounded-xl bg-slate-200 animate-pulse"></div>
                            <div class="h-5 w-36 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                        <div class="space-y-4">
                            <div class="space-y-1.5"><div class="h-3 w-16 bg-slate-200 rounded animate-pulse"></div><div class="h-10 w-full bg-slate-100 rounded-xl animate-pulse"></div></div>
                            <div class="space-y-1.5"><div class="h-3 w-20 bg-slate-200 rounded animate-pulse"></div><div class="h-10 w-full bg-slate-100 rounded-xl animate-pulse"></div></div>
                            <div class="h-11 w-full bg-[#19231f] text-white rounded-xl animate-pulse"></div>
                        </div>
                    </div>
                </div>
            @elseif ($adminLoading)
                @include('partials.admin-loading', ['loading' => $adminLoading])
            @else
                <!-- Fallback Customer App Shell Skeleton -->
                <div id="app-shell" class="min-h-screen bg-[#f3f3ed] font-sans flex justify-center">
                    <div class="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-28">
                        <div class="bg-[#19231f] px-4 py-3.5 text-white border-b-[3px] border-[#FFDD00]">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-md bg-[#2b3931] animate-pulse shrink-0"></div>
                                <div class="space-y-1.5 flex-1">
                                    <div class="h-4 bg-[#35423b] rounded w-36 animate-pulse"></div>
                                    <div class="h-2.5 bg-[#2b3931] rounded w-48 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 space-y-4 flex-1">
                            <div class="h-8 bg-slate-100 rounded-md w-full animate-pulse"></div>
                            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                @for ($i = 0; $i < 6; $i++)
                                    <div class="border border-slate-200 rounded-xl p-2.5 space-y-2 bg-white shadow-2xs">
                                        <div class="aspect-square bg-slate-100 rounded-lg animate-pulse"></div>
                                        <div class="h-3 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                                        <div class="h-3.5 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                @endfor
                            </div>
                        </div>
                    </div>
                </div>
            @endif
        </div>
    </body>
</html>
