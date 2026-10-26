export async function renderStoreQr(url) {
    const address = new URL(url);
    if (!['https:', 'http:'].includes(address.protocol) || address.username || address.password) throw new Error('Link toko tidak valid.');
    const { default: QRCode } = await import('qrcode');
    return QRCode.toDataURL(address.href, {
        errorCorrectionLevel: 'M', width: 512, margin: 4,
        color: { dark: '#19231f', light: '#ffffff' },
    });
}
