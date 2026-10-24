import PageSkeleton, { resolvePageSkeleton } from '@/Loading/pageSkeletons';
import { useEffect, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import SidebarMenuGroup from '@/Components/Admin/SidebarMenuGroup';
import Dropdown from '@/Components/Dropdown';
import NotificationCenter from '@/Components/NotificationCenter';
import { Link, usePage, router } from '@inertiajs/react';
import { toast, Toaster } from 'sonner';
import { getTranslation } from '@/i18n/translations';
import { getNavigationDestination } from '@/Utils/navigation';
import { catalogGroupLabels } from '@/Utils/catalogGroupLabels';
import { referenceModules } from '@/Navigation/referenceModules';
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
    FiBookOpen,
    FiChevronDown
} from 'react-icons/fi';

function getDestinationInfo(url, locale = 'id', catalogGroups = [], references = []) {
    if (!url) return null;
    const destination = new URL(url, 'http://localhost');
    const definition = resolvePageSkeleton(destination.pathname);
    if (!definition) return null;
    let title = definition.title[locale === 'en' ? 1 : 0];
    if (definition.key === 'products') title = catalogGroups.find(([group]) => group === destination.searchParams.get('group'))?.[1] || title;
    if (definition.key === 'motorcycles' || definition.key === 'references') title = references.find(module => module.path === destination.pathname)?.name || title;
    return { title, component: <PageSkeleton name={definition.key} />, noPadding: Boolean(definition.noPadding) };
}

