import { useEffect, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage, router } from '@inertiajs/react';
import { toast, Toaster } from 'sonner';
import { getTranslation } from '@/i18n/translations';
import DashboardSkeleton from '@/Components/Skeletons/DashboardSkeleton';
import OrderTableSkeleton from '@/Components/Skeletons/OrderTableSkeleton';
import ProductTableSkeleton from '@/Components/Skeletons/ProductTableSkeleton';
import ReportSkeleton from '@/Components/Skeletons/ReportSkeleton';
import UserTableSkeleton from '@/Components/Skeletons/UserTableSkeleton';
import SettingSkeleton from '@/Components/Skeletons/SettingSkeleton';
import MotorcyclePageSkeleton from '@/Components/Skeletons/MotorcyclePageSkeleton';
import PosCardSkeleton from '@/Components/Skeletons/PosCardSkeleton';
import Skeleton from '@/Components/Skeleton';
import MotorIcon from '@/Components/MotorIcon';
import { getNavigationDestination } from '@/Utils/navigation';
import { 
    FiGrid, 
    FiCoffee, 
    FiShoppingCart, 
    FiBarChart2, 
    FiSettings, 
    FiMenu, 

    FiLogOut, 
    FiClipboard,
    FiLayers,
    FiPackage,
    FiUsers,
    FiX,
    FiSun,
    FiMoon,
    FiBell
} from 'react-icons/fi';

const catalogGroups = [
    ['automotive', 'Otomotif'],
    ['electronics', 'Elektronik'],
    ['hardware', 'Alat Bangunan'],
    ['bicycle', 'Sepeda'],
];

function getDestinationInfo(url, locale = 'id') {
    if (!url) return null;
    const destination = new URL(url, 'http://localhost');
    const path = destination.pathname;
    if (path.startsWith('/orders')) {
        return {
            title: locale === 'en' ? 'Orders List' : 'Daftar Pesanan',
            component: <OrderTableSkeleton />,
            noPadding: false,
        };
    }
    if (path.startsWith('/users')) {
        return {
            title: locale === 'en' ? 'Staff Management' : 'Kelola Staff & Pegawai',
            component: <UserTableSkeleton fullPage={true} />,
            noPadding: false,
        };
    }
    if (path.startsWith('/products') || path.startsWith('/categories')) {
        const groupName = catalogGroups.find(([group]) => group === destination.searchParams.get('group'))?.[1];
        return {
            title: groupName || (locale === 'en' ? 'Products' : 'Produk'),
            component: <ProductTableSkeleton fullPage={true} />,
            noPadding: true,
        };
    }
    if (path.startsWith('/reports')) {
        return {
            title: locale === 'en' ? 'Financial Reports' : 'Laporan Keuangan',
            component: <ReportSkeleton />,
            noPadding: false,
        };
    }
    if (path.startsWith('/settings')) {
        return {
            title: locale === 'en' ? 'Settings' : 'Pengaturan',
            component: <SettingSkeleton />,
            noPadding: false,
        };
    }
    if (path.startsWith('/motorcycles')) {
        return {
            title: 'Data Motor',
            component: <MotorcyclePageSkeleton />,
            noPadding: true,
        };
    }
    if (path === '/dashboard' || path === '/') {
        return {
            title: locale === 'en' ? 'Dashboard' : 'Dashboard',
            component: <DashboardSkeleton />,
            noPadding: false,
        };
    }
    if (path.startsWith('/pos')) {
        return {
            title: 'POS Kasir',
            component: (
                <div className="flex min-h-0 flex-1 flex-col md:flex-row w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
                        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 border-b border-slate-300 dark:border-slate-800 space-y-3">
                            <Skeleton className="h-10 w-full rounded-xl" />
                            <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                                <div className="flex gap-2 overflow-hidden">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-7 w-20 rounded-lg shrink-0" />
                                    ))}
                                </div>
                                <Skeleton className="h-7 w-28 shrink-0 rounded-lg" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto p-3"><PosCardSkeleton count={8} /></div>
                        <Skeleton className="mx-3 mb-3 h-12 rounded-xl md:hidden" />
                    </div>
                    <div className="hidden md:flex w-96 lg:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-300 dark:border-slate-800 flex-col min-h-0 shrink-0">
                        <div className="p-3.5 border-b border-slate-300 dark:border-slate-800 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-full rounded-lg" /></div>
                        <div className="flex-1 p-4 space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-xl" />
                            ))}
                        </div>
                        <div className="border-t border-slate-300 dark:border-slate-800 p-4 space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                    </div>
                </div>
            ),
            noPadding: true,
        };
    }
    return null;
}

