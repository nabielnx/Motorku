export function prefersNativeCamera(device = navigator) {
    return /Android|iPhone|iPad|iPod/i.test(device.userAgent)
        || (/Macintosh/i.test(device.userAgent) && device.maxTouchPoints > 1);
}

// Keep camera photos within the existing upload limits, without cropping the frame.
export async function createCameraPhoto(source) {
    const width = source.videoWidth || source.naturalWidth;
    const height = source.videoHeight || source.naturalHeight;
    if (!width || !height) throw new Error('Kamera belum siap. Coba ambil foto lagi.');
    const scale = Math.min(1, 2400 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Foto tidak dapat diproses di browser ini.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.8, 0.7, 0.6]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob?.size && blob.size <= 4 * 1024 * 1024) {
            return new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
        }
    }
    throw new Error('Foto gagal diproses. Coba foto lagi atau pilih gambar dari galeri.');
}

export async function normalizeCameraFile(file) {
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error('Foto tidak bisa dibaca. Gunakan foto JPEG, PNG, atau WebP.'));
            image.src = url;
        });
        return await createCameraPhoto(image);
    } finally {
        URL.revokeObjectURL(url);
    }
}

export function cameraErrorMessage(error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
        return 'Akses kamera tidak diizinkan. Izinkan kamera di pengaturan browser, atau pilih gambar dari galeri/file.';
    }
    if (error?.name === 'NotFoundError') return 'Kamera tidak ditemukan. Sambungkan kamera atau pilih gambar dari galeri/file.';
    if (error?.name === 'NotReadableError') return 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.';
    return 'Kamera tidak dapat dibuka. Coba lagi atau pilih gambar dari galeri/file.';
}
