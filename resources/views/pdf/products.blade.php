<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Daftar Barang - TokoM</title>
    <style>
        @page {
            margin: 12mm 10mm 14mm 10mm;
            size: a4 landscape;
        }

        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
            font-size: 8.5pt;
            color: #19231f;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border-bottom: 2px solid #19231f;
            padding-bottom: 8px;
        }

        .header-title {
            font-size: 15pt;
            font-weight: bold;
            color: #19231f;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }

        .header-subtitle {
            font-size: 9pt;
            color: #444444;
            margin-top: 2px;
        }

        .header-meta {
            text-align: right;
            font-size: 8pt;
            color: #333333;
            line-height: 1.4;
        }

        .header-badge {
            display: inline-block;
            background-color: #ffdd00;
            color: #19231f;
            font-weight: bold;
            padding: 2px 7px;
            border-radius: 3px;
            font-size: 7.5pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }

        table.items-table thead {
            display: table-header-group;
        }

        table.items-table th {
            background-color: #19231f;
            color: #ffffff;
            font-weight: bold;
            font-size: 8pt;
            padding: 6px 7px;
            text-align: left;
            border: 1px solid #19231f;
            white-space: nowrap;
        }

        table.items-table th.center {
            text-align: center;
        }

        table.items-table th.right {
            text-align: right;
        }

        table.items-table tr {
            page-break-inside: avoid;
        }

        table.items-table td {
            padding: 5px 7px;
            font-size: 8pt;
            border: 1px solid #dedfd7;
            vertical-align: top;
        }

        table.items-table tr:nth-child(even) td {
            background-color: #f8f9fa;
        }

        .center {
            text-align: center;
        }

        .right {
            text-align: right;
            white-space: nowrap;
        }

        .sku {
            font-family: monospace;
            font-size: 7.5pt;
            color: #222222;
        }

        .product-name {
            font-weight: bold;
            color: #19231f;
        }

        .product-desc {
            font-size: 7pt;
            color: #555555;
            margin-top: 2px;
        }

        .out-of-stock {
            color: #ef4444;
            font-weight: bold;
        }

        .in-stock {
            font-weight: bold;
            color: #19231f;
        }

        footer {
            position: fixed;
            bottom: -10mm;
            left: 0;
            right: 0;
            height: 7mm;
            border-top: 1px solid #dedfd7;
            padding-top: 2mm;
            font-size: 7.5pt;
            color: #555555;
        }

        .footer-left {
            float: left;
        }

        .footer-right {
            float: right;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="vertical-align: bottom;">
                <div class="header-title">Daftar Barang & Harga</div>
                <div class="header-subtitle">TokoM · Buku Catatan Inventaris & Harga Jual</div>
            </td>
            <td class="header-meta" style="vertical-align: bottom;">
                <div>Grup: <span class="header-badge">{{ $groupLabel }}</span></div>
                <div style="margin-top: 3px;">Dicetak: <strong>{{ $generatedAt }}</strong></div>
                <div>Total: <strong>{{ count($products) }} barang</strong></div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th class="center" style="width: 3%;">No</th>
                <th style="width: 11%;">Kode</th>
                <th style="width: 29%;">Nama Barang</th>
                <th style="width: 12%;">Kategori</th>
                <th style="width: 10%;">Merek</th>
                <th class="center" style="width: 7%;">Stok</th>
                <th class="right" style="width: 9.5%;">Harga Beli</th>
                <th class="right" style="width: 9.5%;">Harga Jual</th>
                <th class="right" style="width: 9%;">Margin</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($products as $index => $product)
                @php
                    $cost = $product->cost_price !== null ? (float) $product->cost_price : null;
                    $price = (float) $product->price;
                    $margin = $cost !== null ? $price - $cost : null;
                @endphp
                <tr>
                    <td class="center">{{ $index + 1 }}</td>
                    <td class="sku">{{ $product->sku ?: '—' }}</td>
                    <td>
                        <div class="product-name">{{ $product->name }}</div>
                        @if ($product->description)
                            <div class="product-desc">{{ $product->description }}</div>
                        @endif
                    </td>
                    <td>{{ $product->category?->name ?? '—' }}</td>
                    <td>{{ $product->brand ?: '—' }}</td>
                    <td class="center">
                        @if ($product->stock <= 0)
                            <span class="out-of-stock">Habis (0)</span>
                        @else
                            <span class="in-stock">{{ (int) $product->stock }}</span>
                            <span style="font-size: 7pt; color: #555555;">{{ $product->unit }}</span>
                        @endif
                    </td>
                    <td class="right">
                        {{ $cost !== null ? 'Rp ' . number_format($cost, 0, ',', '.') : '—' }}
                    </td>
                    <td class="right" style="font-weight: bold;">
                        Rp {{ number_format($price, 0, ',', '.') }}
                    </td>
                    <td class="right">
                        {{ $margin !== null ? 'Rp ' . number_format($margin, 0, ',', '.') : '—' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" class="center" style="padding: 20px; color: #666666;">
                        Tidak ada barang pada katalog ini.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <script type="text/php">
        if (isset($pdf)) {
            $font = $fontMetrics->getFont("DejaVu Sans", "normal");
            $pdf->page_text(730, 560, "Halaman " . $PAGE_NUM . " dari " . $PAGE_COUNT, $font, 7.5, array(0.3, 0.3, 0.3));
            $pdf->page_text(28, 560, "TokoM · Dokumen Rahasia Perusahaan", $font, 7.5, array(0.3, 0.3, 0.3));
        }
    </script>
</body>
</html>
