<div class="customer-storefront order-workspace {{ $comp === 'Payment/Index' ? '' : 'order-workspace-simple' }}" role="status" aria-label="Memuat pesanan">
    <div class="order-topbar"><div><div class="h-7 w-32 rounded bg-[#dddfd5]"></div><div class="h-4 w-24 rounded bg-[#dddfd5]"></div></div></div>
    <div class="order-container">
        <div class="order-page-title"><div class="space-y-3"><div class="h-3 w-28 rounded bg-[#dddfd5]"></div><div class="h-8 w-52 rounded bg-[#dddfd5]"></div><div class="h-3 w-64 max-w-full rounded bg-[#dddfd5]"></div></div></div>
        @if ($comp === 'Payment/Index')
        <div class="order-grid">
            <div class="order-stack">
                <div class="order-panel space-y-6"><div class="h-5 w-36 rounded bg-[#dddfd5]"></div>
                    @for ($i = 0; $i < 3; $i++)
                        <div class="flex items-start gap-3"><div class="h-8 w-8 shrink-0 rounded bg-[#eeefe7]"></div><div class="flex-1 space-y-2"><div class="h-3 w-3/4 rounded bg-[#dddfd5]"></div><div class="h-3 w-20 rounded bg-[#eeefe7]"></div></div><div class="h-3 w-16 rounded bg-[#dddfd5]"></div></div>
                    @endfor
                </div>
                <div class="order-panel space-y-4"><div class="h-5 w-36 rounded bg-[#dddfd5]"></div><div class="h-3 w-3/4 rounded bg-[#eeefe7]"></div></div>
            </div>
            <div class="order-panel space-y-5"><div class="h-5 w-32 rounded bg-[#dddfd5]"></div><div class="h-12 w-full rounded bg-[#eeefe7]"></div><div class="h-16 w-full rounded bg-[#eeefe7]"></div><div class="h-16 w-full rounded bg-[#eeefe7]"></div><div class="h-6 w-2/3 rounded bg-[#dddfd5]"></div><div class="h-11 w-full rounded bg-[#ffdd00]"></div></div>
        </div>
        @else
            <div class="order-receipt">
                @for ($section = 0; $section < 3; $section++)
                    <div class="space-y-4"><div class="h-4 w-40 rounded bg-[#dddfd5]"></div><div class="h-3 w-3/4 rounded bg-[#eeefe7]"></div><div class="h-3 w-1/2 rounded bg-[#eeefe7]"></div></div>
                @endfor
            </div>
        @endif
    </div>
</div>
