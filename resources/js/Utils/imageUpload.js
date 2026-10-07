export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const IMAGE_HELP = 'JPEG, PNG, WebP · maks 4 MB, 6000×6000 px / 16 MP. Disimpan sebagai WebP di bawah 1 MB.';

export function validImage(file) {
    if (!file) return false;
    if (!IMAGE_ACCEPT.split(',').includes(file.type) || file.size > 4 * 1024 * 1024) {
        alert(IMAGE_HELP);
        return false;
    }
    return true;
}
