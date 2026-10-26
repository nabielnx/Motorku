{!! '<'.'?xml version="1.0" encoding="UTF-8"?'.'>' !!}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>{{ request()->attributes->get('shop_slug') ? request()->attributes->get('business')->publicUrl() : route('home') }}</loc></url>
    @if ($referencesEnabled)
        <url><loc>{{ route('motor-saya', array_filter(['shop' => request()->attributes->get('shop_slug')])) }}</loc></url>
        @foreach ($motorcycleSlugs as $slug)
            <url><loc>{{ route('motor-saya', array_filter(['slug' => $slug, 'shop' => request()->attributes->get('shop_slug')])) }}</loc></url>
        @endforeach
    @endif
</urlset>
