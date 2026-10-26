import { z } from 'zod';

export const qrisPayloadSchema = z.string().min(20).max(2048).regex(/^000201[\x20-\x7e]+$/);
export const qrisQuoteSchema = z.object({
    payload: qrisPayloadSchema,
    amount: z.number().positive().max(10000000),
    quote_token: z.string().regex(/^[a-f0-9]{64}$/),
    merchant: z.object({ name: z.string(), city: z.string() }),
});

export function qrisErrorMessage(error) {
    const first = Object.values(error?.response?.data?.errors || {})[0];
    return (Array.isArray(first) ? first[0] : first) || error?.response?.data?.message || error?.message || 'QRIS gagal disiapkan. Coba lagi.';
}

export async function decodeQrisPixels(pixels, width, height) {
    const { default: jsQR } = await import('jsqr');
    const code = jsQR(pixels, width, height, { inversionAttempts: 'attemptBoth' });
    const result = qrisPayloadSchema.safeParse(code?.data);
    if (!result.success) throw new Error('QRIS tidak terbaca. Gunakan gambar QRIS statis asli yang jelas dan tidak terpotong.');
    return result.data;
}

export async function readQrisPayload(source) {
    const blob = typeof source === 'string'
        ? await fetch(source, { credentials: 'same-origin', cache: 'no-store' }).then(response => {
            if (!response.ok) throw new Error('Gambar QRIS gagal dibaca. Coba unggah ulang QRIS statis asli.');
            return response.blob();
        })
        : source;
    const url = URL.createObjectURL(blob);
    const image = new Image();
    try {
        image.src = url;
        await image.decode();
        if (image.naturalWidth > 6000 || image.naturalHeight > 6000 || image.naturalWidth * image.naturalHeight > 16000000) {
            throw new Error('Resolusi gambar QRIS maksimal 6000 × 6000 piksel / 16 MP.');
        }
        const canvas = document.createElement('canvas');
        for (const bound of [1600, 2400]) {
            const scale = Math.min(1, bound / Math.max(image.naturalWidth, image.naturalHeight));
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            const context = canvas.getContext('2d', { willReadFrequently: true });
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            try {
                return await decodeQrisPixels(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
            } catch (error) {
                if (bound === 2400) throw error;
            }
        }
    } finally {
        URL.revokeObjectURL(url);
    }
}

export async function renderQrisImage(payload) {
    const { default: QRCode } = await import('qrcode');
    return QRCode.toDataURL(qrisPayloadSchema.parse(payload), {
        errorCorrectionLevel: 'M', width: 360, margin: 4,
        color: { dark: '#000000', light: '#ffffff' },
    });
}
