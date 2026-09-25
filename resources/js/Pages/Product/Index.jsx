import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProductTableSkeleton from '@/Components/Skeletons/ProductTableSkeleton';
import { Head, router, usePage } from '@inertiajs/react';
import { getProductImage } from '@/Utils/productImage';
import { getTranslation } from '@/i18n/translations';
import axios from 'axios';
import { toast } from 'sonner';
import { 
    FiPlus, 
    FiEdit2, 
    FiTrash2, 
    FiChevronDown, 
    FiChevronLeft,
    FiChevronRight,
    FiX, 
    FiCheck, 
    FiPackage,
    FiSearch,
    FiAlertTriangle,
    FiGrid,
    FiList,
    FiFilter,
    FiFolder
} from 'react-icons/fi';



export default function MenuManagement({ 
    initialProducts = [], 
    initialCategories = [], 
    filters = {}, 
    lowStockCount = 0, 
    outOfStockCount = 0 
}) {
    const { props } = usePage();
    const locale = props.app_settings?.locale || 'id';
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'
    const [isNavigating, setIsNavigating] = useState(false);
    const skeletonParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('skeleton') : null;

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            const rawUrl = event?.detail?.visit?.url;
            let targetPath = '';
            if (typeof rawUrl === 'string') {
                targetPath = new URL(rawUrl, window.location.origin).pathname;
            } else if (rawUrl?.pathname) {
                targetPath = rawUrl.pathname;
            }
            if (targetPath && (targetPath.startsWith('/products') || targetPath.startsWith('/categories'))) {
                setIsNavigating(true);
            }
        });
        const removeFinish = router.on('finish', () => setIsNavigating(false));
        return () => { removeStart(); removeFinish(); };
    }, []);

    const extractPaginator = (raw) => {
        if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray(raw.data)) {
            return raw;
        }
        const list = Array.isArray(raw) ? raw : [];
        return { data: list, current_page: 1, last_page: 1, total: list.length, per_page: 16 };
    };

    const paginator = extractPaginator(initialProducts);

    const formatProducts = (rawProducts) => {
        const list = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);
        return list.map(p => {
            const catName = p.category ? p.category.name : 'Umum';
            return {
                id: p.id,
                sku: p.sku || '',
                brand: p.brand || '',
                rack_location: p.rack_location || '',
                name: p.name,
                subtitle: p.description || '',
                category_id: p.category_id,
                category: catName,
                cost_price: p.cost_price == null ? null : Number(p.cost_price),
                price: Number(p.price),
                stock: p.stock || 0,
                minimum_stock: p.minimum_stock || 0,
                status: p.is_available ? 'Active' : 'Inactive',
                image: getProductImage(p.image_path, catName)
            };
        });
    };

    const formatCategories = (rawCats) => {
        if (!rawCats || rawCats.length === 0) return [];
        return rawCats.map(c => {
            const childrenFormatted = c.children ? c.children.map(child => ({
                id: child.id,
                name: child.name,
                description: child.description || '',
                count: child.products_count !== undefined ? child.products_count : 0
            })) : [];
            const childProductSum = childrenFormatted.reduce((acc, ch) => acc + (ch.count || 0), 0);
            const subDesc = childrenFormatted.length > 0 ? childrenFormatted.map(ch => ch.name).join(', ') : '';

            return {
                id: c.id,
                name: c.name,
                description: c.description || subDesc,
                count: (c.products_count !== undefined ? c.products_count : 0) + childProductSum,
                children: childrenFormatted
            };
        });
    };

    const [items, setItems] = useState(formatProducts(initialProducts));
    const [categories, setCategories] = useState(formatCategories(initialCategories));

    useEffect(() => {
        if (initialProducts) {
            setItems(formatProducts(initialProducts));
        }
        if (initialCategories) {
            setCategories(formatCategories(initialCategories));
        }
    }, [initialProducts, initialCategories]);

    const currentPage = paginator.current_page || 1;
    const totalPages = paginator.last_page || 1;
    const totalProducts = paginator.total !== undefined ? paginator.total : items.length;
    const perPage = paginator.per_page || 16;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(filters.category || 'All');
    const [selectedStockFilter, setSelectedStockFilter] = useState(filters.stock_status || 'all');
    const [categorySearch, setCategorySearch] = useState('');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');
    const [statusFilter, setStatusFilter] = useState(filters.availability || 'all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState([]);

    const filteredCategories = categories.filter((c) => {
        if (!categorySearch.trim()) return true;
        const q = categorySearch.toLowerCase();
        if (c.name.toLowerCase().includes(q)) return true;
        if (c.description && c.description.toLowerCase().includes(q)) return true;
        return c.children && c.children.some((ch) => ch.name.toLowerCase().includes(q));
    });

    const [viewMode, setViewMode] = useState(() => {
        try {
            return localStorage.getItem('product_view_mode_v2') || 'list';
        } catch {
            return 'list';
        }
    });

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        try {
            localStorage.setItem('product_view_mode_v2', mode);
        } catch {}
    };

    const changeProductPage = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        router.get('/products', {
            page: newPage,
            category: selectedCategoryFilter === 'All' ? undefined : selectedCategoryFilter,
            search: searchQuery || undefined,
            stock_status: selectedStockFilter === 'all' ? undefined : selectedStockFilter,
            availability: statusFilter === 'all' ? undefined : statusFilter,
            sort: selectedSort === 'latest' ? undefined : selectedSort
        }, { preserveState: true, preserveScroll: true });
    };

    const handleCategoryFilterChange = (cat) => {
        setSelectedCategoryFilter(cat);
        router.get('/products', {
            page: 1,
            category: cat === 'All' ? undefined : cat,
            search: searchQuery || undefined,
            stock_status: selectedStockFilter === 'all' ? undefined : selectedStockFilter,
            availability: statusFilter === 'all' ? undefined : statusFilter,
            sort: selectedSort === 'latest' ? undefined : selectedSort
        }, { preserveState: true, preserveScroll: true });
    };

    const handleStockFilterChange = (status) => {
        setSelectedStockFilter(status);
        router.get('/products', {
            page: 1,
            category: selectedCategoryFilter === 'All' ? undefined : selectedCategoryFilter,
            search: searchQuery || undefined,
            stock_status: status === 'all' ? undefined : status,
            availability: statusFilter === 'all' ? undefined : statusFilter,
            sort: selectedSort === 'latest' ? undefined : selectedSort
        }, { preserveState: true, preserveScroll: true });
    };

    const handleStatusFilterChange = (status) => {
        setStatusFilter(status);
        router.get('/products', {
            page: 1,
            category: selectedCategoryFilter === 'All' ? undefined : selectedCategoryFilter,
            search: searchQuery || undefined,
            stock_status: selectedStockFilter === 'all' ? undefined : selectedStockFilter,
            availability: status === 'all' ? undefined : status,
            sort: selectedSort === 'latest' ? undefined : selectedSort
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSortValueChange = (nextSort) => {
        setSelectedSort(nextSort);
        router.get('/products', {
            page: 1,
            category: selectedCategoryFilter === 'All' ? undefined : selectedCategoryFilter,
            search: searchQuery || undefined,
            stock_status: selectedStockFilter === 'all' ? undefined : selectedStockFilter,
            availability: statusFilter === 'all' ? undefined : statusFilter,
            sort: nextSort
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSortChange = (field) => {
        handleSortValueChange(selectedSort === `${field}_asc` ? `${field}_desc` : `${field}_asc`);
    };

    // Search yang di-debounce → refetch dari server agar mencari SEMUA produk
    const categoryFilterRef = useRef(selectedCategoryFilter);
    useEffect(() => { categoryFilterRef.current = selectedCategoryFilter; }, [selectedCategoryFilter]);

    const stockFilterRef = useRef(selectedStockFilter);
    useEffect(() => { stockFilterRef.current = selectedStockFilter; }, [selectedStockFilter]);

    const isFirstSearchRender = useRef(true);
    useEffect(() => {
        if (isFirstSearchRender.current) {
            isFirstSearchRender.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/products', {
                page: 1,
                category: categoryFilterRef.current === 'All' ? undefined : categoryFilterRef.current,
                search: searchQuery || undefined,
                stock_status: stockFilterRef.current === 'all' ? undefined : stockFilterRef.current,
                availability: statusFilter === 'all' ? undefined : statusFilter,
                sort: selectedSort === 'latest' ? undefined : selectedSort
            }, { preserveState: true, preserveScroll: true });
        }, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // Stock Adjustment Modal State (Kulakan / Barang Masuk / Opname)
    const [selectedProductForAdjust, setSelectedProductForAdjust] = useState(null);
    const [adjustForm, setAdjustForm] = useState({ type: 'stock_in', quantity: '', note: '' });
    const [adjustLoading, setAdjustLoading] = useState(false);

    const openAdjustModal = (product) => {
        setSelectedProductForAdjust(product);
        setAdjustForm({ type: 'stock_in', quantity: '', note: '' });
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        const qty = parseInt(adjustForm.quantity, 10);
        if (isNaN(qty) || qty < (adjustForm.type === 'adjustment' ? 0 : 1)) {
            toast.error(adjustForm.type === 'adjustment' ? 'Stok fisik tidak boleh negatif.' : 'Jumlah kuantitas wajib diisi minimal 1 unit.');
            return;
        }

        setAdjustLoading(true);
        try {
            await axios.post('/api/inventory', {
                product_id: selectedProductForAdjust.id,
                type: adjustForm.type,
                quantity: qty,
                note: adjustForm.note || null
            });

            // Optimistic in-place update of product stock
            setItems(prev => prev.map(p => {
                if (p.id !== selectedProductForAdjust.id) return p;
                let newStock = Number(p.stock);
                if (adjustForm.type === 'stock_in') newStock += qty;
                else if (adjustForm.type === 'stock_out') newStock = Math.max(0, newStock - qty);
                else newStock = qty;
                return { ...p, stock: newStock };
            }));

            const typeLabels = {
                stock_in: `ditambah +${qty} unit (Stok Masuk / Kulakan)`,
                stock_out: `dikurangi -${qty} unit (Stok Keluar)`,
                adjustment: `disesuaikan menjadi ${qty} unit (Opname Fisik)`
            };
            toast.success(`Stok "${selectedProductForAdjust.name}" berhasil ${typeLabels[adjustForm.type] || 'diperbarui'}!`);
            setSelectedProductForAdjust(null);
            router.reload({ only: ['initialProducts', 'lowStockCount', 'outOfStockCount'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mencatat penyesuaian stok');
        } finally {
            setAdjustLoading(false);
        }
    };

    // Loading State
    const [isLoading, setIsLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Product Image Lightbox State
    const [previewProduct, setPreviewProduct] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && previewProduct) {
                setPreviewProduct(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewProduct]);

    // Accordion & Status Filters
    const [expandedRows, setExpandedRows] = useState([]);

    const toggleRowExpand = (id) => {
        setExpandedRows(prev => 
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    // Product Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [productFormData, setProductFormData] = useState({
        sku: '',
        brand: '',
        rack_location: '',
        name: '',
        subtitle: '',
        category_id: '',
        cost_price: '',
        price: '',
        stock: '0',
        minimum_stock: '3',
        status: 'Active',
        image: '',
        imageFile: null,
        imagePreview: null
    });

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '', sub_categories: [] });

    // Handlers for Products
    const openAddProductModal = () => {
        setEditingItem(null);
        setProductFormData({
            sku: 'SKU' + Date.now().toString().slice(-6),
            brand: '',
            rack_location: '',
            name: '',
            subtitle: '',
            category_id: categories[0]?.id || '',
            cost_price: '',
            price: '',
            stock: '0',
            minimum_stock: '3',
            status: 'Active',
            image: '',
            imageFile: null,
            imagePreview: null
        });
        setIsProductModalOpen(true);
    };

    const openEditProductModal = (item) => {
        setEditingItem(item);
        setProductFormData({
            sku: item.sku,
            brand: item.brand || '',
            rack_location: item.rack_location || '',
            name: item.name,
            subtitle: item.subtitle,
            category_id: item.category_id,
            cost_price: item.cost_price ?? '',
            price: item.price,
            stock: String(item.stock ?? 0),
            minimum_stock: String(item.minimum_stock ?? 3),
            status: item.status,
            image: item.image,
            imageFile: null,
            imagePreview: item.image
        });
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const fd = new FormData();
        fd.append('sku', productFormData.sku || ('SKU' + Date.now()));
        fd.append('brand', productFormData.brand || '');
        fd.append('rack_location', productFormData.rack_location || '');
        fd.append('name', productFormData.name);
        fd.append('description', productFormData.subtitle || '');
        fd.append('category_id', productFormData.category_id || (categories[0]?.id));
        fd.append('cost_price', productFormData.cost_price === '' ? '' : String(parseFloat(productFormData.cost_price)));
        fd.append('price', String(parseFloat(productFormData.price) || 0));
        if (!editingItem) fd.append('stock', productFormData.stock !== '' ? String(parseInt(productFormData.stock, 10)) : '0');
        fd.append('minimum_stock', productFormData.minimum_stock !== '' ? String(parseInt(productFormData.minimum_stock, 10)) : '3');
        fd.append('is_available', productFormData.status === 'Active' ? '1' : '0');
        if (productFormData.imageFile) {
            fd.append('image', productFormData.imageFile);
        }

        try {
            if (editingItem) {
                fd.append('_method', 'PUT');
                await axios.post(`/api/products/${editingItem.id}`, fd);
                toast.success(`Data produk "${productFormData.name}" berhasil diperbarui!`);
            } else {
                await axios.post('/api/products', fd);
                toast.success(`Produk "${productFormData.name}" berhasil ditambahkan!`);
            }
            router.reload({ preserveScroll: true });
            setIsProductModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan produk');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProduct = (item) => {
        setDeleteTarget({ type: 'product', id: item.id, name: item.name });
    };

    // Handlers for Categories
    const openAddCategoryModal = () => {
        setEditingCategory(null);
        setCategoryFormData({ name: '', description: '', sub_categories: [] });
        setIsCategoryModalOpen(true);
    };

    const openEditCategoryModal = (cat) => {
        setEditingCategory(cat);
        setCategoryFormData({
            name: cat.name,
            description: cat.description || '',
            sub_categories: (cat.children || []).map(ch => ({ id: ch.id, name: ch.name }))
        });
        setIsCategoryModalOpen(true);
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            name: categoryFormData.name,
            description: categoryFormData.description,
            sub_categories: (categoryFormData.sub_categories || [])
                .map(s => ({ id: s.id, name: s.name.trim() }))
                .filter(s => s.name.length > 0)
        };

        try {
            if (editingCategory) {
                await axios.put(`/api/categories/${editingCategory.id}`, payload);
                toast.success(`Kategori "${payload.name}" berhasil diperbarui!`);
            } else {
                await axios.post('/api/categories', payload);
                toast.success(`Kategori "${payload.name}" berhasil ditambahkan!`);
            }
            router.reload({ preserveScroll: true });
            setIsCategoryModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan kategori');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = (cat) => {
        setDeleteTarget({ type: 'category', id: cat.id, name: cat.name });
    };

    const executeDeleteTarget = async () => {
        if (!deleteTarget) return;
        setIsLoading(true);
        try {
            if (deleteTarget.type === 'product') {
                await axios.delete(`/api/products/${deleteTarget.id}`);
                toast.success(`Produk "${deleteTarget.name}" berhasil dihapus!`);
            } else if (deleteTarget.type === 'category') {
                await axios.delete(`/api/categories/${deleteTarget.id}`);
                toast.success(`Kategori "${deleteTarget.name}" berhasil dihapus!`);
            }
            router.reload({ preserveScroll: true });
        } catch (err) {
            toast.error(err.response?.data?.message || `Gagal menghapus ${deleteTarget.type}`);
        } finally {
            setIsLoading(false);
            setDeleteTarget(null);
        }
    };

    // The server applies filters and sorting before pagination.
    const filteredItems = items;

    return (
        <AuthenticatedLayout pageTitle={getTranslation(locale, 'menu_produk', 'Menu & Produk')} noPadding={true}>
            <Head title={`${locale === 'en' ? 'Products & Stock' : 'Produk & Stok'}`}>
                <meta name="description" content="Kelola katalog produk sparepart, oli, aki, ban, harga, dan ketersediaan stok Motorku." />
            </Head>

            <div className="p-0 sm:p-4 lg:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* UNIFIED PRODUCT MANAGEMENT CONTAINER */}
                <div className="bg-white dark:bg-slate-900 sm:rounded-xl sm:border border-slate-200 dark:border-slate-800 sm:shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
                    {/* Compact Header & Filter Section */}
                    <div className="p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
                        {/* Top Row: Title, Badge, Tabs & Action */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {/* Left: Title + Badge + Tabs */}
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight shrink-0">
                                    {activeTab === 'products' ? 'Daftar Produk' : 'Kategori Produk'}
                                </h1>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                                    {activeTab === 'products' ? totalProducts : categories.length}
                                </span>

                            </div>

                            {/* Compact Tab Switcher */}
                            <div className="order-3 flex w-full gap-3 border-b border-slate-100 dark:border-slate-800 text-xs sm:order-none sm:w-auto sm:border-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('products')}
                                        className={`border-b-2 px-1 py-1 text-xs font-bold transition cursor-pointer ${
                                            activeTab === 'products'
                                                ? 'border-primary text-primary dark:text-accentYellow'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        Produk
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('categories')}
                                        className={`border-b-2 px-1 py-1 text-xs font-bold transition cursor-pointer ${
                                            activeTab === 'categories'
                                                ? 'border-primary text-primary dark:text-accentYellow'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        Kategori ({categories.length})
                                    </button>
                            </div>

                            {/* Right: Action Button */}
                            <div className="ml-auto flex items-center gap-2 shrink-0">
                                {activeTab === 'products' ? (
                                    <button
                                        type="button"
                                        onClick={openAddProductModal}
                                        className="px-2.5 sm:px-3.5 py-1.5 bg-primary hover:bg-primaryDark active:scale-95 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <FiPlus size={15} />
                                        <span className="hidden sm:inline">Tambah Produk</span><span className="sm:hidden">Tambah</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={openAddCategoryModal}
                                        className="px-2.5 sm:px-3.5 py-1.5 bg-primary hover:bg-primaryDark active:scale-95 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <FiPlus size={15} />
                                        <span className="hidden sm:inline">Tambah Kategori</span><span className="sm:hidden">Tambah</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Low Stock Alert Banner */}
                        {(lowStockCount > 0 || outOfStockCount > 0) && activeTab === 'products' && (
                            <div className="flex items-center justify-between gap-2 border-l-2 border-amber-400 pl-2 text-[11px] sm:text-xs">
                                <div className="flex min-w-0 items-center gap-1.5 text-amber-800 dark:text-amber-200 font-semibold">
                                    <FiAlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={14} />
                                    <span>
                                        {[lowStockCount > 0 && `${lowStockCount} perlu kulak`, outOfStockCount > 0 && `${outOfStockCount} stok habis`].filter(Boolean).join(' · ')}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleStockFilterChange(selectedStockFilter === (lowStockCount > 0 ? 'low' : 'out') ? 'all' : (lowStockCount > 0 ? 'low' : 'out'))}
                                    className="shrink-0 text-amber-700 dark:text-amber-300 font-bold hover:underline cursor-pointer"
                                >
                                    {selectedStockFilter === (lowStockCount > 0 ? 'low' : 'out') ? 'Semua' : 'Lihat'}
                                </button>
                            </div>
                        )}

                        {/* Filter Bar (Search + Dropdown Kategori + Dropdown Status Stok + Status Segmented Button) */}
                        {activeTab === 'products' && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-2.5">
                                {/* Left: Search input + Category Dropdown + Stock Status Dropdown */}
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 flex-1 max-w-2xl">
                                    {/* Search Input */}
                                    <div className="relative flex-1 min-w-0 sm:min-w-[180px]">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Cari nama atau SKU..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-7 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition sm:shadow-2xs"
                                        />
                                        {searchQuery && (
                                             <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer">
                                                 <FiX size={13} />
                                             </button>
                                         )}
                                     </div>

                                     <button
                                         type="button"
                                         onClick={() => setShowMobileFilters(value => !value)}
                                         aria-expanded={showMobileFilters}
                                         className="sm:hidden inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                                     >
                                         <FiFilter size={14} /> Filter
                                         {(selectedCategoryFilter !== 'All' || selectedStockFilter !== 'all' || statusFilter !== 'all' || selectedSort !== 'latest') && (
                                             <span className="text-primary dark:text-accentYellow">{Number(selectedCategoryFilter !== 'All') + Number(selectedStockFilter !== 'all') + Number(statusFilter !== 'all') + Number(selectedSort !== 'latest')}</span>
                                         )}
                                     </button>

                                     {/* Category Dropdown */}
                                     <div className={`relative w-[calc(50%-0.1875rem)] sm:w-44 sm:shrink-0 ${showMobileFilters ? 'block' : 'hidden'} sm:block`}>
                                         <select
                                             value={selectedCategoryFilter}
                                             onChange={e => handleCategoryFilterChange(e.target.value)}
                                             aria-label="Filter kategori produk"
                                             className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg pl-2 sm:pl-3 pr-7 sm:pr-8 py-1.5 font-semibold sm:shadow-2xs focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 cursor-pointer"
                                         >
                                             <option value="All">Semua Kategori</option>
                                             {categories.map(c => (
                                                 <optgroup key={c.id} label={c.name}>
                                                     <option value={c.name}>Semua {c.name} ({c.count})</option>
                                                     {c.children && c.children.map(child => (
                                                         <option key={child.id} value={child.name}>{child.name} ({child.count})</option>
                                                     ))}
                                                 </optgroup>
                                             ))}
                                         </select>
                                         <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={14} />
                                     </div>

                                     {/* Stock Status Dropdown */}
                                     <div className={`relative w-[calc(50%-0.1875rem)] sm:w-40 sm:shrink-0 ${showMobileFilters ? 'block' : 'hidden'} sm:block`}>
                                         <select
                                             value={selectedStockFilter}
                                             onChange={e => handleStockFilterChange(e.target.value)}
                                             aria-label="Filter stok produk"
                                             className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg pl-2 sm:pl-3 pr-7 sm:pr-8 py-1.5 font-semibold sm:shadow-2xs focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 cursor-pointer"
                                         >
                                             <option value="all">Semua Stok</option>
                                             <option value="low">Perlu Kulak ({lowStockCount})</option>
                                             <option value="out">Stok Habis ({outOfStockCount})</option>
                                             <option value="normal">Stok Aman</option>
                                         </select>
                                         <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={14} />
                                     </div>

                                     {showMobileFilters && (
                                         <>
                                             <select
                                                 value={statusFilter}
                                                 onChange={e => handleStatusFilterChange(e.target.value)}
                                                 aria-label="Filter status POS"
                                                 className="sm:hidden w-[calc(50%-0.1875rem)] border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400"
                                             >
                                                 <option value="all">Semua Status</option>
                                                 <option value="active">Aktif di POS</option>
                                                 <option value="inactive">Nonaktif</option>
                                             </select>
                                             <select
                                                 value={selectedSort}
                                                 onChange={e => handleSortValueChange(e.target.value)}
                                                 aria-label="Urutkan produk"
                                                 className="sm:hidden w-[calc(50%-0.1875rem)] border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400"
                                             >
                                                 <option value="latest">Terbaru</option>
                                                 <option value="name_asc">Nama A–Z</option>
                                                 <option value="name_desc">Nama Z–A</option>
                                                 <option value="price_asc">Harga terendah</option>
                                                 <option value="price_desc">Harga tertinggi</option>
                                             </select>
                                         </>
                                     )}
                                 </div>

                                 {/* Right: Toggle View and Status Buttons */}
                                 <div className="hidden sm:flex flex-row items-center gap-2 self-start sm:self-auto shrink-0">
                                     {/* View Toggle */}
                                     <div className="inline-flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs">
                                         <button
                                             type="button"
                                             onClick={() => handleViewModeChange('grid')}
                                             className={`p-1.5 rounded-md transition cursor-pointer ${
                                                 viewMode === 'grid'
                                                     ? 'bg-primary text-white shadow-2xs'
                                                     : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                             }`}
                                             title="Tampilan Grid"
                                         >
                                             <FiGrid size={16} />
                                         </button>
                                         <button
                                             type="button"
                                             onClick={() => handleViewModeChange('list')}
                                             className={`p-1.5 rounded-md transition cursor-pointer ${
                                                 viewMode === 'list'
                                                     ? 'bg-primary text-white shadow-2xs'
                                                     : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                             }`}
                                             title="Tampilan List (Tabel)"
                                         >
                                             <FiList size={16} />
                                         </button>
                                     </div>

                                     <label className="sr-only" htmlFor="product-availability">Status di POS</label>
                                     <select
                                         id="product-availability"
                                         value={statusFilter}
                                         onChange={e => handleStatusFilterChange(e.target.value)}
                                         className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                     >
                                         <option value="all">Semua Status</option>
                                         <option value="active">Aktif di POS</option>
                                         <option value="inactive">Nonaktif</option>
                                     </select>
                            </div>
                        </div>
                    )}

                    {/* CATEGORY TAB UTILITY BAR */}
                    {activeTab === 'categories' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-0.5">
                            <div className="relative flex-1 max-w-md">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    placeholder="Cari nama kategori atau sub-kategori..."
                                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
                                />
                                {categorySearch && (
                                    <button
                                        type="button"
                                        onClick={() => setCategorySearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                                    >
                                        <FiX size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 self-end sm:self-auto">
                                <span>Menampilkan <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredCategories.length}</strong> kategori utama</span>
                            </div>
                        </div>
                    )}
                    </div>

                    {/* TAB 1: PRODUCTS TABLE WITH ACCORDION & IMAGES */}
                    {activeTab === 'products' && (
                        (isNavigating || skeletonParam) ? (
                            <ProductTableSkeleton viewMode={skeletonParam === 'grid' ? 'grid' : (skeletonParam === 'list' ? 'list' : viewMode)} />
                        ) : (
                        <>
                            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden md:overflow-x-auto">
                                {filteredItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                        <FiPackage className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                                        <p className="text-base font-extrabold text-slate-700 dark:text-slate-300">Tidak ada produk ditemukan</p>
                                        <p className="text-xs font-semibold mt-1">Coba ubah kata kunci pencarian atau filter status kamu.</p>
                                    </div>
                                ) : (
                                    <>
                                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredItems.map(item => {
                                            const isExpanded = expandedRows.includes(item.id);
                                            return (
                                                <article key={item.id} className="px-3 py-2.5">
                                                    <div className="flex items-start gap-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewProduct(item)}
                                                            className="w-11 h-11 shrink-0 rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center text-slate-300 dark:text-slate-600"
                                                            aria-label={`Lihat foto ${item.name}`}
                                                        >
                                                            {item.image ? <img src={item.image} alt="" className="w-full h-full object-contain" /> : <FiPackage size={18} />}
                                                        </button>
                                                        <button type="button" onClick={() => toggleRowExpand(item.id)} className="min-w-0 flex-1 text-left" aria-expanded={isExpanded}>
                                                            <span className="block line-clamp-2 text-xs font-bold leading-snug text-slate-900 dark:text-white">{item.name}</span>
                                                            <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">{item.sku || 'Tanpa SKU'} · {item.category}</span>
                                                        </button>
                                                        <button type="button" onClick={() => toggleRowExpand(item.id)} className="shrink-0 p-1 text-slate-400" aria-label={`Detail ${item.name}`} aria-expanded={isExpanded}>
                                                            {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                                                        </button>
                                                    </div>
                                                    <div className="mt-1.5 flex items-center justify-between gap-2 pl-[3.375rem] text-xs">
                                                        <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">Rp {Number(item.price).toLocaleString('id-ID')}</span>
                                                        <span className={`font-semibold whitespace-nowrap ${item.stock <= 0 ? 'text-rose-600' : item.stock <= (item.minimum_stock ?? 3) ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                            {item.stock <= 0 ? 'Stok habis' : item.stock <= (item.minimum_stock ?? 3) ? `${item.stock} pcs · Perlu kulak` : `${item.stock} pcs`}
                                                        </span>
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="mt-2 space-y-2 pl-[3.375rem] text-[11px] text-slate-600 dark:text-slate-300">
                                                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                                <span>Modal: {item.cost_price == null ? 'Belum diisi' : `Rp ${item.cost_price.toLocaleString('id-ID')}`}</span>
                                                                <span>Min. stok: {item.minimum_stock || 0}</span>
                                                                <span>POS: {item.status === 'Active' ? 'Aktif' : 'Nonaktif'}</span>
                                                            </div>
                                                            {item.subtitle && <p className="line-clamp-3">{item.subtitle}</p>}
                                                            <div className="flex items-center gap-3 pt-1 font-semibold">
                                                                <button type="button" onClick={() => openAdjustModal(item)} className="inline-flex items-center gap-1 text-primary dark:text-blue-300"><FiPlus size={14} /> Stok</button>
                                                                <button type="button" onClick={() => openEditProductModal(item)} className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200"><FiEdit2 size={13} /> Edit</button>
                                                                <button type="button" onClick={() => handleDeleteProduct(item)} className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400"><FiTrash2 size={13} /> Hapus</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </article>
                                            );
                                        })}
                                    </div>
                                    {viewMode === 'grid' ? (
                                    /* GRID VIEW */
                                    <div className="hidden md:grid grid-cols-[repeat(auto-fill,minmax(160px,180px))] gap-3 p-3 sm:p-4">
                                        {filteredItems.map(item => (
                                            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all flex flex-col relative group">
                                                {/* Image Container */}
                                                <div
                                                    className="relative w-full aspect-square bg-slate-50 dark:bg-slate-900 cursor-pointer overflow-hidden border-b border-slate-100 dark:border-slate-700"
                                                    onClick={(e) => { e.stopPropagation(); setPreviewProduct(item); }}
                                                >
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} loading="lazy" className="absolute inset-0 w-full h-full object-contain" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                            <FiPackage size={24} aria-label="Foto belum ada" />
                                                        </div>
                                                    )}

                                                    {/* Badges on Image */}
                                                    <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start z-10 pointer-events-none">
                                                        {item.stock <= 0 ? (
                                                            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-md shadow-xs whitespace-nowrap">Stok Habis</span>
                                                        ) : item.stock <= (item.minimum_stock ?? 3) ? (
                                                            <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-md shadow-xs whitespace-nowrap">Perlu Kulak ({item.stock})</span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {/* Card Content */}
                                                <div className="p-3 flex flex-col flex-1">
                                                    <div className="flex items-center gap-1.5 mb-1.5 text-[10px]">
                                                        <span className="text-slate-500 dark:text-slate-400 truncate max-w-full">
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 mb-2">
                                                        <h3
                                                            className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 hover:text-blue-600 cursor-pointer transition"
                                                            title={item.name}
                                                            onClick={() => openEditProductModal(item)}
                                                        >
                                                            {item.name}
                                                        </h3>
                                                        {item.sku && (
                                                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                                {item.sku}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="mt-auto">
                                                        <p className="font-black text-slate-900 dark:text-white text-[15px] sm:text-base">
                                                            Rp {Number(item.price).toLocaleString('id-ID')}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{item.stock} pcs · {item.status === 'Active' ? 'Aktif di POS' : 'Nonaktif'}</p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons Overlay or Footer */}
                                                <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 px-2 py-1.5 flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => openAdjustModal(item)}
                                                        className="flex items-center justify-center gap-1 flex-1 p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-[10px] sm:text-[11px] font-bold transition shadow-2xs cursor-pointer"
                                                        title="Tambah / Atur Stok"
                                                    >
                                                        <FiPlus size={12} /> <span className="hidden sm:inline">Stok</span>
                                                    </button>
                                                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditProductModal(item)}
                                                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                                        title="Edit Produk"
                                                    >
                                                        <FiEdit2 size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteProduct(item)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                                        title="Hapus Produk"
                                                    >
                                                        <FiTrash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <table className="hidden md:table w-full text-left border-collapse min-w-[900px]">
                                        {/* Table Header */}
                                        <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            <tr>
                                                <th className="w-8 pl-3 pr-0 py-2.5 text-center"></th>
                                                <th className="pl-2 pr-4 py-2.5 font-bold min-w-[260px]">
                                                    <button type="button" onClick={() => handleSortChange('name')} className="flex items-center gap-1.5 hover:text-blue-600" aria-label="Urutkan nama produk">
                                                        PRODUK <span className="text-slate-400 text-[10px]">{selectedSort === 'name_asc' ? '↑' : selectedSort === 'name_desc' ? '↓' : '↕'}</span>
                                                    </button>
                                                </th>
                                                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                                                    KATEGORI
                                                </th>
                                                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                                                    HARGA MODAL
                                                </th>
                                                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                                                    <button type="button" onClick={() => handleSortChange('price')} className="flex items-center gap-1.5 hover:text-blue-600" aria-label="Urutkan harga jual">
                                                        HARGA JUAL <span className="text-slate-400 text-[10px]">{selectedSort === 'price_asc' ? '↑' : selectedSort === 'price_desc' ? '↓' : '↕'}</span>
                                                    </button>
                                                </th>
                                                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                                                    STOK
                                                </th>
                                                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                                                    STATUS POS
                                                </th>
                                                <th className="w-28 px-4 py-2.5 text-center font-bold whitespace-nowrap">AKSI</th>
                                            </tr>
                                        </thead>

                                        {/* Table Body */}
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                            {filteredItems.map(item => {
                                                const isExpanded = expandedRows.includes(item.id);

                                                return (
                                                    <React.Fragment key={item.id}>
                                                        <tr 
                                                            className={`transition-colors ${
                                                                isExpanded ? 'bg-slate-50/90 dark:bg-slate-850' : 'hover:bg-slate-50/70 dark:hover:bg-slate-850/50'
                                                            }`}
                                                        >
                                                            {/* Expand Button */}
                                                            <td className="w-8 pl-3 pr-0 py-2.5 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleRowExpand(item.id)}
                                                                    className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition cursor-pointer"
                                                                >
                                                                    {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                                                                </button>
                                                            </td>

                                                            {/* Product Thumbnail & Name */}
                                                            <td className="pl-2 pr-4 py-2.5">
                                                                <div className="flex items-center gap-3">
                                                                    {/* Product Image Thumbnail - Clickable for Lightbox */}
                                                                    <button type="button"
                                                                        onClick={(e) => { e.stopPropagation(); setPreviewProduct(item); }}
                                                                        className="w-10 h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 cursor-pointer hover:border-blue-500 transition flex items-center justify-center text-slate-300 dark:text-slate-600"
                                                                        title={item.image ? 'Lihat foto produk' : 'Foto belum ada'}
                                                                    >
                                                                        {item.image ? (
                                                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain p-0.5" />
                                                                        ) : (
                                                                            <FiPackage size={17} className="opacity-50" />
                                                                        )}
                                                                    </button>

                                                                    {/* Name and subtitle */}
                                                                    <div className="min-w-0">
                                                                        <button type="button"
                                                                            onClick={() => toggleRowExpand(item.id)}
                                                                            className="font-semibold text-left text-slate-900 dark:text-white text-xs sm:text-sm block line-clamp-2 hover:text-blue-600 transition cursor-pointer"
                                                                            title={item.name}
                                                                        >
                                                                            {item.name}
                                                                        </button>
                                                                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">{item.sku || 'Tanpa SKU'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Kategori */}
                                                            <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                                {item.category}
                                                            </td>

                                                            {/* Harga Modal */}
                                                            <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                                {item.cost_price == null ? <span className="font-normal text-amber-700 dark:text-amber-400">Belum diisi</span> : `Rp ${item.cost_price.toLocaleString('id-ID')}`}
                                                            </td>

                                                            {/* Harga Jual */}
                                                            <td className="px-4 py-2.5 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                                                                Rp {Number(item.price).toLocaleString('id-ID')}
                                                            </td>

                                                            {/* Stok */}
                                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                                <span className={`font-semibold ${
                                                                    item.stock <= 0 
                                                                        ? 'text-rose-600 font-bold' 
                                                                        : item.stock <= (item.minimum_stock ?? 3)
                                                                            ? 'text-amber-500 font-bold' 
                                                                            : 'text-slate-700 dark:text-slate-300'
                                                                }`}>
                                                                    {item.stock <= 0 ? 'Habis' : item.stock <= (item.minimum_stock ?? 3) ? `Perlu Kulak (${item.stock})` : `${item.stock} pcs`}
                                                                </span>
                                                            </td>

                                                            {/* Status - Plain Text without Box & Dot */}
                                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                                {item.status === 'Active' ? (
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                        Aktif
                                                                    </span>
                                                                ) : (
                                                                    <span className="font-medium text-slate-400 dark:text-slate-500">
                                                                        Nonaktif
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Aksi */}
                                                            <td className="w-28 px-4 py-2.5 text-center whitespace-nowrap">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openAdjustModal(item)}
                                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition cursor-pointer"
                                                                        title="Tambah / Atur Stok"
                                                                    >
                                                                        <FiPlus size={15} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openEditProductModal(item)}
                                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                                                                        title="Edit Produk"
                                                                    >
                                                                        <FiEdit2 size={14} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteProduct(item)}
                                                                        className="p-1 text-red-500 hover:text-red-600 transition cursor-pointer"
                                                                        title="Hapus Produk"
                                                                    >
                                                                        <FiTrash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Accordion Detail Sub-panel */}
                                                        {isExpanded && (
                                                            <tr className="bg-slate-50/80 dark:bg-slate-850/70 border-b border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                                                                <td colSpan={8} className="p-4 sm:p-5">
                                                                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                                                                        {/* Product Image in Accordion */}
                                                                        <div 
                                                                            onClick={() => setPreviewProduct(item)}
                                                                            className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 hover:border-blue-500 transition shrink-0 shadow-2xs text-slate-300 dark:text-slate-600"
                                                                            title="Klik untuk melihat foto resolusi penuh"
                                                                        >
                                                                            {item.image ? (
                                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <FiPackage size={36} className="opacity-50" />
                                                                            )}
                                                                        </div>

                                                                        {/* Details Grid */}
                                                                        <div className="flex-1 space-y-2 text-xs">
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                                                <div>
                                                                                    <span className="text-slate-400 dark:text-slate-500 font-medium block">Grup / Kategori</span>
                                                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.category}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-slate-400 dark:text-slate-500 font-medium block">Monitor Persediaan</span>
                                                                                    <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                                                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Aktif ({item.stock} pcs tersedia)
                                                                                    </span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-slate-400 dark:text-slate-500 font-medium block">Batas Minimum Stok</span>
                                                                                    <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block">{item.minimum_stock || 0} pcs</span>
                                                                                </div>
                                                                            </div>

                                                                            {item.subtitle && (
                                                                                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                                                                    <span className="text-slate-400 dark:text-slate-500 font-medium block">Deskripsi / Catatan</span>
                                                                                    <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 leading-relaxed">{item.subtitle}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Quick Actions in Accordion */}
                                                                        <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-center">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openAdjustModal(item)}
                                                                                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-md border border-blue-200 dark:border-blue-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                                            >
                                                                                <FiPlus size={13} /> Atur Stok
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openEditProductModal(item)}
                                                                                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                                            >
                                                                                <FiEdit2 size={13} /> Edit
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteProduct(item)}
                                                                                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                                            >
                                                                                <FiTrash2 size={13} /> Hapus
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    )}
                                    </>
                                )}
                            </div>

                            {/* Pinned Pagination Footer */}
                            {totalProducts > 0 && (
                                <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900 shrink-0 z-10">
                                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        <span className="sm:hidden">{((currentPage - 1) * perPage) + 1}–{Math.min(currentPage * perPage, totalProducts)} / {totalProducts}</span>
                                        <span className="hidden sm:inline">Menampilkan {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalProducts)} dari {totalProducts} produk · {perPage} per halaman</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => changeProductPage(currentPage - 1)}
                                            disabled={currentPage <= 1}
                                            aria-label="Halaman sebelumnya"
                                            className="p-1 sm:px-3.5 sm:py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition sm:border border-slate-300 dark:border-slate-700 sm:shadow-2xs cursor-pointer"
                                        >
                                            <FiChevronLeft size={16} className="sm:hidden" /><span className="hidden sm:inline">Sebelumnya</span>
                                        </button>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => changeProductPage(currentPage + 1)}
                                            disabled={currentPage >= totalPages}
                                            aria-label="Halaman berikutnya"
                                            className="p-1 sm:px-3.5 sm:py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition sm:border border-slate-300 dark:border-slate-700 sm:shadow-2xs cursor-pointer"
                                        >
                                            <FiChevronRight size={16} className="sm:hidden" /><span className="hidden sm:inline">Selanjutnya</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                        )
                    )}

                    {/* TAB 2: CATEGORIES MANAGEMENT VIEW */}
                    {activeTab === 'categories' && (
                        <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-slate-900">
                            {filteredCategories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 border border-blue-100 dark:border-blue-900/60">
                                        <FiFolder size={28} />
                                    </div>
                                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                                        {categorySearch ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                                        {categorySearch
                                            ? `Tidak ada kategori atau sub-kategori yang cocok dengan "${categorySearch}".`
                                            : 'Kelola kategori suku cadang untuk memudahkan pencarian dan pengelompokan produk kasir.'}
                                    </p>
                                    {categorySearch ? (
                                        <button
                                            type="button"
                                            onClick={() => setCategorySearch('')}
                                            className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition cursor-pointer"
                                        >
                                            Reset Pencarian
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={openAddCategoryModal}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <FiPlus size={15} />
                                            <span>Tambah Kategori Baru</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {filteredCategories.map((cat) => {
                                        const hasChildren = cat.children && cat.children.length > 0;
                                        const isExpanded = expandedCategories.includes(cat.id) || Boolean(categorySearch.trim());

                                        return (
                                            <div key={cat.id}>
                                                <div className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedCategories(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                                                        className="p-1 text-slate-500 hover:text-blue-600"
                                                        aria-label={`${isExpanded ? 'Tutup' : 'Buka'} subkategori ${cat.name}`}
                                                        aria-expanded={isExpanded}
                                                    >
                                                        {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                                                    </button>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{cat.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{cat.count} produk · {cat.children.length} subkategori</p>
                                                    </div>
                                                    <button type="button" onClick={() => { setActiveTab('products'); handleCategoryFilterChange(cat.name); }} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">Lihat produk</button>
                                                    <button type="button" onClick={() => openEditCategoryModal(cat)} className="p-2 text-slate-500 hover:text-blue-600" title="Edit kategori dan subkategori" aria-label={`Edit ${cat.name}`}><FiEdit2 size={15} /></button>
                                                    <button type="button" onClick={() => handleDeleteCategory(cat)} className="p-2 text-slate-400 hover:text-red-600" title="Hapus kategori" aria-label={`Hapus ${cat.name}`}><FiTrash2 size={15} /></button>
                                                </div>
                                                {isExpanded && (
                                                    <div className="pl-11 pr-4 pb-2">
                                                        {hasChildren ? cat.children.map(child => (
                                                            <div key={child.id} className="flex items-center justify-between gap-3 py-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                                                                <button type="button" onClick={() => { setActiveTab('products'); handleCategoryFilterChange(child.name); }} className="text-left text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">{child.name}</button>
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{child.count} produk</span>
                                                            </div>
                                                        )) : <p className="py-2 text-xs text-slate-500">Belum ada subkategori.</p>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* PRODUCT MODAL (Add / Edit) */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-300 dark:border-slate-800 animate-in fade-in zoom-in duration-150 text-slate-900 dark:text-white">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                {editingItem ? 'Edit Produk' : 'Tambah Produk Baru'}
                            </h3>
                            <button 
                                onClick={() => setIsProductModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Produk</label>
                                <input
                                    type="text"
                                    required
                                    value={productFormData.name}
                                    onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                                    placeholder="Contoh: Ban Luar Federal 70/90-14"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        value={productFormData.sku}
                                        onChange={(e) => setProductFormData({...productFormData, sku: e.target.value})}
                                        placeholder="PRD-001"
                                        className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                                    <div className="relative">
                                        <select
                                            value={productFormData.category_id}
                                            onChange={(e) => setProductFormData({...productFormData, category_id: e.target.value})}
                                            className="w-full appearance-none pl-3.5 pr-9 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer"
                                        >
                                            <option value="">Pilih Kategori</option>
                                            {categories.map(c => (
                                                 <optgroup key={c.id} label={c.name}>
                                                     <option value={c.id}>Kategori utama: {c.name}</option>
                                                     {c.children && c.children.map(child => (
                                                         <option key={child.id} value={child.id}>{child.name}</option>
                                                     ))}
                                                 </optgroup>
                                            ))}
                                        </select>
                                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={15} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Merek (opsional)</label>
                                    <input type="text" value={productFormData.brand} onChange={(e) => setProductFormData({...productFormData, brand: e.target.value})} placeholder="Contoh: IRC" className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lokasi Rak (opsional)</label>
                                    <input type="text" value={productFormData.rack_location} onChange={(e) => setProductFormData({...productFormData, rack_location: e.target.value})} placeholder="Contoh: B2" className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Spesifikasi</label>
                                <input
                                    type="text"
                                    value={productFormData.subtitle}
                                    onChange={(e) => setProductFormData({...productFormData, subtitle: e.target.value})}
                                    placeholder="Contoh: Ban luar tubeless matic ring 14 berkualitas tinggi"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga Modal (Rp, opsional)</label>
                                    <input
                                        type="number"
                                        value={productFormData.cost_price}
                                        onChange={(e) => setProductFormData({...productFormData, cost_price: e.target.value})}
                                        placeholder="15000"
                                        className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga Jual (Rp)</label>
                                    <input
                                        type="number"
                                        required
                                        value={productFormData.price}
                                        onChange={(e) => setProductFormData({...productFormData, price: e.target.value})}
                                        placeholder="20000"
                                        className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Penjualan</label>
                                    <div className="relative">
                                        <select
                                            value={productFormData.status}
                                            onChange={(e) => setProductFormData({...productFormData, status: e.target.value})}
                                            className="w-full appearance-none pl-3.5 pr-9 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer"
                                        >
                                            <option value="Active">Aktif dijual</option>
                                            <option value="Inactive">Nonaktif</option>
                                        </select>
                                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={15} />
                                    </div>
                                </div>
                            </div>

                            {/* Stock & Minimum Stock Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        {editingItem ? 'Stok Saat Ini (pcs)' : 'Stok Awal (pcs)'}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={productFormData.stock}
                                        onChange={(e) => setProductFormData({...productFormData, stock: e.target.value})}
                                        disabled={!!editingItem}
                                        placeholder="0"
                                        className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{editingItem ? 'Ubah melalui tombol Stok Masuk/Keluar/Opname agar tercatat.' : 'Jumlah kuantitas fisik persediaan'}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Batas Minimum Stok (pcs)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={productFormData.minimum_stock}
                                        onChange={(e) => setProductFormData({...productFormData, minimum_stock: e.target.value})}
                                        placeholder="3"
                                        className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Peringatan saat persediaan ≤ batas ini</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Gambar Produk</label>
                                <label className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-800/50">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/webp"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setProductFormData({
                                                    ...productFormData,
                                                    imageFile: file,
                                                    imagePreview: URL.createObjectURL(file)
                                                });
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    {productFormData.imagePreview ? (
                                        <img src={productFormData.imagePreview} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shadow-2xs" />
                                    ) : productFormData.image ? (
                                        <img src={productFormData.image} alt="current" className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shadow-2xs" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-bold border border-slate-300 dark:border-slate-700">Foto</div>
                                    )}
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        <span className="font-bold text-blue-600 dark:text-yellow-400">Klik untuk upload</span>
                                        <br />JPEG, PNG, WEBP. Maks 2MB.
                                    </div>
                                </label>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg border border-blue-700 shadow-xs transition cursor-pointer"
                                >
                                    {isLoading ? 'Menyimpan...' : 'Simpan Produk'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CATEGORY MODAL (Add / Edit) */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-300 dark:border-slate-800 animate-in fade-in zoom-in duration-150 text-slate-900 dark:text-white">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                    {editingCategory ? 'Edit Kategori & Sub-Kategori' : 'Tambah Kategori Baru'}
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Kelola nama kategori utama beserta rincian sub-kategori di dalamnya.
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Kategori Utama *</label>
                                <input
                                    type="text"
                                    required
                                    value={categoryFormData.name}
                                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                                    placeholder="Contoh: Oli, Pelumas & Kimia"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Daftar Sub-Kategori ({categoryFormData.sub_categories?.length || 0})
                                        </label>
                                        <p className="text-[10px] text-slate-400">Sub-kategori yang terhubung ke kategori utama ini.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCategoryFormData({
                                                ...categoryFormData,
                                                sub_categories: [...(categoryFormData.sub_categories || []), { name: '' }]
                                            });
                                        }}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800"
                                    >
                                        <FiPlus size={13} />
                                        <span>Tambah Sub</span>
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {(categoryFormData.sub_categories || []).map((sub, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-400 w-5 text-right shrink-0">{idx + 1}.</span>
                                            <input
                                                type="text"
                                                value={sub.name}
                                                onChange={(e) => {
                                                    const updated = [...categoryFormData.sub_categories];
                                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                                    setCategoryFormData({ ...categoryFormData, sub_categories: updated });
                                                }}
                                                placeholder={`Nama sub-kategori ${idx + 1}...`}
                                                className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = categoryFormData.sub_categories.filter((_, i) => i !== idx);
                                                    setCategoryFormData({ ...categoryFormData, sub_categories: updated });
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition shrink-0 cursor-pointer"
                                                title="Hapus sub-kategori ini"
                                            >
                                                <FiTrash2 size={13} />
                                            </button>
                                        </div>
                                    ))}

                                    {(!categoryFormData.sub_categories || categoryFormData.sub_categories.length === 0) && (
                                        <div className="py-5 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 text-xs">
                                            Belum ada sub-kategori. Klik <span className="font-bold text-blue-600 dark:text-blue-400">+ Tambah Sub</span> untuk menambahkan.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg border border-blue-700 shadow-xs transition cursor-pointer"
                                >
                                    {isLoading ? 'Menyimpan...' : 'Simpan Kategori & Sub'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CUSTOM VISUAL DELETE CONFIRMATION MODAL */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="p-2 bg-red-50 dark:bg-red-950/60 rounded-lg shrink-0">
                                <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    Hapus {deleteTarget.type === 'product' ? 'Produk' : 'Kategori'}
                                </h3>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Konfirmasi Penghapusan</p>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                            Apakah Anda yakin ingin menghapus {deleteTarget.type === 'product' ? 'produk' : 'kategori'}{' '}
                            <span className="font-bold text-slate-900 dark:text-white">"{deleteTarget.name}"</span>? Perubahan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isLoading}
                                className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={executeDeleteTarget}
                                disabled={isLoading}
                                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition border border-red-700 shadow-xs"
                            >
                                {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT IMAGE LIGHTBOX PREVIEW MODAL */}
            {previewProduct && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewProduct(null)}
                >
                    <div 
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                                    {previewProduct.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                    {previewProduct.category} {previewProduct.sku ? `· ${previewProduct.sku}` : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewProduct(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        {/* Full Size Image */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[380px] overflow-hidden text-slate-300 dark:text-slate-600">
                            {previewProduct.image ? (
                                <img
                                    src={previewProduct.image}
                                    alt={previewProduct.name}
                                    className="max-h-[360px] max-w-full object-contain rounded-lg shadow-xs"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 opacity-60">
                                    <FiPackage size={80} className="mb-4" />
                                    <span className="text-sm font-semibold">Tidak Ada Foto</span>
                                </div>
                            )}
                        </div>

                        {/* Modal Info Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                                    Rp {Number(previewProduct.price).toLocaleString('id-ID')}
                                </span>
                                <span className={`text-xs font-semibold ${
                                    previewProduct.stock <= 0 
                                        ? 'text-rose-600 font-bold' 
                                        : previewProduct.stock <= 5 
                                            ? 'text-amber-500' 
                                            : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                    Stok: {previewProduct.stock <= 0 ? 'Habis' : `${previewProduct.stock} pcs`}
                                </span>
                            </div>
                            {previewProduct.subtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {previewProduct.subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* STOCK ADJUSTMENT MODAL (Kulakan / Opname / Keluar) */}
            {selectedProductForAdjust && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-300 dark:border-slate-800 animate-in fade-in zoom-in duration-150 text-slate-900 dark:text-white">
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                    Atur Persediaan Stok
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs mt-0.5">
                                    {selectedProductForAdjust.name}
                                </p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setSelectedProductForAdjust(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
                            {/* Current Stock Banner */}
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                                <span className="text-slate-600 dark:text-slate-400 font-semibold">Stok Saat Ini</span>
                                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                    {selectedProductForAdjust.stock} pcs
                                </span>
                            </div>

                            {/* Adjustment Type Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Jenis Perubahan
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustForm(prev => ({ ...prev, type: 'stock_in' }))}
                                        className={`px-2.5 py-2 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
                                            adjustForm.type === 'stock_in'
                                                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                                        }`}
                                    >
                                        <span className="block text-sm font-black">+</span>
                                        <span className="block text-[11px] mt-0.5">Kulakan / Masuk</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustForm(prev => ({ ...prev, type: 'stock_out' }))}
                                        className={`px-2.5 py-2 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
                                            adjustForm.type === 'stock_out'
                                                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                                        }`}
                                    >
                                        <span className="block text-sm font-black">-</span>
                                        <span className="block text-[11px] mt-0.5">Keluar / Rusak</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustForm(prev => ({ ...prev, type: 'adjustment' }))}
                                        className={`px-2.5 py-2 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
                                            adjustForm.type === 'adjustment'
                                                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                                        }`}
                                    >
                                        <span className="block text-sm font-black">=</span>
                                        <span className="block text-[11px] mt-0.5">Opname Fisik</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quantity Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    {adjustForm.type === 'adjustment' ? 'Jumlah Total Fisik Sebenarnya (pcs)' : 'Jumlah Kuantitas (pcs)'}
                                </label>
                                <input
                                    type="number"
                                    min={adjustForm.type === 'adjustment' ? '0' : '1'}
                                    required
                                    value={adjustForm.quantity}
                                    onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: e.target.value }))}
                                    placeholder={adjustForm.type === 'stock_in' ? 'Contoh: 15 (barang masuk dari supplier)' : 'Contoh: 5'}
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    autoFocus
                                />
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                    {adjustForm.type === 'stock_in' && `Stok baru akan menjadi: ${Number(selectedProductForAdjust.stock) + (parseInt(adjustForm.quantity, 10) || 0)} pcs`}
                                    {adjustForm.type === 'stock_out' && `Stok baru akan menjadi: ${Math.max(0, Number(selectedProductForAdjust.stock) - (parseInt(adjustForm.quantity, 10) || 0))} pcs`}
                                    {adjustForm.type === 'adjustment' && `Stok akan langsung direset menjadi: ${parseInt(adjustForm.quantity, 10) || 0} pcs`}
                                </p>
                            </div>

                            {/* Note / Reference */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Catatan / Referensi (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={adjustForm.note}
                                    onChange={(e) => setAdjustForm(prev => ({ ...prev, note: e.target.value }))}
                                    placeholder="Contoh: Kulakan dari Toko Jaya / Penyesuaian stok fisik mingguan"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedProductForAdjust(null)}
                                    disabled={adjustLoading}
                                    className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustLoading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg border border-blue-700 shadow-xs transition cursor-pointer flex items-center gap-1.5"
                                >
                                    {adjustLoading ? (
                                        <span>Menyimpan...</span>
                                    ) : (
                                        <>
                                            <FiCheck size={14} />
                                            <span>Simpan Stok</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
