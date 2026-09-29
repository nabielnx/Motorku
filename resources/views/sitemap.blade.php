{!! '<'.'?xml version="1.0" encoding="UTF-8"?'.'>' !!}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>{{ route('home') }}</loc></url>
    <url><loc>{{ route('motor-saya') }}</loc></url>
    @foreach ($motorcycleSlugs as $slug)
        <url><loc>{{ route('motor-saya', ['slug' => $slug]) }}</loc></url>
    @endforeach
</urlset>
