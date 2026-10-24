@if ($comp === 'Payment/Index')
    @include('partials.customer-checkout-loading')
@else
    <div class="customer-storefront order-workspace order-workspace-simple" role="status" aria-label="Memuat pesanan">
        <div class="order-topbar"><div><div class="h-7 w-32 rounded bg-[#dddfd5]"></div><div class="h-4 w-24 rounded bg-[#dddfd5]"></div></div></div>
        <div class="order-container">
            <div class="order-page-title"><div class="space-y-3"><div class="h-8 w-52 rounded bg-[#dddfd5]"></div><div class="h-3 w-64 max-w-full rounded bg-[#dddfd5]"></div></div></div>
            <div class="order-receipt">
                @for ($section = 0; $section < 3; $section++)
                    <div class="space-y-4"><div class="h-4 w-40 rounded bg-[#dddfd5]"></div><div class="h-3 w-3/4 rounded bg-[#eeefe7]"></div><div class="h-3 w-1/2 rounded bg-[#eeefe7]"></div></div>
                @endfor
            </div>
        </div>
    </div>
@endif
