<div id="admin-initial-skeleton" class="admin-workspace h-[100dvh] w-screen overflow-hidden flex font-sans" data-view-key="{{ $loading['storageKey'] }}" aria-busy="true" aria-label="Memuat halaman admin">
    <aside class="admin-sidebar hidden lg:flex w-64 shrink-0 flex-col border-r">
        <div class="admin-brand flex items-center gap-3 border-b p-5">
            <div class="h-10 w-10 shrink-0 rounded-lg bg-[#35423b] animate-pulse"></div>
            <div class="space-y-2"><div class="h-4 w-24 rounded bg-[#35423b] animate-pulse"></div><div class="h-2 w-16 rounded bg-[#35423b] animate-pulse"></div></div>
        </div>
        <div class="flex-1 space-y-5 p-3">
            @for ($section = 0; $section < 3; $section++)
                <div class="space-y-2">
                    <div class="mx-3 h-2.5 w-20 rounded bg-[#35423b] animate-pulse"></div>
                    @for ($item = 0; $item < 3; $item++)
                        <div class="flex min-h-[38px] items-center gap-3 px-3"><div class="h-4 w-4 rounded bg-[#35423b] animate-pulse"></div><div class="h-3 w-24 rounded bg-[#35423b] animate-pulse"></div></div>
                    @endfor
                </div>
            @endfor
        </div>
    </aside>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header class="admin-topbar flex h-14 shrink-0 items-center justify-between border-b px-3 sm:h-16 sm:px-6">
            <div class="flex items-center gap-3"><div class="h-7 w-7 rounded bg-slate-200 animate-pulse lg:hidden"></div><div class="h-5 w-32 rounded bg-slate-200 animate-pulse"></div></div>
            <div class="flex items-center gap-2"><div class="h-7 w-7 rounded bg-slate-200 animate-pulse"></div><div class="h-7 w-7 rounded bg-slate-200 animate-pulse"></div><div class="h-8 w-8 rounded-full bg-slate-200 animate-pulse"></div></div>
        </header>
        <main class="admin-main min-h-0 flex-1 {{ $loading['noPadding'] ? 'flex flex-col overflow-hidden p-0' : 'overflow-y-auto p-3 sm:p-6 lg:p-8' }}">
            @php $initialView = $loading['variants'][$loading['defaultView']] ?? null; @endphp
            <div class="contents" data-loading-content>
                @if ($initialView)
                    {!! $initialView !!}
                @else
                    <div class="space-y-4 p-4"><div class="h-6 w-40 rounded bg-slate-200 animate-pulse"></div><div class="h-48 rounded-xl bg-slate-200 animate-pulse"></div></div>
                @endif
            </div>
            @foreach ($loading['variants'] as $view => $markup)
                <template data-loading-variant="{{ $view }}">{!! $markup !!}</template>
            @endforeach
        </main>
        <nav class="admin-mobile-dock grid-cols-4" aria-label="Memuat navigasi cepat">
            @foreach (['Dashboard', 'Kasir', 'Produk', 'Pesanan'] as $item)
                <div class="admin-dock-item"><div class="h-4 w-4 rounded bg-slate-200 animate-pulse"></div><span>{{ $item }}</span></div>
            @endforeach
        </nav>
    </div>
</div>
<script nonce="{{ Illuminate\Support\Facades\Vite::cspNonce() }}">
    (() => {
        const shell = document.getElementById('admin-initial-skeleton');
        if (!shell.dataset.viewKey) return;
        try {
            const preferred = localStorage.getItem(shell.dataset.viewKey);
            const template = Array.from(shell.querySelectorAll('template[data-loading-variant]')).find(item => item.dataset.loadingVariant === preferred);
            if (template) shell.querySelector('[data-loading-content]').replaceChildren(template.content.cloneNode(true));
        } catch {}
    })();
</script>
