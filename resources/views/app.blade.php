<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
    <head>
        <meta charset="utf-8">
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
        @if (request()->routeIs('home', 'motor-saya'))
            <link rel="canonical" href="{{ request()->routeIs('home') ? route('home') : route('motor-saya', ['slug' => data_get($page, 'props.initialPartsData.motorcycle.slug')]) }}">
        @else
            <meta name="robots" content="noindex, nofollow">
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
                    <!-- Store Header -->
                    <header class="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-2xs overflow-hidden relative">
                        <div class="mx-auto flex min-h-[54px] max-w-[1280px] items-center justify-between gap-2 px-3.5 sm:min-h-[62px] sm:gap-4 sm:px-6 lg:px-8 relative z-10">
                            <div class="flex shrink-0 items-center gap-2.5">
                                <div class="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-slate-200 animate-pulse"></div>
                                <div class="h-5 w-20 sm:w-24 rounded bg-slate-200 animate-pulse"></div>
                            </div>
                            <div class="hidden md:flex items-center gap-6">
                                <div class="h-4 w-14 rounded bg-slate-200 animate-pulse"></div>
                                <div class="h-4 w-20 rounded bg-slate-200 animate-pulse"></div>
                            </div>
                            <div class="flex-1 max-w-md px-1">
                                <div class="h-8.5 sm:h-9 w-full rounded-full bg-slate-100 border border-slate-200 flex items-center px-3.5 gap-2">
                                    <div class="w-3.5 h-3.5 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                    <div class="h-3 w-32 rounded bg-slate-200 animate-pulse"></div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 animate-pulse"></div>
                                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 animate-pulse"></div>
                            </div>
                        </div>
                    </header>

                    <!-- Motor Saya Banner (Exact Curved Bottom) -->
                    <section class="w-full bg-slate-100 border-b border-slate-200 rounded-b-[36px] sm:rounded-b-[48px] shadow-2xs mb-3.5 sm:mb-4.5 overflow-hidden">
                        <div class="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
                            <div class="flex items-center gap-3 sm:gap-4 pl-3 sm:pl-4 md:pl-5 pr-3.5 sm:pr-5 md:pr-6">
                                <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-200 animate-pulse shrink-0"></div>
                                <div class="min-w-0 flex-1 space-y-1.5">
                                    <div class="h-3.5 sm:h-4 w-24 rounded bg-slate-200 animate-pulse"></div>
                                    <div class="h-2.5 sm:h-3 w-56 sm:w-72 rounded bg-slate-200 animate-pulse"></div>
                                </div>
                                <div class="w-4 h-4 rounded bg-slate-200 animate-pulse shrink-0"></div>
                            </div>
                        </div>
                    </section>

                    <!-- Main Storefront Content -->
                    <div class="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pb-12">
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
            @elseif ($comp === 'Payment/Index')
                <!-- Payment Shell (Matches PaymentSkeleton.jsx) -->
                <div class="customer-storefront customer-flow h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center overflow-y-auto min-h-screen">
                    <div class="customer-frame w-full max-w-md bg-white min-h-full shadow-2xl flex flex-col pb-24">
                        <header class="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
                            <div class="w-5 h-5 rounded bg-slate-200 animate-pulse"></div>
                            <div class="h-4 w-28 rounded bg-slate-200 animate-pulse"></div>
                        </header>
                        <div class="flex-1 p-4 space-y-4">
                            <div class="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
                                <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 rounded bg-slate-200 animate-pulse"></div>
                                    <div class="h-3.5 w-28 rounded bg-slate-200 animate-pulse"></div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 rounded bg-slate-200 animate-pulse"></div>
                                    <div class="h-3 w-16 rounded bg-slate-200 animate-pulse"></div>
                                </div>
                            </div>
                            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                                <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <div class="h-3.5 w-32 rounded bg-slate-200 animate-pulse"></div>
                                    <div class="h-3 w-14 rounded bg-slate-200 animate-pulse"></div>
                                </div>
                                <div class="space-y-2.5">
                                    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <div class="space-y-1 flex-1">
                                            <div class="h-3.5 w-4/5 rounded bg-slate-200 animate-pulse"></div>
                                            <div class="h-2.5 w-1/2 rounded bg-slate-100 animate-pulse"></div>
                                        </div>
                                        <div class="h-3.5 w-16 rounded bg-slate-200 animate-pulse"></div>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <div class="space-y-1 flex-1">
                                            <div class="h-3.5 w-3/4 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                        <div class="h-3.5 w-16 rounded bg-slate-200 animate-pulse"></div>
                                    </div>
                                </div>
                                <div class="border-t border-slate-200 pt-2 space-y-2">
                                    <div class="flex justify-between"><div class="h-3 w-16 rounded bg-slate-200 animate-pulse"></div><div class="h-3 w-20 rounded bg-slate-200 animate-pulse"></div></div>
                                    <div class="flex justify-between border-t border-slate-200 pt-2"><div class="h-4 w-24 rounded bg-slate-200 animate-pulse"></div><div class="h-5 w-24 rounded bg-slate-200 animate-pulse"></div></div>
                                </div>
                            </div>
                            <div class="space-y-1.5">
                                <div class="h-3 w-28 rounded bg-slate-200 animate-pulse"></div>
                                <div class="h-11 w-full rounded-xl bg-slate-100 border border-slate-200 animate-pulse"></div>
                            </div>
                            <div class="space-y-2">
                                <div class="h-3 w-40 rounded bg-slate-200 animate-pulse"></div>
                                <div class="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 border border-stone-200">
                                    <div class="h-5 w-5 rounded bg-slate-200 animate-pulse"></div>
                                    <div class="space-y-1">
                                        <div class="h-3 w-28 rounded bg-slate-200 animate-pulse"></div>
                                        <div class="h-2.5 w-52 rounded bg-slate-100 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 bg-white border-t border-slate-100">
                            <div class="h-12 w-full rounded-xl bg-[#19231f] text-white animate-pulse"></div>
                        </div>
                    </div>
                </div>
            @elseif ($comp === 'Order/Waiting')
                <!-- Waiting Shell (Matches WaitingSkeleton.jsx) -->
                <div class="customer-storefront customer-flow h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center overflow-y-auto min-h-screen">
                    <div class="customer-frame w-full max-w-md bg-white min-h-full shadow-2xl flex flex-col items-center p-6 space-y-6">
                        <div class="text-center space-y-2 pt-6 flex flex-col items-center w-full">
                            <div class="w-16 h-16 rounded-full bg-slate-200 animate-pulse"></div>
                            <div class="h-6 w-52 rounded-md bg-slate-200 animate-pulse"></div>
                            <div class="h-3.5 w-64 rounded bg-slate-100 animate-pulse"></div>
                        </div>
                        <div class="w-full bg-slate-50 rounded-lg p-5 space-y-3 border border-slate-100">
                            <div class="flex items-center justify-between">
                                <div class="h-3 w-20 rounded bg-slate-200 animate-pulse"></div>
                                <div class="h-3 w-28 rounded bg-slate-200 animate-pulse"></div>
                            </div>
                            <div class="flex items-center justify-between">
                                <div class="h-3 w-20 rounded bg-slate-200 animate-pulse"></div>
                                <div class="h-3 w-24 rounded bg-slate-200 animate-pulse"></div>
                            </div>
                            <div class="border-t border-slate-200 pt-3 flex items-center justify-between">
                                <div class="h-3.5 w-16 rounded bg-slate-200 animate-pulse"></div>
                                <div class="h-5 w-28 rounded bg-slate-200 animate-pulse"></div>
                            </div>
                        </div>
                        <div class="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                            <div class="w-5 h-5 rounded-full bg-yellow-200 animate-pulse shrink-0"></div>
                            <div class="space-y-1 flex-1">
                                <div class="h-3.5 w-40 rounded bg-yellow-200 animate-pulse"></div>
                                <div class="h-2.5 w-full rounded bg-yellow-100 animate-pulse"></div>
                            </div>
                        </div>
                        <div class="h-10 w-full rounded-xl bg-slate-100 border border-slate-200 animate-pulse"></div>
                        <div class="h-11 w-full rounded-xl bg-slate-200 animate-pulse"></div>
                    </div>
                </div>
            @elseif ($comp === 'Order/Status')
                <!-- Order Status Shell (Matches OrderStatusSkeleton.jsx) -->
                <div class="customer-storefront customer-flow h-full w-full min-h-screen bg-slate-100 flex justify-center overflow-y-auto">
                    <div class="customer-frame w-full max-w-md min-h-full bg-white shadow-2xl flex flex-col">
                        <header class="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3.5 flex items-center justify-between">
                            <div class="h-5 w-28 rounded bg-slate-200 animate-pulse"></div>
                            <div class="h-8 w-28 rounded-xl bg-slate-100 animate-pulse"></div>
                        </header>
                        <div class="flex-1 p-4 space-y-4">
                            <div class="h-3 w-20 rounded bg-slate-200 animate-pulse"></div>
                            @for ($i = 0; $i < 2; $i++)
                                <div class="overflow-hidden rounded-lg border border-slate-200">
                                    <div class="flex items-center justify-between bg-slate-50 px-4 py-3">
                                        <div class="flex items-center gap-2">
                                            <div class="h-2 w-2 rounded-full bg-slate-200 animate-pulse"></div>
                                            <div class="h-5 w-20 rounded-md bg-slate-200 animate-pulse"></div>
                                        </div>
                                        <div class="h-3 w-16 rounded bg-slate-200 animate-pulse"></div>
                                    </div>
                                    <div class="flex items-center gap-3 bg-white px-4 py-3">
                                        <div class="min-w-0 flex-1 space-y-1.5">
                                            <div class="h-3.5 w-3/4 rounded bg-slate-200 animate-pulse"></div>
                                            <div class="h-3 w-1/3 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                        <div class="h-4 w-20 rounded bg-slate-200 animate-pulse shrink-0"></div>
                                    </div>
                                </div>
                            @endfor
                        </div>
                    </div>
                </div>
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
            @elseif ($comp === 'POS/Index')
                <!-- POS Cashier Layout Shell (Matches AuthenticatedLayout + POS/Index) -->
                <div class="admin-layout flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
                    <!-- Desktop Sidebar -->
                    <aside class="admin-sidebar hidden lg:flex flex-col w-64 bg-white border-r border-slate-300 shrink-0">
                        <div class="p-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
                            <div class="w-10 h-10 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                            <div class="space-y-1">
                                <div class="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                                <div class="h-2.5 w-16 bg-slate-100 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div class="flex-1 p-3 space-y-2 overflow-hidden">
                            @for ($s = 0; $s < 6; $s++)
                                <div class="h-9 w-full rounded-lg bg-slate-100 animate-pulse"></div>
                            @endfor
                        </div>
                    </aside>

                    <!-- Main Content Column -->
                    <div class="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                        <!-- Top Header -->
                        <header class="admin-topbar h-14 sm:h-16 bg-white border-b border-slate-300 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-20">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse lg:hidden"></div>
                                <div class="h-6 w-28 rounded bg-slate-200 animate-pulse"></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse"></div>
                                <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse"></div>
                                <div class="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                            </div>
                        </header>

                        <!-- POS Container -->
                        <main class="admin-main flex-1 min-h-0 p-0 flex flex-col overflow-hidden">
                            <div class="admin-pos flex min-h-0 flex-1 flex-col md:flex-row w-full overflow-hidden bg-slate-100">
                                <!-- Products Column -->
                                <div class="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
                                    <!-- Toolbar -->
                                    <div class="pos-toolbar bg-white p-3 sm:p-4 border-b border-slate-300 space-y-2 sm:space-y-3 shrink-0">
                                        <div class="h-9 w-full rounded-lg bg-slate-100 border border-slate-200 animate-pulse"></div>
                                        <div class="flex items-center justify-between gap-2 border-t border-slate-200 pt-2 sm:pt-3">
                                            <div class="flex gap-1.5 overflow-hidden">
                                                @for ($i = 0; $i < 4; $i++)
                                                    <div class="h-7 w-20 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                                                @endfor
                                            </div>
                                            <div class="flex items-center gap-2 shrink-0">
                                                <div class="h-7 w-16 rounded-lg bg-slate-100 animate-pulse"></div>
                                                <div class="h-7 w-20 rounded-lg bg-slate-100 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Products Scroll Area -->
                                    <div class="flex-1 min-h-0 overflow-y-auto p-3">
                                        <!-- LIST VIEW SKELETON (Default) -->
                                        <div id="pos-list-skeleton" class="grid items-stretch gap-2 grid-cols-1 2xl:grid-cols-2">
                                            @for ($i = 0; $i < 8; $i++)
                                                <div class="flex items-start gap-3 rounded-xl p-2.5 border border-slate-200 bg-white">
                                                    <div class="h-14 w-14 shrink-0 rounded-lg bg-slate-100 border border-slate-200 animate-pulse"></div>
                                                    <div class="flex min-w-0 flex-1 flex-col">
                                                        <div class="flex flex-col gap-2">
                                                            <div class="h-4 w-3/5 rounded bg-slate-200 animate-pulse"></div>
                                                            <div class="flex items-center justify-between gap-2">
                                                                <div class="h-4 w-16 rounded bg-slate-200 animate-pulse"></div>
                                                                <div class="h-3 w-12 rounded bg-slate-200 animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                        <div class="mt-1">
                                                            <div class="h-3 w-2/5 rounded bg-slate-200 animate-pulse"></div>
                                                        </div>
                                                        <div class="mt-0.5 h-4">
                                                            <div class="h-3 w-3/5 rounded bg-slate-200 animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            @endfor
                                        </div>

                                        <!-- GRID VIEW SKELETON (Toggled if pos_view_mode === 'grid') -->
                                        <div id="pos-grid-skeleton" class="hidden grid items-stretch gap-2 grid-cols-2 min-[900px]:grid-cols-[repeat(auto-fill,minmax(144px,1fr))]">
                                            @for ($i = 0; $i < 8; $i++)
                                                <div class="flex flex-col rounded-xl overflow-hidden border border-slate-200 bg-white">
                                                    <div class="aspect-square w-full shrink-0 bg-slate-100 animate-pulse"></div>
                                                    <div class="w-full p-2.5 space-y-2">
                                                        <div class="h-3.5 w-3/5 rounded bg-slate-200 animate-pulse"></div>
                                                        <div class="flex items-center justify-between gap-2">
                                                            <div class="h-3.5 w-16 rounded bg-slate-200 animate-pulse"></div>
                                                        </div>
                                                        <div class="h-3 w-2/5 rounded bg-slate-200 animate-pulse"></div>
                                                    </div>
                                                </div>
                                            @endfor
                                        </div>
                                    </div>

                                    <!-- Mobile Cart Bar -->
                                    <div class="mx-3 mb-3 h-12 rounded-xl bg-slate-200 animate-pulse md:hidden shrink-0"></div>
                                </div>

                                <!-- Desktop Cart Panel -->
                                <div class="hidden md:flex w-80 lg:w-[410px] bg-white border-l border-slate-300 flex-col min-h-0 shrink-0">
                                    <div class="p-3.5 border-b border-slate-300 space-y-2">
                                        <div class="h-4 w-32 rounded bg-slate-200 animate-pulse"></div>
                                        <div class="h-9 w-full rounded-lg bg-slate-100 animate-pulse"></div>
                                    </div>
                                    <div class="flex-1 p-4 space-y-3">
                                        @for ($c = 0; $c < 3; $c++)
                                            <div class="h-16 w-full rounded-xl bg-slate-100 animate-pulse"></div>
                                        @endfor
                                    </div>
                                    <div class="border-t border-slate-300 p-4 space-y-3">
                                        <div class="h-4 w-full rounded bg-slate-200 animate-pulse"></div>
                                        <div class="h-6 w-2/3 rounded bg-slate-200 animate-pulse"></div>
                                        <div class="h-12 w-full rounded-xl bg-[#19231f] text-white animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
                <script nonce="{{ Illuminate\Support\Facades\Vite::cspNonce() }}">
                    try {
                        if (localStorage.getItem('pos_view_mode') === 'grid') {
                            var g = document.getElementById('pos-grid-skeleton');
                            var l = document.getElementById('pos-list-skeleton');
                            if (g && l) { g.classList.remove('hidden'); l.classList.add('hidden'); }
                        }
                    } catch(e) {}
                </script>
            @elseif (in_array($comp, ['User/Index', 'Dashboard/Owner/Index', 'Product/Index', 'Order/Index', 'Order/Show', 'Report/Index', 'Setting/Index', 'Motorcycle/Index', 'Profile/Edit']) || str_starts_with($comp, 'Dashboard/'))
                @php
                    $isAdminNoPadding = in_array($comp, ['POS/Index', 'Product/Index', 'Motorcycle/Index']);
                @endphp
                <!-- Authenticated Dashboard Shell (Matching AuthenticatedLayout) -->
                <div class="h-screen w-screen overflow-hidden bg-slate-50 flex font-sans text-slate-800">
                    <!-- SIDEBAR -->
                    <aside class="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col shrink-0">
                        <!-- Brand -->
                        <div class="p-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
                            <div class="w-10 h-10 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                            <div class="space-y-1">
                                <div class="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                                <div class="h-2.5 w-16 bg-slate-100 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <!-- Menu Items -->
                        <div class="flex-1 p-3 space-y-5 overflow-hidden">
                            <div>
                                <div class="px-3 mb-2 h-2.5 w-12 bg-slate-200 rounded animate-pulse"></div>
                                <div class="space-y-1">
                                    <div class="h-9 rounded-lg {{ str_starts_with($comp, 'Dashboard/') ? 'bg-slate-100 border-l-4 border-slate-300' : 'bg-slate-50' }} animate-pulse"></div>
                                </div>
                            </div>
                            <div>
                                <div class="px-3 mb-2 h-2.5 w-16 bg-slate-200 rounded animate-pulse"></div>
                                <div class="space-y-1">
                                    <div class="h-9 rounded-lg {{ str_starts_with($comp, 'Order/') ? 'bg-slate-100 border-l-4 border-slate-300' : 'bg-slate-50' }} animate-pulse"></div>
                                    <div class="h-9 rounded-lg {{ $comp === 'Product/Index' ? 'bg-slate-100 border-l-4 border-slate-300' : 'bg-slate-50' }} animate-pulse"></div>
                                    <div class="h-9 rounded-lg {{ $comp === 'Motorcycle/Index' ? 'bg-slate-100 border-l-4 border-slate-300' : 'bg-slate-50' }} animate-pulse"></div>
                                </div>
                            </div>
                            <div>
                                <div class="px-3 mb-2 h-2.5 w-14 bg-slate-200 rounded animate-pulse"></div>
                                <div class="space-y-1">
                                    <div class="h-9 rounded-lg {{ $comp === 'Report/Index' ? 'bg-slate-100 border-l-4 border-slate-300' : 'bg-slate-50' }} animate-pulse"></div>
                                </div>
                            </div>
                            <div>
                                <div class="px-3 mb-2 h-2.5 w-20 bg-slate-200 rounded animate-pulse"></div>
                                <div class="space-y-1">
                                    <div class="h-9 rounded-lg {{ $comp === 'User/Index' ? 'bg-slate-100 border-l-4 border-slate-300' : 'bg-slate-50' }} animate-pulse"></div>
                                    <div class="h-9 rounded-lg {{ $comp === 'Setting/Index' ? 'bg-slate-100 border-l-4 border-slate-300' : 'bg-slate-50' }} animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <!-- MAIN CONTENT AREA -->
                    <div class="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                        <!-- TOP NAVBAR -->
                        <header class="h-14 sm:h-16 bg-white border-b border-slate-300 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
                            <div class="flex items-center gap-3">
                                <div class="h-5 sm:h-6 {{ $comp === 'User/Index' ? 'w-44' : ($comp === 'Product/Index' ? 'w-40' : ($comp === 'Report/Index' ? 'w-44' : 'w-32')) }} bg-slate-300 rounded-md animate-pulse"></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse"></div>
                                <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse"></div>
                                <div class="flex items-center gap-2.5 pl-2">
                                    <div class="w-9 h-9 rounded-lg bg-slate-200 animate-pulse"></div>
                                    <div class="hidden sm:block space-y-1">
                                        <div class="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                                        <div class="h-2 w-10 bg-slate-100 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <!-- SCROLLABLE PAGE BODY -->
                        <main class="admin-main flex-1 min-h-0 {{ $isAdminNoPadding ? 'p-0 flex flex-col overflow-hidden' : 'p-3 sm:p-6 lg:p-8 overflow-y-auto' }} bg-slate-50">
                            @if ($comp === 'User/Index')
                                <!-- Exact User/Index layout preview -->
                                <div class="max-w-7xl mx-auto space-y-6">
                                    <!-- Card 1: Header + Search + Button -->
                                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div class="h-5 w-48 bg-slate-200 rounded animate-pulse"></div>
                                            <div class="h-3 w-72 bg-slate-100 rounded animate-pulse mt-1.5"></div>
                                        </div>
                                        <div class="flex items-center gap-3 w-full sm:w-auto">
                                            <div class="h-9 w-full sm:w-64 bg-slate-100 border border-slate-200 rounded-xl animate-pulse"></div>
                                            <div class="h-9 w-36 bg-[#19231f] rounded-xl animate-pulse shrink-0"></div>
                                        </div>
                                    </div>
                                    <!-- Card 2: Filter + Table + Pagination -->
                                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div class="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                            <div class="h-3 w-20 bg-slate-200 rounded animate-pulse"></div>
                                            <div class="h-6 w-16 bg-[#19231f] rounded-lg animate-pulse"></div>
                                            <div class="h-6 w-16 bg-slate-200 rounded-lg animate-pulse"></div>
                                            <div class="h-6 w-16 bg-slate-200 rounded-lg animate-pulse"></div>
                                        </div>
                                        <table class="w-full text-left">
                                            <thead>
                                                <tr class="border-b border-slate-100 bg-slate-50">
                                                    <th class="py-3.5 px-5"><div class="h-3 w-20 bg-slate-200 rounded animate-pulse"></div></th>
                                                    <th class="py-3.5 px-5"><div class="h-3 w-14 bg-slate-200 rounded animate-pulse"></div></th>
                                                    <th class="py-3.5 px-5"><div class="h-3 w-24 bg-slate-200 rounded animate-pulse"></div></th>
                                                    <th class="py-3.5 px-5 text-right"><div class="h-3 w-12 bg-slate-200 rounded animate-pulse ml-auto"></div></th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-slate-100">
                                                @for ($i = 0; $i < 5; $i++)
                                                    <tr>
                                                        <td class="py-4 px-5">
                                                            <div class="flex items-center gap-3">
                                                                <div class="w-9 h-9 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                                                <div class="space-y-1.5">
                                                                    <div class="h-3.5 w-28 bg-slate-200 rounded animate-pulse"></div>
                                                                    <div class="h-2.5 w-40 bg-slate-100 rounded animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td class="py-4 px-5"><div class="h-6 w-20 bg-purple-100 rounded-full animate-pulse"></div></td>
                                                        <td class="py-4 px-5"><div class="h-6 w-20 bg-emerald-100 rounded-md animate-pulse"></div></td>
                                                        <td class="py-4 px-5 text-right">
                                                            <div class="flex justify-end gap-2">
                                                                <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse"></div>
                                                                <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse"></div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                @endfor
                                            </tbody>
                                        </table>
                                        <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                                            <div class="h-3.5 w-44 bg-slate-200 rounded animate-pulse"></div>
                                            <div class="flex gap-2">
                                                <div class="h-7 w-20 bg-slate-200 rounded-lg animate-pulse"></div>
                                                <div class="h-7 w-14 bg-slate-200 rounded-lg animate-pulse"></div>
                                                <div class="h-7 w-20 bg-slate-200 rounded-lg animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            @elseif ($comp === 'Product/Index')
                                <!-- Product/Index layout preview (Matches ProductTableSkeleton fullPage) -->
                                <div class="p-0 sm:p-4 lg:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
                                    <div class="bg-white sm:rounded-xl sm:border border-slate-200 sm:shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
                                        <!-- Header & Filter Section -->
                                        <div class="p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5 border-b border-slate-200 shrink-0 bg-white z-10">
                                            <!-- Top Row: Title, Badge, Tabs & Action -->
                                            <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                                                <div class="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none sm:gap-2">
                                                    <div class="h-5 w-24 sm:h-6 sm:w-32 bg-slate-300 rounded-md animate-pulse"></div>
                                                    <div class="h-3 w-6 bg-slate-200 rounded animate-pulse"></div>
                                                </div>
                                                <div class="order-3 flex w-full gap-1.5 sm:order-none sm:w-auto">
                                                    <div class="h-7 flex-1 sm:flex-none sm:w-20 bg-slate-200 rounded-lg animate-pulse"></div>
                                                    <div class="h-7 flex-1 sm:flex-none sm:w-24 bg-slate-100 rounded-lg animate-pulse"></div>
                                                </div>
                                                <div class="ml-auto flex shrink-0 gap-1.5 sm:gap-2">
                                                    <div class="h-9 w-9 sm:w-28 bg-[#19231f] rounded-xl animate-pulse"></div>
                                                </div>
                                            </div>

                                            <!-- Filter Bar -->
                                            <div class="flex flex-row sm:flex-wrap items-center justify-between gap-1.5 sm:gap-2.5">
                                                <div class="flex min-w-0 flex-wrap items-center gap-2 flex-1 max-w-2xl">
                                                    <div class="h-9 flex-1 min-w-[140px] rounded-lg bg-slate-100 border border-slate-200 sm:h-10 sm:min-w-[180px] animate-pulse"></div>
                                                    <div class="hidden h-10 w-44 rounded-lg bg-slate-100 border border-slate-200 shrink-0 sm:block animate-pulse"></div>
                                                    <div class="hidden h-10 w-40 rounded-lg bg-slate-100 border border-slate-200 shrink-0 sm:block animate-pulse"></div>
                                                </div>
                                                <div class="flex flex-row items-center gap-1 shrink-0">
                                                    <div class="inline-flex items-center bg-white p-0.5 rounded-lg border border-slate-300 shadow-2xs">
                                                        <div class="w-7 h-7 rounded-md bg-slate-200 animate-pulse"></div>
                                                        <div class="w-7 h-7 rounded-md bg-slate-100 animate-pulse"></div>
                                                        <div class="w-7 h-7 rounded-md bg-slate-100 animate-pulse"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Body Content -->
                                        <!-- LIST VIEW SKELETON (Default) -->
                                        <div id="product-list-skeleton" class="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col justify-between">
                                            <!-- Mobile view -->
                                            <div class="md:hidden divide-y divide-slate-100">
                                                @for ($i = 0; $i < 6; $i++)
                                                    <div class="px-3 py-2.5">
                                                        <div class="flex gap-2.5">
                                                            <div class="h-11 w-11 shrink-0 rounded-md bg-slate-100 animate-pulse"></div>
                                                            <div class="min-w-0 flex-1 space-y-1.5">
                                                                <div class="flex items-center justify-between gap-1">
                                                                    <div class="h-4 w-3/4 rounded bg-slate-200 animate-pulse"></div>
                                                                    <div class="h-4 w-4 rounded bg-slate-200 animate-pulse"></div>
                                                                </div>
                                                                <div class="flex justify-between">
                                                                    <div class="h-4 w-20 rounded bg-slate-200 animate-pulse"></div>
                                                                    <div class="h-3 w-14 rounded bg-slate-200 animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                @endfor
                                            </div>
                                            <!-- Desktop table -->
                                            <table class="hidden md:table w-full text-left border-collapse min-w-[900px]">
                                                <thead class="bg-white border-b border-slate-200 sticky top-0 z-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                    <tr>
                                                        <th class="w-8 pl-3 pr-0 py-2.5 text-center"><div class="h-3 w-4 bg-slate-200 rounded animate-pulse mx-auto"></div></th>
                                                        <th class="pl-2 pr-4 py-2.5 min-w-[260px]"><div class="h-3 w-40 bg-slate-200 rounded animate-pulse"></div></th>
                                                        <th class="px-4 py-2.5"><div class="h-3 w-16 bg-slate-200 rounded animate-pulse"></div></th>
                                                        <th class="px-4 py-2.5"><div class="h-3 w-20 bg-slate-200 rounded animate-pulse"></div></th>
                                                        <th class="px-4 py-2.5"><div class="h-3 w-20 bg-slate-200 rounded animate-pulse"></div></th>
                                                        <th class="px-4 py-2.5"><div class="h-3 w-12 bg-slate-200 rounded animate-pulse"></div></th>
                                                        <th class="px-4 py-2.5"><div class="h-3 w-14 bg-slate-200 rounded animate-pulse"></div></th>
                                                        <th class="w-28 px-4 py-2.5 text-center"><div class="h-3 w-10 bg-slate-200 rounded animate-pulse mx-auto"></div></th>
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-slate-100">
                                                    @for ($i = 0; $i < 6; $i++)
                                                        <tr>
                                                            <td class="w-8 pl-3 pr-0 py-3 text-center"><div class="h-3 w-3 bg-slate-200 rounded animate-pulse mx-auto"></div></td>
                                                            <td class="pl-2 pr-4 py-3">
                                                                <div class="flex items-center gap-3">
                                                                    <div class="w-10 h-10 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                                                                    <div class="space-y-1.5 min-w-0 flex-1">
                                                                        <div class="h-3.5 w-36 rounded bg-slate-200 animate-pulse"></div>
                                                                        <div class="h-2.5 w-20 rounded bg-slate-100 animate-pulse"></div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td class="px-4 py-3"><div class="h-3.5 w-16 rounded bg-slate-200 animate-pulse"></div></td>
                                                            <td class="px-4 py-3"><div class="h-3.5 w-20 rounded bg-slate-200 animate-pulse"></div></td>
                                                            <td class="px-4 py-3"><div class="h-3.5 w-20 rounded bg-slate-200 animate-pulse"></div></td>
                                                            <td class="px-4 py-3"><div class="h-4 w-10 rounded bg-slate-200 animate-pulse"></div></td>
                                                            <td class="px-4 py-3"><div class="h-5 w-16 rounded-full bg-slate-200 animate-pulse"></div></td>
                                                            <td class="w-28 px-4 py-3 text-center">
                                                                <div class="flex items-center justify-center gap-1.5">
                                                                    <div class="w-6 h-6 rounded-md bg-slate-100 animate-pulse"></div>
                                                                    <div class="w-6 h-6 rounded-md bg-slate-100 animate-pulse"></div>
                                                                    <div class="w-6 h-6 rounded-md bg-slate-100 animate-pulse"></div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    @endfor
                                                </tbody>
                                            </table>
                                            <div class="px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white shrink-0 z-10">
                                                <div class="h-3.5 w-44 rounded bg-slate-200 animate-pulse"></div>
                                                <div class="flex items-center space-x-2">
                                                    <div class="h-8 w-20 rounded-lg bg-slate-200 animate-pulse"></div>
                                                    <div class="h-8 w-14 rounded-lg bg-slate-200 animate-pulse"></div>
                                                    <div class="h-8 w-20 rounded-lg bg-slate-200 animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- GRID VIEW SKELETON (Toggled if product_view_mode_v2 === 'grid') -->
                                        <div id="product-grid-skeleton" class="hidden flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col justify-between">
                                            <div class="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 min-[1700px]:grid-cols-5 md:gap-4 md:p-4">
                                                @for ($i = 0; $i < 8; $i++)
                                                    <div class="bg-white rounded-md md:rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                                                        <div class="relative w-full aspect-square bg-slate-100 border-b border-slate-100 animate-pulse"></div>
                                                        <div class="p-2 md:p-3 flex flex-col flex-1 space-y-2">
                                                            <div class="h-3.5 w-5/6 rounded bg-slate-200 animate-pulse"></div>
                                                            <div class="h-2.5 w-20 rounded bg-slate-100 animate-pulse"></div>
                                                            <div class="mt-auto pt-1">
                                                                <div class="h-5 w-24 rounded bg-slate-200 animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                        <div class="border-t border-slate-100 bg-slate-50 px-2 py-1.5 flex items-center justify-between gap-1">
                                                            <div class="h-6 flex-1 rounded-lg bg-slate-200 animate-pulse"></div>
                                                            <div class="w-6 h-6 rounded-lg bg-slate-200 animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                @endfor
                                            </div>
                                            <div class="px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white shrink-0 z-10">
                                                <div class="h-3.5 w-44 rounded bg-slate-200 animate-pulse"></div>
                                                <div class="flex items-center space-x-2">
                                                    <div class="h-8 w-20 rounded-lg bg-slate-200 animate-pulse"></div>
                                                    <div class="h-8 w-14 rounded-lg bg-slate-200 animate-pulse"></div>
                                                    <div class="h-8 w-20 rounded-lg bg-slate-200 animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- BOOK VIEW SKELETON (Toggled if product_view_mode_v2 === 'book') -->
                                        <div id="product-book-skeleton" class="hidden flex-1 min-h-0 overflow-y-auto flex flex-col justify-between p-2 sm:p-4 bg-slate-100 gap-2 sm:gap-3">
                                            <div class="flex-1 min-h-0 bg-white border border-slate-300 rounded-xl shadow-xs flex flex-col overflow-hidden">
                                                <div class="px-3 sm:px-5 py-2 border-b border-slate-300 bg-white shrink-0 flex items-center justify-between">
                                                    <div class="h-3 w-28 rounded bg-slate-200 animate-pulse"></div>
                                                    <div class="h-3 w-20 rounded bg-slate-200 animate-pulse"></div>
                                                </div>
                                                <div class="flex-1 overflow-hidden">
                                                    <div class="block md:hidden">
                                                        <div class="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-300 bg-slate-50">
                                                            <div class="h-3 w-24 rounded bg-slate-200 animate-pulse"></div>
                                                            <div class="flex gap-3">
                                                                <div class="h-3 w-10 rounded bg-slate-200 animate-pulse"></div>
                                                                <div class="h-3 w-14 rounded bg-slate-200 animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                        @for ($i = 0; $i < 10; $i++)
                                                            <div class="flex items-center justify-between py-2 px-2 border-b border-slate-200">
                                                                <div class="flex items-center gap-2 flex-1">
                                                                    <div class="h-3 w-5 rounded bg-slate-200 animate-pulse"></div>
                                                                    <div class="h-3.5 w-44 rounded bg-slate-200 animate-pulse"></div>
                                                                </div>
                                                                <div class="flex items-center gap-2">
                                                                    <div class="h-3 w-12 rounded bg-slate-200 animate-pulse"></div>
                                                                    <div class="h-3.5 w-18 rounded bg-slate-200 animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                        @endfor
                                                    </div>
                                                    <div class="hidden md:flex min-h-full divide-x divide-slate-300">
                                                        <div class="flex-1 flex flex-col min-w-0">
                                                            <div class="flex items-center justify-between px-3 py-1.5 border-b border-slate-300 bg-slate-50">
                                                                <div class="h-3 w-24 rounded bg-slate-200 animate-pulse"></div>
                                                                <div class="flex gap-3 pr-2 lg:pr-14">
                                                                    <div class="h-3 w-12 rounded bg-slate-200 animate-pulse"></div>
                                                                    <div class="h-3 w-16 rounded bg-slate-200 animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                            @for ($i = 0; $i < 10; $i++)
                                                                <div class="flex items-center justify-between py-2 px-3 border-b border-slate-200">
                                                                    <div class="flex items-center gap-2 flex-1">
                                                                        <div class="h-3 w-5 rounded bg-slate-200 animate-pulse"></div>
                                                                        <div class="h-3.5 w-48 rounded bg-slate-200 animate-pulse"></div>
                                                                    </div>
                                                                    <div class="flex items-center gap-3 pr-2 lg:pr-14">
                                                                        <div class="h-3 w-12 rounded bg-slate-200 animate-pulse"></div>
                                                                        <div class="h-3.5 w-18 rounded bg-slate-200 animate-pulse"></div>
                                                                    </div>
                                                                </div>
                                                            @endfor
                                                        </div>
                                                        <div class="flex-1 flex flex-col min-w-0">
                                                            <div class="flex items-center justify-between px-3 py-1.5 border-b border-slate-300 bg-slate-50">
                                                                <div class="h-3 w-24 rounded bg-slate-200 animate-pulse"></div>
                                                                <div class="flex gap-3 pr-2 lg:pr-14">
                                                                    <div class="h-3 w-12 rounded bg-slate-200 animate-pulse"></div>
                                                                    <div class="h-3 w-16 rounded bg-slate-200 animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                            @for ($i = 0; $i < 10; $i++)
                                                                <div class="flex items-center justify-between py-2 px-3 border-b border-slate-200">
                                                                    <div class="flex items-center gap-2 flex-1">
                                                                        <div class="h-3 w-5 rounded bg-slate-200 animate-pulse"></div>
                                                                        <div class="h-3.5 w-48 rounded bg-slate-200 animate-pulse"></div>
                                                                    </div>
                                                                    <div class="flex items-center gap-3 pr-2 lg:pr-14">
                                                                        <div class="h-3 w-12 rounded bg-slate-200 animate-pulse"></div>
                                                                        <div class="h-3.5 w-18 rounded bg-slate-200 animate-pulse"></div>
                                                                    </div>
                                                                </div>
                                                            @endfor
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <script nonce="{{ Illuminate\Support\Facades\Vite::cspNonce() }}">
                                    try {
                                        var pMode = localStorage.getItem('product_view_mode_v2');
                                        var pl = document.getElementById('product-list-skeleton');
                                        var pg = document.getElementById('product-grid-skeleton');
                                        var pb = document.getElementById('product-book-skeleton');
                                        if (pMode === 'grid' && pg && pl) {
                                            pl.classList.add('hidden');
                                            pg.classList.remove('hidden');
                                        } else if (pMode === 'book' && pb && pl) {
                                            pl.classList.add('hidden');
                                            pb.classList.remove('hidden');
                                        }
                                    } catch(e) {}
                                </script>
                            @elseif ($comp === 'Order/Index')
                                <!-- Order/Index layout preview -->
                                <div class="w-full space-y-4">
                                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                                        @for ($i = 0; $i < 4; $i++)
                                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                                                <div class="h-2.5 w-24 bg-slate-200 rounded animate-pulse"></div>
                                                <div class="h-6 w-16 bg-slate-300 rounded animate-pulse"></div>
                                            </div>
                                        @endfor
                                    </div>
                                    <div class="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
                                        <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                            <div class="h-5 w-36 bg-slate-200 rounded animate-pulse"></div>
                                            <div class="h-8 w-64 bg-slate-100 rounded-lg animate-pulse"></div>
                                        </div>
                                        <div class="p-4 space-y-3">
                                            @for ($i = 0; $i < 5; $i++)
                                                <div class="h-10 w-full bg-slate-50 rounded-lg animate-pulse"></div>
                                            @endfor
                                        </div>
                                    </div>
                                </div>
                            @elseif ($comp === 'Order/Show')
                                <!-- Order/Show layout preview (1:1 with OrderShowSkeleton) -->
                                <div class="min-w-0 max-w-4xl mx-auto space-y-4 sm:space-y-6">
                                    <div class="flex items-center gap-2">
                                        <div class="h-4 w-4 rounded bg-slate-200 animate-pulse"></div>
                                        <div class="h-4 w-36 rounded bg-slate-200 animate-pulse"></div>
                                    </div>
                                    <div class="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                                        <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div class="space-y-2">
                                                <div class="h-7 w-48 rounded-lg bg-slate-200 animate-pulse"></div>
                                                <div class="flex flex-wrap items-center gap-3">
                                                    <div class="h-3.5 w-24 rounded bg-slate-200 animate-pulse"></div>
                                                    <div class="h-3.5 w-28 rounded bg-slate-200 animate-pulse"></div>
                                                    <div class="h-3.5 w-36 rounded bg-slate-200 animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-2.5">
                                                <div class="h-7 w-24 rounded-xl bg-slate-200 animate-pulse"></div>
                                                <div class="h-7 w-20 rounded-xl bg-slate-200 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                        <div class="min-w-0 lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div class="p-4 sm:p-5 border-b border-slate-100">
                                                <div class="h-5 w-32 rounded bg-slate-200 animate-pulse"></div>
                                            </div>
                                            <div class="divide-y divide-slate-100">
                                                @for ($i = 0; $i < 3; $i++)
                                                    <div class="px-4 sm:px-5 py-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                                                        <div class="space-y-1.5">
                                                            <div class="h-4 w-48 rounded bg-slate-200 animate-pulse"></div>
                                                            <div class="h-3 w-28 rounded bg-slate-100 animate-pulse"></div>
                                                        </div>
                                                        <div class="space-y-1 sm:text-right">
                                                            <div class="h-4 w-20 rounded bg-slate-200 animate-pulse ml-auto"></div>
                                                            <div class="h-3 w-16 rounded bg-slate-100 animate-pulse ml-auto"></div>
                                                        </div>
                                                    </div>
                                                @endfor
                                            </div>
                                            <div class="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 space-y-2.5">
                                                <div class="flex justify-between items-center"><div class="h-3.5 w-16 rounded bg-slate-200 animate-pulse"></div><div class="h-3.5 w-24 rounded bg-slate-200 animate-pulse"></div></div>
                                                <div class="flex justify-between items-center"><div class="h-3.5 w-14 rounded bg-slate-200 animate-pulse"></div><div class="h-3.5 w-20 rounded bg-slate-200 animate-pulse"></div></div>
                                                <div class="flex justify-between items-center pt-2 border-t border-slate-200"><div class="h-4 w-20 rounded bg-slate-200 animate-pulse"></div><div class="h-5 w-28 rounded bg-slate-200 animate-pulse"></div></div>
                                            </div>
                                        </div>
                                        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm h-fit space-y-4">
                                            <div class="h-5 w-32 rounded bg-slate-200 animate-pulse"></div>
                                            <div class="space-y-3">
                                                @for ($t = 0; $t < 4; $t++)
                                                    <div class="flex items-center gap-3">
                                                        <div class="w-6 h-6 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                                        <div class="space-y-1 flex-1">
                                                            <div class="h-3.5 w-24 rounded bg-slate-200 animate-pulse"></div>
                                                            <div class="h-2.5 w-16 rounded bg-slate-100 animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                @endfor
                                            </div>
                                            <div class="pt-3 border-t border-slate-100 space-y-2">
                                                <div class="h-9 w-full rounded-xl bg-slate-200 animate-pulse"></div>
                                                <div class="h-9 w-full rounded-xl bg-slate-100 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            @elseif ($comp === 'Report/Index')
                                <!-- Report/Index layout preview (Matches ReportSkeleton) -->
                                <div class="space-y-4">
                                    <!-- Toolbar -->
                                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div class="grid w-full min-w-0 grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap sm:items-center">
                                            <div class="h-9 w-full sm:w-36 rounded-xl bg-slate-100 border border-slate-200 animate-pulse"></div>
                                            <div class="h-9 w-full sm:w-48 rounded-xl bg-slate-100 border border-slate-200 animate-pulse"></div>
                                        </div>
                                        <div class="h-9 w-32 rounded-lg bg-slate-100 border border-slate-200 animate-pulse"></div>
                                    </div>

                                    <!-- 4 KPI Cards -->
                                    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
                                        @for ($i = 0; $i < 4; $i++)
                                            <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-2 shadow-2xs">
                                                <div class="h-2.5 w-3/4 rounded bg-slate-200 animate-pulse"></div>
                                                <div class="h-6 w-full rounded bg-slate-300 animate-pulse"></div>
                                                <div class="h-2.5 w-2/3 rounded bg-slate-100 animate-pulse"></div>
                                            </div>
                                        @endfor
                                    </div>

                                    <!-- Cash closing section -->
                                    <section class="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                                        <div class="flex flex-wrap items-center justify-between gap-2">
                                            <div class="space-y-1">
                                                <div class="h-4 w-36 rounded bg-slate-200 animate-pulse"></div>
                                                <div class="h-3 w-40 rounded bg-slate-100 animate-pulse"></div>
                                            </div>
                                            <div class="h-10 w-36 rounded-lg bg-slate-100 animate-pulse"></div>
                                        </div>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                            @for ($i = 0; $i < 4; $i++)
                                                <div class="space-y-1">
                                                    <div class="h-3 w-24 rounded bg-slate-200 animate-pulse"></div>
                                                    <div class="h-10 w-full rounded-lg bg-slate-50 animate-pulse"></div>
                                                </div>
                                            @endfor
                                        </div>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-slate-200 pt-3">
                                            <div class="space-y-1"><div class="h-3 w-24 rounded bg-slate-200 animate-pulse"></div><div class="h-6 w-32 rounded bg-slate-200 animate-pulse"></div></div>
                                            <div class="space-y-1"><div class="h-3 w-36 rounded bg-slate-200 animate-pulse"></div><div class="h-10 w-full rounded-lg bg-slate-50 animate-pulse"></div></div>
                                            <div class="space-y-1"><div class="h-3 w-12 rounded bg-slate-200 animate-pulse"></div><div class="h-6 w-24 rounded bg-slate-200 animate-pulse"></div></div>
                                        </div>
                                        <div class="h-9 w-full rounded-lg bg-slate-50 animate-pulse"></div>
                                        <div class="h-8 w-36 rounded-lg bg-slate-100 animate-pulse"></div>
                                    </section>

                                    <!-- Content Grid: Top Products + Category Breakdown -->
                                    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                        <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                            <div class="px-4 py-3 border-b border-slate-100 space-y-1">
                                                <div class="h-4 w-28 rounded bg-slate-200 animate-pulse"></div>
                                                <div class="h-2.5 w-44 rounded bg-slate-100 animate-pulse"></div>
                                            </div>
                                            <div class="p-4 space-y-3">
                                                @for ($i = 0; $i < 5; $i++)
                                                    <div class="flex items-center justify-between">
                                                        <div class="h-3.5 w-40 rounded bg-slate-200 animate-pulse"></div>
                                                        <div class="h-3.5 w-20 rounded bg-slate-200 animate-pulse"></div>
                                                    </div>
                                                @endfor
                                            </div>
                                        </div>
                                        <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs p-4 space-y-4">
                                            <div class="space-y-1 border-b border-slate-100 pb-3">
                                                <div class="h-4 w-36 rounded bg-slate-200 animate-pulse"></div>
                                                <div class="h-2.5 w-48 rounded bg-slate-100 animate-pulse"></div>
                                            </div>
                                            @for ($i = 0; $i < 4; $i++)
                                                <div class="space-y-1.5">
                                                    <div class="flex justify-between"><div class="h-3 w-20 rounded bg-slate-200 animate-pulse"></div><div class="h-3 w-12 rounded bg-slate-200 animate-pulse"></div></div>
                                                    <div class="h-2 w-full rounded-full bg-slate-100 animate-pulse"></div>
                                                </div>
                                            @endfor
                                        </div>
                                    </div>
                                </div>
                            @elseif ($comp === 'Setting/Index')
                                <!-- Setting/Index layout preview -->
                                <div class="max-w-4xl mx-auto space-y-6 pb-8">
                                    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                                        <div class="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
                                        <div class="flex items-center gap-6">
                                            <div class="w-24 aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 animate-pulse"></div>
                                            <div class="h-9 w-32 bg-[#19231f] text-white rounded-lg animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                                        <div class="h-5 w-48 bg-slate-200 rounded animate-pulse"></div>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div class="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
                                            <div class="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            @elseif ($comp === 'Profile/Edit')
                                <!-- Profile/Edit layout preview -->
                                <div class="py-2 sm:py-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
                                    <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                                        <div class="h-6 w-48 rounded bg-slate-200 animate-pulse"></div>
                                        <div class="h-3.5 w-72 rounded bg-slate-100 animate-pulse"></div>
                                    </div>
                                    <div class="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4">
                                        <div class="h-5 w-36 rounded bg-slate-200 animate-pulse"></div>
                                        <div class="flex items-center gap-4">
                                            <div class="w-16 h-16 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                            <div class="space-y-2 flex-1">
                                                <div class="h-8 w-32 rounded-lg bg-slate-100 animate-pulse"></div>
                                                <div class="h-3 w-48 rounded bg-slate-100 animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div class="space-y-1.5"><div class="h-3 w-20 rounded bg-slate-200 animate-pulse"></div><div class="h-10 w-full rounded-lg bg-slate-100 animate-pulse"></div></div>
                                            <div class="space-y-1.5"><div class="h-3 w-20 rounded bg-slate-200 animate-pulse"></div><div class="h-10 w-full rounded-lg bg-slate-100 animate-pulse"></div></div>
                                        </div>
                                    </div>
                                    <div class="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4">
                                        <div class="h-5 w-36 rounded bg-slate-200 animate-pulse"></div>
                                        <div class="space-y-3 max-w-md">
                                            <div class="h-10 w-full rounded-lg bg-slate-100 animate-pulse"></div>
                                            <div class="h-10 w-full rounded-lg bg-slate-100 animate-pulse"></div>
                                            <div class="h-10 w-full rounded-lg bg-slate-100 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            @elseif ($comp === 'Motorcycle/Index')
                                <!-- Data Motor shell (1:1 with MotorcyclePageSkeleton) -->
                                <div class="p-1.5 sm:p-4 lg:p-5 flex-1 min-h-0 flex flex-col overflow-hidden h-full">
                                    <div class="bg-white rounded-none sm:rounded-xl border-0 sm:border border-slate-200 shadow-none sm:shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
                                        <!-- Header & Filter Section -->
                                        <div class="p-2 sm:p-3.5 space-y-1.5 sm:space-y-2 border-b border-slate-200 shrink-0 bg-white z-10">
                                            <div class="flex items-center justify-between gap-2">
                                                <div class="flex items-center gap-2 sm:gap-3">
                                                    <div class="h-6 w-32 rounded-md bg-slate-200 animate-pulse"></div>
                                                    <div class="h-5 w-10 rounded-full bg-slate-100 animate-pulse"></div>
                                                </div>
                                                <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                                    <div class="h-8 w-16 rounded-lg sm:w-36 bg-slate-100 animate-pulse"></div>
                                                    <div class="h-8 w-20 rounded-lg sm:w-28 bg-slate-100 animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div class="flex flex-wrap lg:flex-nowrap items-stretch lg:items-center justify-between gap-1.5 lg:gap-2">
                                                <div class="h-8 flex-1 min-w-0 lg:max-w-xs rounded-lg bg-slate-100 border border-slate-200 animate-pulse"></div>
                                                <div class="h-8 w-16 rounded-md lg:hidden bg-slate-100 animate-pulse"></div>
                                                <div class="hidden lg:flex items-center gap-2 overflow-x-auto py-0.5">
                                                    <div class="h-7 w-56 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                                                    <div class="h-7 w-48 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- Motorcycle Models List -->
                                        <div class="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
                                            @for ($i = 0; $i < 5; $i++)
                                                <div class="p-2.5 sm:p-3.5">
                                                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                                                        <div class="flex items-center gap-3.5 min-w-0 flex-1">
                                                            <div class="w-16 h-16 sm:w-18 sm:h-18 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                                                            <div class="min-w-0 space-y-2 flex-1">
                                                                <div class="flex items-center gap-2">
                                                                    <div class="h-4 w-14 rounded bg-slate-200 animate-pulse"></div>
                                                                    <div class="h-5 w-40 rounded bg-slate-200 animate-pulse"></div>
                                                                </div>
                                                                <div class="h-3 w-48 rounded bg-slate-100 animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                        <div class="flex items-center justify-between md:justify-end gap-3 shrink-0">
                                                            <div class="h-7 w-32 rounded-lg bg-slate-100 animate-pulse"></div>
                                                            <div class="flex items-center gap-1">
                                                                <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse"></div>
                                                                <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            @endfor
                                        </div>
                                        <div class="p-3 flex items-center justify-between border-t border-slate-100">
                                            <div class="h-3 w-44 rounded bg-slate-100 animate-pulse"></div>
                                            <div class="h-8 w-32 rounded bg-slate-100 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            @elseif (str_starts_with($comp, 'Dashboard/'))
                                <!-- Dashboard Shell (Matches DashboardSkeleton 12-col grid) -->
                                <div class="grid w-full grid-cols-12 items-start gap-3 sm:gap-4">
                                    <!-- Title & Actions -->
                                    <div class="col-span-12 flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
                                        <div class="h-6 w-40 rounded bg-slate-300 animate-pulse"></div>
                                        <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                                            <div class="h-9 w-full sm:w-36 rounded-xl bg-slate-100 border border-slate-200 animate-pulse"></div>
                                            <div class="h-9 w-full sm:w-40 rounded-xl bg-slate-100 border border-slate-200 animate-pulse"></div>
                                        </div>
                                    </div>

                                    <!-- 4 KPI Summary Cards -->
                                    <div class="col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        @for ($i = 0; $i < 4; $i++)
                                            <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-2 shadow-2xs">
                                                <div class="flex items-start justify-between gap-2">
                                                    <div class="min-w-0 space-y-2 flex-1">
                                                        <div class="h-3 w-24 sm:w-28 rounded bg-slate-200 animate-pulse"></div>
                                                        <div class="h-6 w-16 sm:h-8 sm:w-32 rounded bg-slate-300 animate-pulse"></div>
                                                    </div>
                                                    <div class="hidden sm:block h-5 w-5 rounded bg-slate-200 animate-pulse"></div>
                                                </div>
                                            </div>
                                        @endfor
                                    </div>

                                    <!-- 8-Col Recent Orders Panel -->
                                    <div class="col-span-12 order-2 xl:order-1 xl:col-span-8 flex h-[390px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-300 bg-white">
                                        <div class="flex shrink-0 items-center justify-between px-4 py-3 sm:px-5 border-b border-slate-100 bg-slate-50">
                                            <div class="h-5 w-32 rounded bg-slate-200 animate-pulse"></div>
                                            <div class="h-4 w-20 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                        <div class="min-h-0 flex-1 divide-y divide-slate-100 overflow-hidden sm:hidden">
                                            @for ($i = 0; $i < 5; $i++)
                                                <div class="flex justify-between gap-3 px-4 py-3">
                                                    <div class="space-y-2"><div class="h-3 w-32 rounded bg-slate-200 animate-pulse"></div><div class="h-3 w-24 rounded bg-slate-200 animate-pulse"></div></div>
                                                    <div class="space-y-2"><div class="h-3 w-20 rounded bg-slate-200 animate-pulse ml-auto"></div></div>
                                                </div>
                                            @endfor
                                        </div>
                                        <div class="hidden min-h-0 flex-1 overflow-hidden sm:block">
                                            <table class="w-full text-left text-xs">
                                                <thead class="border-b border-slate-200 bg-slate-100">
                                                    <tr>
                                                        @for ($i = 0; $i < 5; $i++)
                                                            <th class="px-4 py-2"><div class="h-3 w-20 rounded bg-slate-200 animate-pulse"></div></th>
                                                        @endfor
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-slate-100">
                                                    @for ($i = 0; $i < 6; $i++)
                                                        <tr>
                                                            @for ($j = 0; $j < 5; $j++)
                                                                <td class="px-4 py-2.5"><div class="h-3.5 w-20 rounded bg-slate-200 animate-pulse"></div></td>
                                                            @endfor
                                                        </tr>
                                                    @endfor
                                                </tbody>
                                            </table>
                                        </div>
                                        <div class="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-3">
                                            <div class="h-3 w-20 rounded bg-slate-200 animate-pulse"></div>
                                            <div class="h-6 w-44 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                    </div>

                                    <!-- 4-Col Stock Alert Panel -->
                                    <div class="col-span-12 order-1 xl:order-2 xl:col-span-4 flex h-[280px] xl:h-[390px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-300 bg-white">
                                        <div class="shrink-0 px-4 py-3 sm:px-5 border-b border-slate-100 bg-slate-50">
                                            <div class="h-4 w-32 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                        <div class="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                                            <div class="space-y-3">
                                                @for ($i = 0; $i < 5; $i++)
                                                    <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                                                        <div class="flex items-center gap-2.5 flex-1 min-w-0">
                                                            <div class="h-7 w-7 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                                                            <div class="h-3 w-3/4 rounded bg-slate-200 animate-pulse"></div>
                                                        </div>
                                                        <div class="h-3 w-12 rounded bg-slate-200 animate-pulse shrink-0"></div>
                                                    </div>
                                                @endfor
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 8-Col Revenue Chart Panel -->
                                    <div class="col-span-12 order-3 xl:col-span-8 flex h-[280px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white">
                                        <div class="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-5 border-b border-slate-100 bg-slate-50">
                                            <div class="h-5 w-24 rounded bg-slate-200 animate-pulse"></div>
                                            <div class="h-3 w-44 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                        <div class="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                                            <div class="flex min-h-0 flex-1 items-end gap-3 pl-14 pt-1">
                                                <div class="flex h-full flex-1 items-end"><div class="w-full h-[30%] bg-slate-200 rounded-t-md animate-pulse"></div></div>
                                                <div class="flex h-full flex-1 items-end"><div class="w-full h-[55%] bg-slate-200 rounded-t-md animate-pulse"></div></div>
                                                <div class="flex h-full flex-1 items-end"><div class="w-full h-[20%] bg-slate-200 rounded-t-md animate-pulse"></div></div>
                                                <div class="flex h-full flex-1 items-end"><div class="w-full h-[75%] bg-slate-200 rounded-t-md animate-pulse"></div></div>
                                                <div class="flex h-full flex-1 items-end"><div class="w-full h-[40%] bg-slate-200 rounded-t-md animate-pulse"></div></div>
                                                <div class="flex h-full flex-1 items-end"><div class="w-full h-[60%] bg-slate-200 rounded-t-md animate-pulse"></div></div>
                                                <div class="flex h-full flex-1 items-end"><div class="w-full h-[35%] bg-slate-200 rounded-t-md animate-pulse"></div></div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 4-Col Category Breakdown Panel -->
                                    <div class="col-span-12 order-4 xl:col-span-4 h-[280px] overflow-hidden rounded-xl border border-slate-300 bg-white">
                                        <div class="px-4 py-3 sm:px-5 border-b border-slate-100 bg-slate-50">
                                            <div class="h-4 w-32 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                        <div class="px-4 py-3 sm:px-5 space-y-3">
                                            @for ($i = 0; $i < 5; $i++)
                                                <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                                                    <div class="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <div class="h-6 w-6 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                                                        <div class="h-3 w-3/4 rounded bg-slate-200 animate-pulse"></div>
                                                    </div>
                                                    <div class="h-3 w-14 rounded bg-slate-200 animate-pulse shrink-0"></div>
                                                </div>
                                            @endfor
                                        </div>
                                    </div>
                                </div>
                            @else
                                <!-- Generic Authenticated layout preview fallback -->
                                <div class="w-full space-y-5">
                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        @for ($i = 0; $i < 4; $i++)
                                            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                                                <div class="h-3 w-20 bg-slate-200 rounded animate-pulse"></div>
                                                <div class="h-7 w-28 bg-slate-300 rounded animate-pulse"></div>
                                            </div>
                                        @endfor
                                    </div>
                                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                                        <div class="h-5 w-36 bg-slate-200 rounded animate-pulse mb-4"></div>
                                        @for ($i = 0; $i < 4; $i++)
                                            <div class="h-9 w-full bg-slate-50 rounded-lg animate-pulse"></div>
                                        @endfor
                                    </div>
                                </div>
                            @endif
                        </main>
                    </div>
                </div>
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
