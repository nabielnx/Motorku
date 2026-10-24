export const deletionLockedMessage = 'Penghapusan data admin sedang dikunci. Owner dapat mengaktifkannya di Pengaturan > Sistem.';

export function deletionsAllowed(settings) {
    return settings?.deletion_enabled !== false;
}
