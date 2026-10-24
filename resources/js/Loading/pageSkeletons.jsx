import DashboardSkeleton from '@/Components/Skeletons/DashboardSkeleton';
import OrderTableSkeleton from '@/Components/Skeletons/OrderTableSkeleton';
import OrderShowSkeleton from '@/Components/Skeletons/OrderShowSkeleton';
import ProductTableSkeleton from '@/Components/Skeletons/ProductTableSkeleton';
import ReportSkeleton from '@/Components/Skeletons/ReportSkeleton';
import UserTableSkeleton from '@/Components/Skeletons/UserTableSkeleton';
import SettingSkeleton from '@/Components/Skeletons/SettingSkeleton';
import MotorcyclePageSkeleton from '@/Components/Skeletons/MotorcyclePageSkeleton';
import ProfileSkeleton from '@/Components/Skeletons/ProfileSkeleton';
import PosPageSkeleton from '@/Components/Skeletons/PosPageSkeleton';
import SupplierSkeleton from '@/Components/Skeletons/SupplierSkeleton';
import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';

function DataTypeSkeleton() {
    return <SkeletonWrapper className="mx-auto w-full max-w-5xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-64 max-w-full" />{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-xl" />)}</SkeletonWrapper>;
}

function ReferenceSkeleton() {
    return <SkeletonWrapper className="mx-auto w-full max-w-7xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full max-w-md" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="admin-surface space-y-3 border border-slate-200 p-4 dark:border-slate-800"><Skeleton className="h-40 w-full" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-1/2" /></div>)}</div></SkeletonWrapper>;
}

export const loadingPages = [
    { key: 'suppliers', pages: ['Supplier/Index'], path: '/suppliers', title: ['Supplier', 'Suppliers'], noPadding: true, component: SupplierSkeleton },
    { key: 'data-types', pages: ['DataType/Index'], path: '/data-types', title: ['Kelola Jenis', 'Manage Types'], component: DataTypeSkeleton },
    { key: 'references', pages: ['Reference/Index'], path: '/references/', prefix: true, title: ['Data Referensi', 'Reference Data'], component: ReferenceSkeleton },
    { key: 'orders', pages: ['Order/Index'], path: '/orders', title: ['Daftar Pesanan', 'Orders List'], noPadding: true, component: OrderTableSkeleton },
    { key: 'order-detail', pages: ['Order/Show'], path: '/orders/', prefix: true, title: ['Detail Pesanan', 'Order Detail'], component: OrderShowSkeleton },
    { key: 'users', pages: ['User/Index'], path: '/users', prefix: true, title: ['Kelola Staf', 'Staff Management'], component: UserTableSkeleton, props: { fullPage: true } },
    { key: 'products', pages: ['Product/Index'], path: '/products', aliases: ['/categories'], prefix: true, title: ['Produk', 'Products'], noPadding: true, component: ProductTableSkeleton, props: { fullPage: true }, storageKey: 'product_view_mode_v2', views: ['list', 'grid', 'book'] },
    { key: 'reports', pages: ['Report/Index'], path: '/reports', prefix: true, title: ['Laporan Keuangan', 'Financial Reports'], component: ReportSkeleton },
    { key: 'settings', pages: ['Setting/Index'], path: '/settings', prefix: true, title: ['Pengaturan', 'Settings'], component: SettingSkeleton },
    { key: 'motorcycles', pages: ['Motorcycle/Index'], path: '/motorcycles', prefix: true, title: ['Motor', 'Motor'], noPadding: true, component: MotorcyclePageSkeleton },
    { key: 'profile', pages: ['Profile/Edit'], path: '/profile', prefix: true, title: ['Pengaturan Profil', 'My Profile'], component: ProfileSkeleton },
    { key: 'dashboard', pages: ['Dashboard/Owner/Index'], path: '/dashboard', title: ['Dashboard', 'Dashboard'], component: DashboardSkeleton },
    { key: 'pos', pages: ['POS/Index'], path: '/pos', prefix: true, title: ['POS Kasir', 'POS'], noPadding: true, component: PosPageSkeleton, storageKey: 'pos_view_mode', views: ['list', 'grid', 'book'] },
];

export function resolvePageSkeleton(path) {
    const normalized = path.replace(/\/+$/, '') || '/';
    return loadingPages.find(page => [page.path, ...(page.aliases || [])].some(candidate => page.prefix ? normalized.startsWith(candidate) : normalized === candidate));
}

export default function PageSkeleton({ name, view }) {
    const definition = loadingPages.find(page => page.key === name);
    if (!definition) return null;
    let selectedView = view;
    if (!selectedView && definition.storageKey && typeof window !== 'undefined') {
        try { selectedView = localStorage.getItem(definition.storageKey); } catch {}
    }
    selectedView = definition.views?.includes(selectedView) ? selectedView : (definition.views?.[0] || 'default');
    const Component = definition.component;
    return <div className="contents" data-page-skeleton={name} data-skeleton-view={selectedView}><Component {...definition.props} viewMode={selectedView} mode={selectedView} /></div>;
}
