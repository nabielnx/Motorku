import { getProductLabel } from './productLabel.js';

/**
 * Sederhanakan nama barang agar ringkas, padat & jelas (persis gaya tulisan tangan ayah di buku):
 * - Hapus kurung keterangan peruntukan motor yang kepanjangan di belakang
 * - Singkat istilah ban: Tubeless -> TL, Non-Tubeless / Tubetype -> Non-TL, Ring X -> RX
 * - Bersihkan embel-embel berulang seperti "Original", "Assy", dll jika kepanjangan
 */
export function formatSimpleName(rawName) {
    if (!rawName) return '';
    let name = String(rawName).trim();

    // 1. Hapus catatan peruntukan motor di dalam kurung di akhir string, misal:
    //    "(Scooter / Vespa)", "(Matic Ring 14)", "(Bebek Honda Depan - Supra / Revo)"
    name = name.replace(/\s*\((?:scooter|vespa|matic|bebek|sport|honda|yamaha|suzuki|ring\s*\d+|trail|semi|oem|all new)[^)]*\)$/i, '');

    // 2. Singkat istilah teknis ban
    name = name.replace(/\bTubetype\s*\((?:Non-Tubeless|Tube Type)\)/gi, 'Non-TL');
    name = name.replace(/\bNon-Tubeless\b/gi, 'Non-TL');
    name = name.replace(/\bTubetype\b/gi, 'Non-TL');
    name = name.replace(/\bTubeless\b/gi, 'TL');
    name = name.replace(/\bRing\s*(\d+)\b/gi, 'R$1');

    // 3. Jika nama masih sangat panjang (> 32 karakter), buang kata sekunder yang boros tempat
    if (name.length > 32) {
        name = name.replace(/\bOriginal\b/gi, '');
        name = name.replace(/\bAssy\b/gi, '');
        name = name.replace(/\bMotor\b/gi, '');
    }

    // 4. Bersihkan spasi ganda & strip tak terpakai
    name = name.replace(/\s*-\s*-+\s*/g, ' - ');
    name = name.replace(/\s{2,}/g, ' ').trim();

    return name || rawName;
}

/**
 * Product-book label that removes a vehicle application only when the catalog
 * description confirms it, while retaining the existing technical shortening.
 */
export function formatProductBookName(product) {
    const { name } = getProductLabel({
        name: product?.name,
        description: product?.subtitle ?? product?.description,
    });

    return formatSimpleName(name);
}