let cachedActiveCount = 0;
let activeCountFetchedAt = 0;

export default function AuthenticatedLayout({ header, pageTitle, noPadding = false, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [navigatingDestination, setNavigatingDestination] = useState(null);
    const { url, props } = usePage(); 
    const locale = props.app_settings?.locale || 'id';

    useEffect(() => {
        // Dialog portals also need the admin icon styling.
        document.body.classList.add('admin-icons');
        return () => document.body.classList.remove('admin-icons');
    }, []);

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            if (event.detail.visit.async) return;
            try {
                setNavigatingDestination(getNavigationDestination(event.detail.visit, window.location.href));
            } catch {
                setNavigatingDestination(null);
            }
        });

        const removeFinish = router.on('finish', (event) => {
            if (!event.detail.visit.async) setNavigatingDestination(null);
        });

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);
    useEffect(() => setNavigatingDestination(null), [url]);

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

    // ── Pesanan yang masih perlu ditangani ──
    const [activeOrderCount, setActiveOrderCount] = useState(cachedActiveCount);

    useEffect(() => {
        if (!user.email_verified_at) return;
        const controller = new AbortController();
        let fetching = false;
        const fetchCount = async () => {
            if (document.hidden || fetching || Date.now() - activeCountFetchedAt < 10000) return;
            fetching = true;
            try {
                const res = await window.axios.get('/api/orders/active-count', { signal: controller.signal });
                if (controller.signal.aborted) return;
                cachedActiveCount = Number(res.data?.count ?? 0);
                activeCountFetchedAt = Date.now();
                setActiveOrderCount(cachedActiveCount);
            } catch { /* Keep the previous badge on temporary errors. */ }
            finally { fetching = false; }
        };
        fetchCount();
        const timer = setInterval(fetchCount, 10000);
        return () => { controller.abort(); clearInterval(timer); };
    }, [user.email_verified_at]);


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
    const destInfo = getDestinationInfo(navigatingDestination, locale);
    const activeUrl = new URL(navigatingDestination || url, 'http://localhost');
    const activePath = activeUrl.pathname;
    const activeCatalogGroup = activeUrl.searchParams.get('group');

    const isItemActive = (itemHref) => {
        if (!itemHref) return false;
        if (itemHref === '/dashboard' || itemHref.endsWith('/dashboard')) {
            return activePath === '/dashboard' || activePath === '/';
        }
        return activePath.startsWith(itemHref);
    };

    // Menu sections with role-based visibility
    const menuSections = [
        {
            label: getTranslation(locale, 'section_utama', 'UTAMA'),
            items: [
                { 
                    name: getTranslation(locale, 'dashboard', 'Dashboard'), 
                    icon: FiGrid, 
                    href: safeRoute('dashboard', '/dashboard'), 
                    active: isItemActive('/dashboard'),
                    roles: ['owner']
                },
                { 
                    name: getTranslation(locale, 'pos_kasir', 'POS Kasir'), 
                    icon: FiShoppingCart, 
                    href: safeRoute('pos.index', '/pos'), 
                    active: isItemActive('/pos'),
                    roles: ['owner', 'cashier']
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
                    active: isItemActive('/orders'),
                    roles: ['owner', 'cashier']
                },
                {
                    name: getTranslation(locale, 'menu_produk', 'Produk'),
                    icon: FiPackage,
                    href: safeRoute('products.index', '/products'),
                    active: (isItemActive('/products') && !activeCatalogGroup) || activePath.startsWith('/categories'),
                    roles: ['owner']
                },
                ...catalogGroups.map(([group, name]) => ({
                    name,
                    icon: FiPackage,
                    href: `${safeRoute('products.index', '/products')}?group=${group}`,
                    active: isItemActive('/products') && activeCatalogGroup === group,
                    roles: ['owner'],
                    nested: true,
                })),
                {
                    name: 'Data Motor',
                    icon: MotorIcon,
                    href: safeRoute('motorcycles.index', '/motorcycles'),
                    active: isItemActive('/motorcycles'),
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
                    active: isItemActive('/reports'),
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
                    active: isItemActive('/users'),
                    roles: ['owner']
                },
                { 
                    name: getTranslation(locale, 'pengaturan', 'Pengaturan'), 
                    icon: FiSettings, 
                    href: safeRoute('settings.index', '/settings'), 
                    active: isItemActive('/settings'),
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
        <div className="h-[100dvh] w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-200">

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
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <Link href={homeHref} className="flex items-center gap-3">
                        <ApplicationLogo className="w-12 h-16 shrink-0" />
                        <div>
                            <h1 className="text-lg font-heading font-black text-primaryDark dark:text-white tracking-tight leading-none">
                                {props.app_settings?.store_name || 'Motorku'}
                            </h1>
                            <p className="text-[10px] font-bold text-primary dark:text-accentYellow uppercase tracking-widest mt-1 max-w-[160px] truncate" title={props.app_settings?.store_tagline ?? 'POS & ORDER'}>{props.app_settings?.store_tagline ?? 'POS & ORDER'}</p>
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
                                            className={`flex items-center gap-3 -mx-3 ${item.nested ? 'pl-10 pr-4 py-2 text-xs' : 'px-6 py-2.5'} transition-colors font-semibold text-[13px] ${
                                                item.active 
                                                    ? 'bg-primary text-white border-l-4 border-[#FFF200] font-bold'
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent'
                                            }`}
                                        >
                                            <Icon size={17} className={item.active ? 'text-[#FFF200]' : 'text-slate-400 dark:text-slate-500'} strokeWidth={2.2} />
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
                        <p className="font-semibold text-slate-500 dark:text-slate-400">© 2026 Motorku</p>
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

                        <h2 className="text-lg sm:text-xl font-heading font-black text-primaryDark dark:text-white tracking-tight">
                            {destInfo?.title || pageTitle || header || getTranslation(locale, 'dashboard', 'Dashboard')}
                        </h2>
                    </div>

                    {/* Right Action Icons */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        {/* Notification Bell Badge */}
                        <Link
                            href="/orders?status=action"
                            title={activeOrderCount > 0
                                ? `${activeOrderCount} pesanan perlu ditangani`
                                : 'Notifikasi Pesanan'}
                            aria-label={activeOrderCount > 0 ? `${activeOrderCount} pesanan perlu ditangani` : 'Notifikasi Pesanan'}
                            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center shrink-0"
                        >
                            <FiBell size={19} className={activeOrderCount > 0 ? 'text-amber-500 dark:text-amber-400' : ''} />
                            {activeOrderCount > 0 && (
                                <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-2xs">
                                    {activeOrderCount > 99 ? '99+' : activeOrderCount}
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
                                        <div className="w-10 h-10 rounded-lg bg-primary text-white font-black text-sm flex items-center justify-center border-2 border-primaryDark shadow-xs">
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
                <main className={`flex-1 min-h-0 ${(destInfo ? (destInfo.noPadding ?? false) : noPadding) ? 'p-0 flex flex-col overflow-hidden' : 'p-6 lg:p-8 overflow-y-auto'}`}>
                    {destInfo ? destInfo.component : children}
                </main>
                <Toaster position="top-right" richColors closeButton />
            </div>
        </div>
    );
}