export default function AuthenticatedLayout({ header, pageTitle, noPadding = false, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [navigatingDestination, setNavigatingDestination] = useState(null);
    const { url, props } = usePage(); 
    const locale = props.app_settings?.locale || 'id';
    const catalogGroups = Object.entries(props.catalog_groups ?? catalogGroupLabels);
    const availableReferences = props.reference_modules ?? referenceModules;

    useEffect(() => {
        // Dialog portals also need the admin icon styling.
        document.body.classList.add('admin-icons');
        document.documentElement.classList.add('admin-viewport');
        window.scrollTo(0, 0);
        return () => {
            document.body.classList.remove('admin-icons');
            document.documentElement.classList.remove('admin-viewport');
        };
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
    const [activeOrderCount, setActiveOrderCount] = useState(0);


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
    const destInfo = getDestinationInfo(navigatingDestination, locale, catalogGroups, availableReferences);
    const activeUrl = new URL(navigatingDestination || url, 'http://localhost');
    const activePath = activeUrl.pathname;
    const activeCatalogGroup = activeUrl.searchParams.get('group');
    const managingProducts = activePath === '/data-types' && activeUrl.searchParams.get('kind') !== 'reference';
    const managingReferences = activePath === '/data-types' && activeUrl.searchParams.get('kind') === 'reference';
    const catalogMenuIsActive = activePath.startsWith('/products') || activePath.startsWith('/categories') || managingProducts;

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
                    href: '/data-types?kind=product',
                    quickHref: safeRoute('products.index', '/products'),
                    current: managingProducts,
                    active: catalogMenuIsActive,
                    roles: ['owner'],
                    children: [
                        {
                            name: locale === 'en' ? 'All Products' : 'Semua Produk',
                            href: safeRoute('products.index', '/products'),
                            active: (isItemActive('/products') && !activeCatalogGroup) || activePath.startsWith('/categories'),
                        },
                        ...catalogGroups.map(([group, name]) => ({
                            name,
                            href: `${safeRoute('products.index', '/products')}?group=${group}`,
                            active: isItemActive('/products') && activeCatalogGroup === group,
                        })),
                    ],
                },
                {
                    name: locale === 'en' ? 'Reference Data' : 'Data Referensi',
                    icon: FiBookOpen,
                    href: '/data-types?kind=reference',
                    current: managingReferences,
                    active: availableReferences.some(module => isItemActive(module.path)) || managingReferences,
                    roles: ['owner'],
                    children: availableReferences.map(module => ({
                        name: module.name,
                        href: module.path,
                        active: isItemActive(module.path),
                    })),
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

    const quickNavPaths = ['/dashboard', '/pos', '/products', '/orders'];
    const quickNavItems = quickNavPaths.flatMap(path => visibleSections
        .flatMap(section => section.items)
        .map(item => item.quickHref ? { ...item, href: item.quickHref, active: activePath.startsWith('/products') || activePath.startsWith('/categories') } : item)
        .filter(item => {
            const destination = new URL(item.href, 'http://localhost');
            return destination.pathname === path && !destination.search;
        }));

    return (
        <div className="admin-workspace h-[100dvh] w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-200">

            {/* OVERLAY MOBILE */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* SIDEBAR NAVIGATION */}
            <aside className={`admin-sidebar fixed inset-y-0 left-0 bg-white dark:bg-slate-900 w-64 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-full lg:inset-auto flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* Brand Logo */}
                <div className="admin-brand p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <Link href={homeHref} className="flex items-center gap-3">
                        <ApplicationLogo className="w-10 h-10 shrink-0" />
                        <div>
                            <h1 className="text-lg font-heading font-black text-primaryDark dark:text-white tracking-tight leading-none">
                                {props.app_settings?.store_name || 'Motorku'}
                            </h1>
                            <p className="text-[10px] font-bold text-primary dark:text-accentYellow uppercase tracking-widest mt-1 max-w-[160px] truncate" title={props.app_settings?.store_tagline ?? 'POS & ORDER'}>{props.app_settings?.store_tagline ?? 'POS & ORDER'}</p>
                        </div>
                    </Link>

                    {/* Close button mobile */}
                    <button 
                        aria-label="Tutup menu navigasi"
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 lg:hidden"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Navigation Links — Scrollable */}
                <nav className="admin-navigation custom-scrollbar flex-1 overflow-y-auto p-3 space-y-5">
                    {visibleSections.map((section, sIndex) => (
                        <div key={sIndex}>
                            {/* Section Label */}
                            <p className="admin-nav-section px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {section.label}
                            </p>

                            {/* Section Items */}
                            <div className="space-y-0.5">
                                {section.items.map((item, iIndex) => {
                                    const Icon = item.icon;
                                    if (item.children) {
                                        return (
                                            <SidebarMenuGroup
                                                key={item.href}
                                                item={item}
                                                onNavigate={() => setIsSidebarOpen(false)}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={iIndex}
                                            href={item.href}
                                            aria-current={item.active ? 'page' : undefined}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`admin-nav-link flex items-center gap-3 px-6 py-2.5 transition-colors font-semibold text-[13px] ${
                                                item.active 
                                                    ? 'admin-nav-link--active font-bold'
                                                    : 'text-slate-600 dark:text-slate-300'
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
                <div className="admin-sidebar-footer p-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5 shrink-0">

                    <Link
                        href={safeRoute('logout', '/logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center gap-3 -mx-3 px-6 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-colors text-left"
                    >
                        <FiLogOut size={17} className="text-slate-400 dark:text-slate-500" />
                        <span>{getTranslation(locale, 'logout', 'Keluar')}</span>
                    </Link>

                    <div className="pt-2.5 mt-1.5 border-t border-slate-100 dark:border-slate-800 px-3 text-[10px] text-slate-400 dark:text-slate-500 space-y-1">
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
                <header className="admin-topbar h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-20 transition-colors duration-200">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Buka menu navigasi"
                            className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
                        >
                            <FiMenu size={22} strokeWidth={2.5} />
                        </button>

                        <h2 className="admin-location min-w-0 break-words text-base leading-5 sm:text-xl sm:leading-7 font-heading font-black text-primaryDark dark:text-white tracking-tight">
                            {destInfo?.title || pageTitle || header || getTranslation(locale, 'dashboard', 'Dashboard')}
                        </h2>
                    </div>

                    {/* Right Action Icons */}
                    <div className="admin-account-actions flex shrink-0 items-center gap-1 sm:gap-1.5">
                        {/* Notification Bell Badge */}
                        <NotificationCenter user={user} roles={userRoles} onActiveOrderCountChange={setActiveOrderCount} timezone={props.app_settings?.timezone} />

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
                                <button type="button" aria-label={`Menu profil ${user.name}`} className="admin-profile-trigger flex items-center gap-2 px-1 py-1 sm:px-2 rounded-lg transition">
                                    {user.avatar ? (
                                        <img 
                                            src={'/storage/' + user.avatar} 
                                            alt={user.name} 
                                            className="admin-profile-avatar w-8 h-8 shrink-0 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="admin-profile-avatar admin-profile-initial w-8 h-8 shrink-0 rounded-full text-sm font-semibold flex items-center justify-center">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <div className="admin-profile-identity hidden sm:block min-w-0 text-left">
                                        <p className="truncate text-xs font-semibold leading-4" title={user.name}>{user.name}</p>
                                        <p className="text-[11px] leading-4 capitalize">{userRoles[0] || 'Staff'}</p>
                                    </div>
                                    <FiChevronDown size={14} className="hidden sm:block shrink-0" aria-hidden="true" />
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content align="right" width="auto" className="admin-profile-menu" contentClasses="admin-profile-menu-content">
                                <div className="admin-profile-menu-heading px-4 py-3 border-b">
                                    <p className="text-sm font-semibold break-words">{user.name}</p>
                                    <p className="text-xs break-all">{user.email}</p>
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
                <main className={`admin-main flex-1 min-h-0 ${(destInfo ? (destInfo.noPadding ?? false) : noPadding) ? 'p-0 flex flex-col overflow-hidden' : 'p-3 sm:p-6 lg:p-8 overflow-y-auto'}`}>
                    {destInfo ? destInfo.component : children}
                </main>
                <nav className="admin-mobile-dock" aria-label="Navigasi cepat" style={{ gridTemplateColumns: `repeat(${quickNavItems.length}, minmax(0, 1fr))` }}>
                    {quickNavItems.map(item => {
                        const Icon = item.icon;
                        const destination = new URL(item.href, 'http://localhost');
                        const active = item.active;
                        return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`admin-dock-item ${active ? 'admin-dock-item--active' : ''}`}>
                            <Icon size={18} aria-hidden="true" />
                            <span>{destination.pathname === '/pos'
                                ? (locale === 'en' ? 'POS' : 'Kasir')
                                : destination.pathname === '/orders'
                                    ? (locale === 'en' ? 'Orders' : 'Pesanan')
                                    : item.name}</span>
                        </Link>;
                    })}
                </nav>
                <Toaster position="top-right" richColors closeButton />
            </div>
        </div>
    );
}
