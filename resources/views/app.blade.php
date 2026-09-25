<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Motorku') }}</title>
        <meta name="description" content="Motorku - Sistem POS Kasir & Katalog QR Sparepart Modern. Pesan online, ambil di toko tanpa antri.">
        <meta name="csrf-token" content="{{ csrf_token() }}">

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
            @php $comp = $page['component'] ?? ''; @endphp
            @if ($comp === 'Order/Menu')
                <!-- Motorku Customer Storefront Catalog Shell (1:1 Exact Monochromatic Parity) -->
                <div class="customer-storefront min-h-screen bg-[#f8fafc] text-slate-900" aria-busy="true" aria-label="Memuat katalog sparepart">
                    <!-- Top Announcement Bar (Desktop) -->
                    <div class="hidden bg-slate-900/10 sm:block border-b border-slate-200/40">
                        <div class="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-1.5 lg:px-8">
                            <div class="h-2.5 w-48 rounded bg-slate-200 animate-pulse"></div>
                            <div class="h-2.5 w-32 rounded bg-slate-200 animate-pulse"></div>
                        </div>
                    </div>

                    <!-- Store Header -->
                    <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white shadow-2xs overflow-hidden relative">
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
                                <div class="h-8.5 sm:h-9 w-full rounded-full bg-slate-100 border border-slate-200/80 flex items-center px-3.5 gap-2">
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
                    <section class="w-full bg-slate-100 border-b border-slate-200/80 rounded-b-[36px] sm:rounded-b-[48px] shadow-2xs mb-3.5 sm:mb-4.5 overflow-hidden">
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
                            <div class="rounded-2xl sm:rounded-3xl bg-slate-100 border border-slate-200/80 overflow-hidden p-2.5 sm:p-3 shadow-2xs">
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
                                            <div class="w-[calc((100%-20px)/3.25)] sm:w-[calc((100%-24px)/3.35)] md:w-[155px] shrink-0 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
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
                                                <div class="w-[calc((100%-20px)/3.25)] sm:w-[calc((100%-24px)/3.35)] md:w-[155px] shrink-0 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
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
                    <div class="min-h-screen bg-[#F8FAFC] flex justify-center" aria-busy="true" aria-label="Memuat sparepart kompatibel">
                        <div class="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-24">
                            <header class="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs px-3.5 sm:px-5 py-3">
                                <div class="flex items-center justify-between gap-3">
                                    <div class="flex items-center gap-2.5 flex-1 min-w-0">
                                        <div class="w-7 h-7 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                                        <div class="space-y-1 min-w-0 flex-1">
                                            <div class="h-4 w-32 rounded bg-slate-200 animate-pulse"></div>
                                            <div class="h-2.5 w-44 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div class="w-8 h-8 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                                </div>
                            </header>
                            <div class="p-3 bg-white border-b border-slate-100 space-y-2">
                                <div class="h-9 w-full rounded-full bg-slate-100 border border-slate-200 animate-pulse"></div>
                                <div class="flex gap-1.5 overflow-x-hidden">
                                    <div class="h-7 w-20 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                    <div class="h-7 w-24 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
                                    <div class="h-7 w-28 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
                                </div>
                            </div>
                            <div class="p-3 sm:p-4 space-y-2.5">
                                @for ($i = 0; $i < 5; $i++)
                                    <div class="flex items-center h-[82px] sm:h-[88px] rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                                        <div class="w-20 sm:w-24 h-full bg-slate-100 animate-pulse shrink-0"></div>
                                        <div class="flex-1 p-2 sm:p-3 space-y-1.5 min-w-0">
                                            <div class="h-3.5 w-3/4 rounded bg-slate-200 animate-pulse"></div>
                                            <div class="h-2.5 w-1/2 rounded bg-slate-200 animate-pulse"></div>
                                            <div class="h-3.5 w-20 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                        <div class="w-10 sm:w-11 h-full bg-slate-100 border-l border-slate-200 flex items-center justify-center shrink-0">
                                            <div class="w-5 h-5 rounded bg-slate-200 animate-pulse"></div>
                                        </div>
                                    </div>
                                @endfor
                            </div>
                        </div>
                    </div>
                @else
                    <div class="min-h-screen bg-[#F8FAFC] flex justify-center" aria-busy="true" aria-label="Memuat katalog motor">
                        <div class="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-24">
                            <header class="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs px-3.5 sm:px-5 py-3 flex items-center justify-between">
                                <div class="flex items-center gap-2.5">
                                    <div class="w-7 h-7 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                                    <div class="h-4 w-24 rounded bg-slate-200 animate-pulse"></div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                                    <div class="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                                </div>
                            </header>
                            <div class="p-2.5 sm:p-3 bg-white border-b border-slate-100 space-y-2">
                                <div class="h-8 w-full rounded-full bg-slate-100 border border-slate-200 animate-pulse"></div>
                                <div class="flex gap-1 overflow-x-hidden">
                                    @for ($i = 0; $i < 5; $i++)
                                        <div class="h-7 w-16 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
                                    @endfor
                                </div>
                            </div>
                            <div class="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                @for ($i = 0; $i < 6; $i++)
                                    <div class="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
                                        <div class="aspect-[4/3] w-full rounded-lg bg-slate-100 animate-pulse"></div>
                                        <div class="h-3 w-16 rounded bg-slate-200 animate-pulse"></div>
                                        <div class="h-3.5 w-24 rounded bg-slate-200 animate-pulse"></div>
                                        <div class="h-2.5 w-20 rounded bg-slate-100 animate-pulse"></div>
                                    </div>
                                @endfor
                            </div>
                        </div>
                    </div>
                @endif
            @elseif (str_starts_with($comp, 'Auth/'))
                <!-- Auth Pages Shell -->
                <div class="min-h-screen bg-amber-50/60 flex flex-col justify-center items-center p-4">
                    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
                        <div class="flex flex-col items-center space-y-2">
                            <div class="w-12 h-12 rounded-xl bg-slate-200 animate-pulse"></div>
                            <div class="h-5 w-36 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                        <div class="space-y-4">
                            <div class="space-y-1.5"><div class="h-3 w-16 bg-slate-200 rounded animate-pulse"></div><div class="h-10 w-full bg-slate-100 rounded-xl animate-pulse"></div></div>
                            <div class="space-y-1.5"><div class="h-3 w-20 bg-slate-200 rounded animate-pulse"></div><div class="h-10 w-full bg-slate-100 rounded-xl animate-pulse"></div></div>
                            <div class="h-11 w-full bg-blue-600/40 rounded-xl animate-pulse"></div>
                        </div>
                    </div>
                </div>
            @elseif ($comp === 'POS/Index')
                <!-- POS Cashier Layout Shell -->
                <div class="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans">
                    <div class="h-14 sm:h-16 bg-white border-b border-slate-300 flex items-center justify-between px-4 shrink-0">
                        <div class="flex items-center gap-3">
                            <div class="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
                            <div class="h-8 w-64 bg-slate-100 rounded-lg animate-pulse hidden sm:block"></div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="h-8 w-24 bg-slate-100 rounded-lg animate-pulse"></div>
                            <div class="w-9 h-9 rounded-lg bg-slate-200 animate-pulse"></div>
                        </div>
                    </div>
                    <div class="flex-1 flex overflow-hidden">
                        <div class="flex-1 p-4 overflow-y-auto space-y-4">
                            <div class="flex gap-2 py-1 overflow-hidden">
                                @for ($i = 0; $i < 5; $i++)
                                    <div class="h-7 w-20 bg-slate-200 rounded-lg animate-pulse shrink-0"></div>
                                @endfor
                            </div>
                            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                                @for ($i = 0; $i < 8; $i++)
                                    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                                        <div class="h-36 w-full bg-slate-200 animate-pulse"></div>
                                        <div class="p-3 space-y-2">
                                            <div class="h-3.5 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                                            <div class="h-2.5 w-1/2 bg-slate-100 rounded animate-pulse"></div>
                                            <div class="flex justify-between items-center pt-2 border-t border-slate-100">
                                                <div class="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                                                <div class="w-7 h-7 bg-blue-600/30 rounded-md animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                @endfor
                            </div>
                        </div>
                        <div class="w-80 lg:w-96 bg-white border-l border-slate-200 hidden md:flex flex-col p-4 shrink-0 space-y-4">
                            <div class="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
                            <div class="flex-1 space-y-3">
                                @for ($i = 0; $i < 3; $i++)
                                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                                        <div class="h-3.5 w-2/3 bg-slate-200 rounded animate-pulse"></div>
                                        <div class="h-3 w-1/3 bg-slate-100 rounded animate-pulse"></div>
                                    </div>
                                @endfor
                            </div>
                            <div class="h-12 w-full bg-blue-600/40 rounded-xl animate-pulse"></div>
                        </div>
                    </div>
                </div>
            @elseif (in_array($comp, ['User/Index', 'Dashboard/Owner/Index', 'Product/Index', 'Order/Index', 'Inventory/Index', 'Report/Index', 'Setting/Index', 'Motorcycle/Index', 'Profile/Edit']) || str_starts_with($comp, 'Dashboard/'))
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
                                    <div class="h-9 rounded-lg {{ $comp === 'Dashboard/Owner/Index' ? 'bg-slate-100 border-l-4 border-slate-300' : 'bg-slate-50' }} animate-pulse"></div>
                                </div>
                            </div>
                            <div>
                                <div class="px-3 mb-2 h-2.5 w-16 bg-slate-200 rounded animate-pulse"></div>
                                <div class="space-y-1">
                                    <div class="h-9 rounded-lg {{ $comp === 'Order/Index' ? 'bg-slate-100 border-l-4 border-slate-300' : 'bg-slate-50' }} animate-pulse"></div>
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
                                <div class="h-5 sm:h-6 {{ $comp === 'User/Index' ? 'w-44' : ($comp === 'Product/Index' ? 'w-40' : 'w-32') }} bg-slate-300 rounded-md animate-pulse"></div>
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
                        <main class="flex-1 {{ $comp === 'Motorcycle/Index' ? 'p-3 sm:p-4 lg:p-5' : 'p-6 lg:p-8' }} overflow-y-auto bg-slate-50">
                            @if ($comp === 'User/Index')
                                <!-- Exact User/Index layout preview -->
                                <div class="max-w-7xl mx-auto space-y-6">
                                    <!-- Card 1: Header + Search + Button -->
                                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div class="h-5 w-48 bg-slate-200 rounded animate-pulse"></div>
                                            <div class="h-3 w-72 bg-slate-100 rounded animate-pulse mt-1.5"></div>
                                        </div>
                                        <div class="flex items-center gap-3 w-full sm:w-auto">
                                            <div class="h-9 w-full sm:w-64 bg-slate-100 border border-slate-200 rounded-xl animate-pulse"></div>
                                            <div class="h-9 w-36 bg-blue-600/40 rounded-xl animate-pulse shrink-0"></div>
                                        </div>
                                    </div>
                                    <!-- Card 2: Filter + Table + Pagination -->
                                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                        <div class="p-4 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2">
                                            <div class="h-3 w-20 bg-slate-200 rounded animate-pulse"></div>
                                            <div class="h-6 w-16 bg-blue-600/30 rounded-lg animate-pulse"></div>
                                            <div class="h-6 w-16 bg-slate-200 rounded-lg animate-pulse"></div>
                                            <div class="h-6 w-16 bg-slate-200 rounded-lg animate-pulse"></div>
                                        </div>
                                        <table class="w-full text-left">
                                            <thead>
                                                <tr class="border-b border-slate-100 bg-slate-50/60">
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
                            @elseif ($comp === 'Order/Index')
                                <!-- Order/Index layout preview -->
                                <div class="w-full space-y-4">
                                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                                        @for ($i = 0; $i < 4; $i++)
                                            <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                                                <div class="h-2.5 w-24 bg-slate-200 rounded animate-pulse"></div>
                                                <div class="h-6 w-16 bg-slate-300 rounded animate-pulse"></div>
                                            </div>
                                        @endfor
                                    </div>
                                    <div class="bg-white rounded-xl shadow-2xs border border-slate-200/80 overflow-hidden">
                                        <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
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
                            @elseif ($comp === 'Setting/Index')
                                <!-- Setting/Index layout preview -->
                                <div class="max-w-4xl mx-auto space-y-6 pb-8">
                                    <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                                        <div class="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
                                        <div class="flex items-center gap-6">
                                            <div class="w-24 aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 animate-pulse"></div>
                                            <div class="h-9 w-32 bg-blue-600/30 rounded-lg animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                                        <div class="h-5 w-48 bg-slate-200 rounded animate-pulse"></div>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div class="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
                                            <div class="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            @elseif ($comp === 'Motorcycle/Index')
                                <!-- Data Motor shell: follows the motorcycle list shown after React mounts. -->
                                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div class="p-4 border-b border-slate-200 space-y-4">
                                        <div class="flex items-center justify-between gap-4">
                                            <div class="flex items-center gap-3">
                                                <div class="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
                                                <div class="h-5 w-10 bg-slate-100 rounded-full animate-pulse"></div>
                                            </div>
                                            <div class="flex gap-2">
                                                <div class="h-8 w-36 bg-slate-100 rounded animate-pulse"></div>
                                                <div class="h-8 w-28 bg-slate-100 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div class="flex items-center justify-between gap-4">
                                            <div class="h-8 w-64 bg-slate-100 rounded animate-pulse"></div>
                                            <div class="hidden md:flex gap-2">
                                                <div class="h-8 w-56 bg-slate-100 rounded animate-pulse"></div>
                                                <div class="h-8 w-48 bg-slate-100 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                    @for ($i = 0; $i < 5; $i++)
                                        <div class="p-3.5 flex items-center justify-between gap-4 border-b border-slate-100">
                                            <div class="flex items-center gap-3.5 min-w-0">
                                                <div class="w-16 h-16 bg-slate-100 rounded-lg animate-pulse shrink-0"></div>
                                                <div class="space-y-2 min-w-0">
                                                    <div class="h-4 w-40 bg-slate-200 rounded animate-pulse"></div>
                                                    <div class="h-3 w-48 bg-slate-100 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div class="hidden sm:flex items-center gap-3">
                                                <div class="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
                                                <div class="h-8 w-24 bg-slate-100 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                    @endfor
                                    <div class="p-3 flex items-center justify-between">
                                        <div class="h-3 w-44 bg-slate-100 rounded animate-pulse"></div>
                                        <div class="h-8 w-32 bg-slate-100 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            @else
                                <!-- Generic Authenticated layout preview (Dashboard, Product, Report, etc.) -->
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
                <div id="app-shell" class="min-h-screen bg-amber-50/60 font-sans flex justify-center">
                    <div class="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-28">
                        <div class="bg-[#1E3A8A] px-4 py-3.5 text-white border-b-[3px] border-amber-400">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-md bg-white/20 animate-pulse shrink-0"></div>
                                <div class="space-y-1.5 flex-1">
                                    <div class="h-4 bg-white/30 rounded w-36 animate-pulse"></div>
                                    <div class="h-2.5 bg-white/20 rounded w-48 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 space-y-4 flex-1">
                            <div class="h-8 bg-slate-100 rounded-md w-full animate-pulse"></div>
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
            @endif
        </div>
    </body>
</html>
