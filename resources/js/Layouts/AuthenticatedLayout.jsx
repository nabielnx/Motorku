import { useEffect, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'sonner';
import { getTranslation } from '@/i18n/translations';
import { 
    FiGrid, 
    FiCoffee, 
    FiShoppingCart, 
    FiBarChart2, 
    FiSettings, 
    FiMenu, 
    FiHelpCircle, 
    FiLogOut, 
    FiClipboard,
    FiLayers,
    FiPackage,
    FiUsers,
    FiX,
    FiMonitor,
    FiSun,
    FiMoon,
    FiBell
} from 'react-icons/fi';

export default function AuthenticatedLayout({ header, pageTitle, noPadding = false, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { url, props } = usePage(); 
    const locale = props.app_settings?.locale || 'id';
    const user = props.auth?.user || { name: 'Admin', email: 'admin@tokosparepart.com' };
    const primaryRole = props.auth?.roles?.[0] ?? null;
    const userRoles = props.auth?.roles ?? (primaryRole ? [primaryRole] : []);

    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem('theme');
            if (saved) return saved;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        try {
            localStorage.setItem('theme', theme);
        } catch {}
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    // ── Pending orders count (untuk badge notifikasi yang jujur) ──
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        let timer;

        const fetchCount = async () => {
            try {
                const res = await window.axios.get('/api/orders/pending-count');
                if (!cancelled) setPendingCount(Number(res.data?.count ?? 0));
            } catch {
                // Jangan ganggu UI kalau fetch gagal; biarkan nilai lama.
            }
        };

        fetchCount();
        timer = setInterval(fetchCount, 10000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);


    useEffect(() => {
        const flash = props.flash;
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning);
    }, [props.flash]);

    const safeRoute = (name, fallback) => {
        try {
            return route(name);
        } catch (e) {
            return fallback;
        }
    };

    // Role checking helper
    const hasRole = (...roles) => {
        if (!userRoles || userRoles.length === 0) return true;
        return roles.some(role => userRoles.includes(role));
    };

    const homeHref = hasRole('cashier') ? '/pos' : '/dashboard';

    // Menu sections with role-based visibility
    const menuSections = [
        {
            label: getTranslation(locale, 'section_utama', 'UTAMA'),
            items: [
                { 
                    name: getTranslation(locale, 'dashboard', 'Dashboard'), 
                    icon: FiGrid, 
                    href: safeRoute('dashboard', '/dashboard'), 
                    active: url === '/dashboard' || url === '/',
                    roles: ['owner']
                },
                { 
                    name: getTranslation(locale, 'pos_kasir', 'POS Kasir'), 
                    icon: FiShoppingCart, 
                    href: safeRoute('pos.index', '/pos'), 
                    active: url.startsWith('/pos'),
                    roles: ['cashier']
                },
            ]
        },
        {
            label: getTranslation(locale, 'section_manajemen', 'MANAJEMEN'),
            items: [
                {
                    name: getTranslation(locale, 'daftar_pesanan', 'Pesanan'),
                    icon: FiClipboard,
                    href: safeRoute('orders.index', '/orders'),
                    active: url.startsWith('/orders'),
                    roles: ['owner', 'cashier']
                },
                {
                    name: getTranslation(locale, 'menu_produk', 'Produk'),
                    icon: FiCoffee,
                    href: safeRoute('products.index', '/products'),
                    active: url.startsWith('/products') || url.startsWith('/categories'),
                    roles: ['owner']
                },
                {
                    name: getTranslation(locale, 'stok_inventaris', 'Stok Inventaris'),
                    icon: FiPackage,
                    href: safeRoute('inventory.index', '/inventory'),
                    active: url.startsWith('/inventory'),
                    roles: ['owner']
                },
                {
                    name: 'Data Motor',
                    icon: FiMonitor,
                    href: safeRoute('motorcycles.index', '/motorcycles'),
                    active: url.startsWith('/motorcycles'),
                    roles: ['owner']
                },
            ]
        },
        {
            label: getTranslation(locale, 'section_laporan', 'LAPORAN'),
            items: [
                { 
                    name: getTranslation(locale, 'laporan_keuangan', 'Laporan Keuangan'), 
                    icon: FiBarChart2, 
                    href: safeRoute('reports.index', '/reports'), 
                    active: url.startsWith('/reports'),
                    roles: ['owner']
                },
            ]
        },
        {
            label: getTranslation(locale, 'section_administrasi', 'ADMINISTRASI'),
            items: [
                { 
                    name: getTranslation(locale, 'kelola_staf', 'Kelola Staf'), 
                    icon: FiUsers, 
                    href: safeRoute('users.index', '/users'), 
                    active: url.startsWith('/users'),
                    roles: ['owner']
                },
                { 
                    name: getTranslation(locale, 'pengaturan', 'Pengaturan'), 
                    icon: FiSettings, 
                    href: safeRoute('settings.index', '/settings'), 
                    active: url.startsWith('/settings'),
                    roles: ['owner']
                },
            ]
        },
    ];

    // Filter sections based on user role and feature enablement
    const visibleSections = menuSections
        .map(section => ({
            ...section,
            items: section.items.filter(item => hasRole(...item.roles) && (item.enabled === undefined || item.enabled))
        }))
        .filter(section => section.items.length > 0);

    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-200">
            
            {/* OVERLAY MOBILE */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* SIDEBAR NAVIGATION */}
            <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-slate-900 w-64 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-full lg:inset-auto flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Brand Logo */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <Link href={homeHref} className="flex items-center gap-3">
                        <ApplicationLogo className="w-12 h-16 shrink-0" />
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                Toko Sparepart
                            </h1>
                            <p className="text-[10px] font-bold text-blue-600 dark:text-yellow-400 uppercase tracking-widest mt-1">POS & Order</p>
                        </div>
                    </Link>

                    {/* Close button mobile */}
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 lg:hidden"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Navigation Links — Scrollable */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-5">
                    {visibleSections.map((section, sIndex) => (
                        <div key={sIndex}>
                            {/* Section Label */}
                            <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {section.label}
                            </p>

                            {/* Section Items */}
                            <div className="space-y-0.5">
                                {section.items.map((item, iIndex) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={iIndex}
                                            href={item.href}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`flex items-center gap-3 -mx-3 px-6 py-2.5 transition-colors font-semibold text-[13px] ${
                                                item.active 
                                                    ? 'bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-yellow-400 border-l-4 border-blue-600 dark:border-blue-500 font-bold' 
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent'
                                            }`}
                                        >
                                            <Icon size={17} className={item.active ? 'text-blue-600 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'} strokeWidth={2.2} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar Bottom — Support, Logout & Copyright */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5 shrink-0">
                    <a
                        href="#support"
                        className="flex items-center gap-3 -mx-3 px-6 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <FiHelpCircle size={17} className="text-slate-400 dark:text-slate-500" />
                        <span>{locale === 'en' ? 'Help & Support' : 'Bantuan & Dukungan'}</span>
                    </a>

                    <Link
                        href={safeRoute('logout', '/logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center gap-3 -mx-3 px-6 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 transition-colors text-left"
                    >
                        <FiLogOut size={17} className="text-slate-400 dark:text-slate-500" />
                        <span>{getTranslation(locale, 'logout', 'Keluar')}</span>
                    </Link>

                    <div className="pt-2.5 mt-1.5 border-t border-slate-100/80 dark:border-slate-800 px-3 text-[10px] text-slate-400 dark:text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-500 dark:text-slate-400">© 2026 Toko Sparepart</p>
                        <div className="flex items-center gap-2 font-medium text-slate-400 dark:text-slate-500">
                            <a href="#privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition">{locale === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}</a>
                            <span>•</span>
                            <a href="#terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition">{locale === 'en' ? 'Terms' : 'Syarat'}</a>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                
                {/* TOP HEADER */}
                <header className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-20 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
                        >
                            <FiMenu size={22} strokeWidth={2.5} />
                        </button>
                        
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {pageTitle || header || getTranslation(locale, 'dashboard', 'Dashboard')}
                        </h2>
                    </div>

                    {/* Right Action Icons */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        {/* Notification Bell Badge */}
                        <Link
                            href="/orders?status=pending"
                            title={pendingCount > 0
                                ? `${pendingCount} Pesanan Menunggu Konfirmasi`
                                : 'Notifikasi Pesanan'}
                            aria-label="Notifikasi Pesanan"
                            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center shrink-0"
                        >
                            <FiBell size={19} className={pendingCount > 0 ? 'text-amber-500 dark:text-amber-400 animate-bounce' : ''} />
                            {pendingCount > 0 && (
                                <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-2xs">
                                    {pendingCount > 99 ? '99+' : pendingCount}
                                </span>
                            )}
                        </Link>

                        {/* Dark / Light Mode Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center shrink-0"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                <FiSun size={19} className="text-amber-400" />
                            ) : (
                                <FiMoon size={19} className="text-slate-600" />
                            )}
                        </button>

                        {/* User Profile Avatar Dropdown */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition focus:outline-none">
                                    {user.avatar ? (
                                        <img 
                                            src={'/storage/' + user.avatar} 
                                            alt={user.name} 
                                            className="w-10 h-10 rounded-lg border-2 border-slate-300 dark:border-slate-700 object-cover shadow-xs"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center border-2 border-blue-700 shadow-xs">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{user.name}</p>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">{userRoles[0] || 'Staff'}</p>
                                    </div>
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content align="right">
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                </div>
                                <Dropdown.Link href={safeRoute('profile.edit', '/profile')}>{getTranslation(locale, 'my_profile', 'Pengaturan Profil')}</Dropdown.Link>
                                <Dropdown.Link href={safeRoute('logout', '/logout')} method="post" as="button">
                                    {getTranslation(locale, 'logout', 'Keluar')}
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* SCROLLABLE CONTENT BODY */}
                <main className={`flex-1 min-h-0 ${noPadding ? 'p-0 flex flex-col overflow-hidden' : 'p-6 lg:p-8 overflow-y-auto'}`}>
                    {children}
                </main>
                <Toaster position="top-right" richColors closeButton />
            </div>
        </div>
    );
}
