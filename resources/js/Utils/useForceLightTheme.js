import { useEffect } from 'react';

/**
 * Halaman publik/customer dirancang light-only. Hook ini menghapus class `dark`
 * dari <html> sehingga halaman tidak pernah render gelap tanpa styling, yang
 * bisa terjadi kalau class dark diwarisi dari sesi admin di browser yang sama.
 *
 * Halaman admin tidak terpengaruh: AuthenticatedLayout menerapkan tema lagi
 * sendiri saat halaman admin di-mount.
 */
export default function useForceLightTheme() {
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);
}
