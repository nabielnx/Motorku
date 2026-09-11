import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
    FiChevronRight,
    FiX, 
    FiCheck, 
    FiPackage,
    FiSearch,
    FiAlertTriangle
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

    // Format products from Database or fallback
    const productImage = (path) => {
        if (!path) return 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=300&auto=format&fit=crop&q=80';
        if (path.startsWith('http')) return path;
        return '/storage/' + path;
    };

    const extractPaginator = (raw) => {
        if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray(raw.data)) {
            return raw;
        }
        const list = Array.isArray(raw) ? raw : [];
        return { data: list, current_page: 1, last_page: 1, total: list.length, per_page: 10 };
    };

    const paginator = extractPaginator(initialProducts);

    const formatProducts = (rawProducts) => {
        const list = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);
        return list.map(p => {
            const catName = p.category ? p.category.name : 'Umum';
            return {
                id: p.id,
                sku: p.sku || '',
                name: p.name,
                subtitle: p.description || '',
                category_id: p.category_id,
                category: catName,
                price: Number(p.price),
                stock: p.stock || 0,
                minimum_stock: p.minimum_stock || 0,
                status: p.is_available ? 'Active' : 'Inactive',
                image: getProductImage(p.image_path, catName)
            };
        });
    };

    // Format categories from Database or fallback
    const formatCategories = (rawCats) => {
        if (!rawCats || rawCats.length === 0) return [];
        return rawCats.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
            count: c.products_count !== undefined ? c.products_count : 0
        }));
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
    const perPage = paginator.per_page || 10;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(filters.category || 'All');
    const [selectedStockFilter, setSelectedStockFilter] = useState(filters.stock_status || 'all');
    const [selectedSort, setSelectedSort] = useState('Default');
    const [viewMode, setViewMode] = useState(() => {
        try {
            return localStorage.getItem('product_view_mode') || 'grid';
        } catch {
            return 'grid';
        }
    });

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        try {
            localStorage.setItem('product_view_mode', mode);
        } catch {}
    };

    const changeProductPage = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        router.get('/products', {
            page: newPage,
            category: selectedCategoryFilter === 'All' ? undefined : selectedCategoryFilter,
            search: searchQuery || undefined,
            stock_status: selectedStockFilter === 'all' ? undefined : selectedStockFilter
        }, { preserveState: true, preserveScroll: true });
    };

    const handleCategoryFilterChange = (cat) => {
        setSelectedCategoryFilter(cat);
        router.get('/products', {
            page: 1,
            category: cat === 'All' ? undefined : cat,
            search: searchQuery || undefined,
            stock_status: selectedStockFilter === 'all' ? undefined : selectedStockFilter
        }, { preserveState: true, preserveScroll: true });
    };

    const handleStockFilterChange = (status) => {
        setSelectedStockFilter(status);
        router.get('/products', {
            page: 1,
            category: selectedCategoryFilter === 'All' ? undefined : selectedCategoryFilter,
            search: searchQuery || undefined,
            stock_status: status === 'all' ? undefined : status
        }, { preserveState: true, preserveScroll: true });
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
                stock_status: stockFilterRef.current === 'all' ? undefined : stockFilterRef.current
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
        if (isNaN(qty) || qty < 1) {
            toast.error('Jumlah kuantitas wajib diisi minimal 1 unit.');
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
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

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
        name: '',
        subtitle: '',
        category_id: '',
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
    const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });

    // Handlers for Products
    const openAddProductModal = () => {
        setEditingItem(null);
        setProductFormData({
            sku: 'SKU' + Date.now().toString().slice(-6),
            name: '',
            subtitle: '',
            category_id: categories[0]?.id || '',
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
            name: item.name,
            subtitle: item.subtitle,
            category_id: item.category_id,
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
        fd.append('name', productFormData.name);
        fd.append('description', productFormData.subtitle || '');
        fd.append('category_id', productFormData.category_id || (categories[0]?.id));
        fd.append('price', String(parseFloat(productFormData.price) || 0));
        fd.append('stock', productFormData.stock !== '' ? String(parseInt(productFormData.stock, 10)) : '0');
        fd.append('minimum_stock', productFormData.minimum_stock !== '' ? String(parseInt(productFormData.minimum_stock, 10)) : '3');
        fd.append('is_available', productFormData.status === 'Active' ? '1' : '0');
        if (productFormData.imageFile) {
            fd.append('image', productFormData.imageFile);
        }

        try {
            if (editingItem) {
                fd.append('_method', 'PUT');
                await axios.post(`/api/products/${editingItem.id}`, fd);
                const selectedCat = categories.find(c => c.id === (productFormData.category_id || categories[0]?.id));
                setItems(prev => prev.map(item => item.id === editingItem.id ? {
                    ...item,
                    name: productFormData.name,
                    sku: productFormData.sku || item.sku,
                    subtitle: productFormData.subtitle || '',
                    category_id: productFormData.category_id,
                    category: selectedCat ? selectedCat.name : item.category,
                    price: parseFloat(productFormData.price) || 0,
                    stock: productFormData.stock !== '' ? parseInt(productFormData.stock, 10) : item.stock,
                    minimum_stock: productFormData.minimum_stock !== '' ? parseInt(productFormData.minimum_stock, 10) : item.minimum_stock,
                    status: productFormData.status,
                    image: productFormData.imagePreview || item.image,
                } : item));
                toast.success(`Data produk "${productFormData.name}" berhasil diperbarui!`);
            } else {
                await axios.post('/api/products', fd);
                toast.success(`Produk "${productFormData.name}" berhasil ditambahkan!`);
                router.reload({ preserveScroll: true });
            }
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
        setCategoryFormData({ name: '', description: '' });
        setIsCategoryModalOpen(true);
    };

    const openEditCategoryModal = (cat) => {
        setEditingCategory(cat);
        setCategoryFormData({ name: cat.name, description: cat.description });
        setIsCategoryModalOpen(true);
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            name: categoryFormData.name,
            description: categoryFormData.description
        };

        try {
            if (editingCategory) {
                const res = await axios.put(`/api/categories/${editingCategory.id}`, payload);
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: payload.name, description: payload.description } : c));
                toast.success(`Kategori "${payload.name}" berhasil diperbarui!`);
            } else {
                const res = await axios.post('/api/categories', payload);
                const newCat = res.data?.data;
                if (newCat) {
                    setCategories(prev => [...prev, {
                        id: newCat.id,
                        name: newCat.name,
                        description: newCat.description || '',
                        count: 0
                    }]);
                }
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
                router.reload({ preserveScroll: true });
            } else if (deleteTarget.type === 'category') {
                const res = await axios.delete(`/api/categories/${deleteTarget.id}`);
                setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
                toast.success(`Kategori "${deleteTarget.name}" berhasil dihapus!`);
                router.reload({ preserveScroll: true });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || `Gagal menghapus ${deleteTarget.type}`);
        } finally {
            setIsLoading(false);
            setDeleteTarget(null);
        }
    };

    // Category Color Resolver
    const CATEGORY_COLORS = {
        'Ban & Velg': 'bg-slate-100 text-slate-800 border-slate-200',
        'Aki & Kelistrikan': 'bg-blue-100 text-blue-800 border-blue-200',
        'Oli & Pelumas': 'bg-yellow-100 text-yellow-700 border-yellow-200',
        'Filter & Konsumsi': 'bg-purple-100 text-purple-800 border-purple-200',
        'Rem & Kaki-kaki': 'bg-red-100 text-red-800 border-red-200',
        'Aksesoris': 'bg-sky-100 text-sky-800 border-sky-200',
    };
    const getCategoryColor = (catName) => CATEGORY_COLORS[catName] || 'bg-slate-100 text-slate-800 border-slate-200';

    // Filtering & Sorting Products
    const filteredItems = items.filter(item => {
        if (!item) return false;
        const matchesCategory = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
        const matchesStatus = 
            statusFilter === 'all' ? true :
            statusFilter === 'active' ? item.status === 'Active' :
            item.status === 'Inactive';
        const nameStr = String(item.name || '').toLowerCase();
        const subtitleStr = String(item.subtitle || '').toLowerCase();
        const skuStr = String(item.sku || '').toLowerCase();
        const query = (searchQuery || '').toLowerCase();
        const matchesSearch = nameStr.includes(query) || subtitleStr.includes(query) || skuStr.includes(query);
        return matchesCategory && matchesStatus && matchesSearch;
    }).sort((a, b) => {
        if (selectedSort === 'Price: Low to High') return (a.price || 0) - (b.price || 0);
        if (selectedSort === 'Price: High to Low') return (b.price || 0) - (a.price || 0);
        if (selectedSort === 'Name: A-Z') return String(a.name || '').localeCompare(String(b.name || ''));
        return 0; // Newest / Default
    });

    const categoryListForFilter = ['All', ...categories.map(c => c.name)];

    return (
        <AuthenticatedLayout pageTitle={getTranslation(locale, 'menu_produk', 'Menu & Produk')} noPadding={true}>
            <Head title={`${locale === 'en' ? 'Products & Stock' : 'Produk & Stok'} - Toko Sparepart`}>
                <meta name="description" content="Kelola katalog produk sparepart, oli, aki, ban, harga, dan ketersediaan stok Toko Sparepart." />
            </Head>

            <div className="p-3 sm:p-4 lg:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* UNIFIED PRODUCT MANAGEMENT CONTAINER */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
                    {/* Compact Header & Filter Section */}
                    <div className="p-3 sm:p-3.5 space-y-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
                        {/* Top Row: Title, Badge, Tabs & Action */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                            {/* Left: Title + Badge + Tabs */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight shrink-0">
                                    Daftar Produk
                                </h1>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                                    {totalProducts}
                                </span>

                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                                {/* Compact Tab Switcher */}
                                <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('products')}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                            activeTab === 'products'
                                                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        Semua Produk
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('categories')}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                            activeTab === 'categories'
                                                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        Kategori ({categories.length})
                                    </button>
                                </div>
                            </div>

                            {/* Right: Action Button */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                {activeTab === 'products' ? (
                                    <button
                                        type="button"
                                        onClick={openAddProductModal}
                                        className="px-3.5 py-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <FiPlus size={15} />
                                        <span>Tambah Produk</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={openAddCategoryModal}
                                        className="px-3.5 py-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <FiPlus size={15} />
                                        <span>Tambah Kategori</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Low Stock Alert Banner */}
                        {lowStockCount > 0 && activeTab === 'products' && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs">
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold">
                                    <FiAlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={16} />
                                    <span>
                                        Perhatian: Terdapat <strong className="font-extrabold">{lowStockCount} produk</strong> dengan stok menipis / di bawah batas minimum
                                        {outOfStockCount > 0 ? ` (${outOfStockCount} produk habis)` : ''}.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleStockFilterChange(selectedStockFilter === 'low' ? 'all' : 'low')}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] transition shrink-0 cursor-pointer shadow-2xs"
                                >
                                    {selectedStockFilter === 'low' ? 'Tampilkan Semua Stok' : 'Filter Stok Menipis'}
                                </button>
                            </div>
                        )}

                        {/* Filter Bar (Search + Dropdown Kategori + Dropdown Status Stok + Status Segmented Button) */}
                        {activeTab === 'products' && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-0.5">
                                {/* Left: Search input + Category Dropdown + Stock Status Dropdown */}
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 max-w-2xl">
                                    {/* Search Input */}
                                    <div className="relative flex-1 min-w-[180px]">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Cari nama produk atau SKU..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-7 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
                                        />
                                        {searchQuery && (
                                             <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer">
                                                 <FiX size={13} />
                                             </button>
                                         )}
                                     </div>

                                     {/* Category Dropdown */}
                                     <div className="relative shrink-0 w-36 sm:w-44">
                                         <select
                                             value={selectedCategoryFilter}
                                             onChange={e => handleCategoryFilterChange(e.target.value)}
                                             className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg pl-3 pr-8 py-1.5 font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                         >
                                             <option value="All">Semua Kategori</option>
                                             {categories.map(c => (
                                                 <option key={c.id} value={c.name}>{c.name} ({c.count})</option>
                                             ))}
                                         </select>
                                         <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={14} />
                                     </div>

                                     {/* Stock Status Dropdown */}
                                     <div className="relative shrink-0 w-36 sm:w-40">
                                         <select
                                             value={selectedStockFilter}
                                             onChange={e => handleStockFilterChange(e.target.value)}
                                             className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg pl-3 pr-8 py-1.5 font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                         >
                                             <option value="all">Semua Stok</option>
                                             <option value="low">Stok Menipis ({lowStockCount})</option>
                                             <option value="out_of_stock">Stok Habis ({outOfStockCount})</option>
                                             <option value="safe">Stok Aman</option>
                                         </select>
                                         <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={14} />
                                     </div>
                                 </div>

                                 {/* Right: Segmented Status Buttons */}
                                 <div className="inline-flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 self-start sm:self-auto shrink-0 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('all')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                                            statusFilter === 'all'
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Semua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('active')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                                            statusFilter === 'active'
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Tersedia
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('inactive')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                                            statusFilter === 'inactive'
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Tidak Tersedia
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* TAB 1: PRODUCTS TABLE WITH ACCORDION & IMAGES */}
                    {activeTab === 'products' && (
                        <>
                            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
                                {filteredItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                        <FiPackage className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                                        <p className="text-base font-extrabold text-slate-700 dark:text-slate-300">Tidak ada produk ditemukan</p>
                                        <p className="text-xs font-semibold mt-1">Coba ubah kata kunci pencarian atau filter status kamu.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse min-w-[1040px]">
                                        {/* Table Header */}
                                        <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            <tr>
                                                <th className="w-8 pl-3 pr-0 py-2.5 text-center"></th>
                                                <th className="pl-2 pr-4 py-2.5 font-bold min-w-[260px]">
                                                    <span className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setSelectedSort(selectedSort === 'Name: A-Z' ? 'Default' : 'Name: A-Z')}>
                                                        GAMBAR & NAMA PRODUK <span className="text-slate-400 text-[10px]">⇅</span>
                                                    </span>
                                                </th>
                                                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5">SKU <span className="text-slate-400 text-[10px]">⇅</span></span>
                                                </th>
                                                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5">KATEGORI <span className="text-slate-400 text-[10px]">⇅</span></span>
                                                </th>
                                                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setSelectedSort(selectedSort === 'Price: Low to High' ? 'Price: High to Low' : 'Price: Low to High')}>
                                                        HARGA JUAL <span className="text-slate-400 text-[10px]">⇅</span>
                                                    </span>
                                                </th>
                                                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5">STOK <span className="text-slate-400 text-[10px]">⇅</span></span>
                                                </th>
                                                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5">STATUS <span className="text-slate-400 text-[10px]">⇅</span></span>
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
                                                                    <div 
                                                                        onClick={(e) => { e.stopPropagation(); setPreviewProduct(item); }}
                                                                        className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 cursor-pointer hover:border-blue-500 hover:shadow-xs transition"
                                                                        title="Klik untuk melihat foto resolusi penuh"
                                                                    >
                                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                                    </div>

                                                                    {/* Name and subtitle */}
                                                                    <div className="min-w-0">
                                                                        <span 
                                                                            onClick={() => toggleRowExpand(item.id)}
                                                                            className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate hover:text-blue-600 transition cursor-pointer"
                                                                            title={item.name}
                                                                        >
                                                                            {item.name}
                                                                        </span>
                                                                        {item.subtitle && (
                                                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate max-w-xs mt-0.5">
                                                                                {item.subtitle}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* SKU */}
                                                            <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                                {item.sku || '-'}
                                                            </td>

                                                            {/* Kategori */}
                                                            <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                                {item.category}
                                                            </td>

                                                            {/* Harga Jual */}
                                                            <td className="px-4 py-2.5 font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                                Rp {Number(item.price).toLocaleString('id-ID')}
                                                            </td>

                                                            {/* Stok */}
                                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                                <span className={`font-semibold ${
                                                                    item.stock <= 0 
                                                                        ? 'text-rose-600 font-bold' 
                                                                        : item.stock <= (item.minimum_stock || 3) 
                                                                            ? 'text-amber-500 font-bold' 
                                                                            : 'text-slate-700 dark:text-slate-300'
                                                                }`}>
                                                                    {item.stock <= 0 ? 'Habis' : `${item.stock} pcs`}
                                                                </span>
                                                            </td>

                                                            {/* Status - Plain Text without Box & Dot */}
                                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                                {item.status === 'Active' ? (
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                        Tersedia
                                                                    </span>
                                                                ) : (
                                                                    <span className="font-medium text-slate-400 dark:text-slate-500">
                                                                        Tidak Tersedia
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
                                                                            className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 hover:border-blue-500 transition shrink-0 shadow-2xs"
                                                                            title="Klik untuk melihat foto resolusi penuh"
                                                                        >
                                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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
                            </div>

                            {/* Pinned Pagination Footer */}
                            {totalProducts > 0 && (
                                <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-slate-900 shrink-0 z-10">
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Menampilkan {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalProducts)} dari {totalProducts} produk
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => changeProductPage(currentPage - 1)}
                                            disabled={currentPage <= 1}
                                            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
                                        >
                                            Sebelumnya
                                        </button>
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => changeProductPage(currentPage + 1)}
                                            disabled={currentPage >= totalPages}
                                            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
                                        >
                                            Selanjutnya
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* TAB 2: CATEGORIES MANAGEMENT VIEW */}
                    {activeTab === 'categories' && (
                        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {categories.map((cat) => (
                                <div key={cat.id} className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3">
                                    <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
                                            {cat.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{cat.name}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{cat.description || 'Tidak ada deskripsi'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3 sm:space-x-6 shrink-0">
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            {cat.count} Produk
                                        </span>

                                        <div className="flex items-center space-x-1">
                                            <button
                                                type="button"
                                                onClick={() => openEditCategoryModal(cat)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                                                title="Edit Kategori"
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCategory(cat)}
                                                className="p-1 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                                                title="Hapus Kategori"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={15} />
                                    </div>
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
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Ketersediaan</label>
                                    <div className="relative">
                                        <select
                                            value={productFormData.status}
                                            onChange={(e) => setProductFormData({...productFormData, status: e.target.value})}
                                            className="w-full appearance-none pl-3.5 pr-9 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer"
                                        >
                                            <option value="Active">Tersedia</option>
                                            <option value="Inactive">Habis</option>
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
                                        placeholder="0"
                                        className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Jumlah kuantitas fisik persediaan</p>
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
                                    className="px-3.5 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg border border-green-600 shadow-xs transition cursor-pointer"
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
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-300 dark:border-slate-800 animate-in fade-in zoom-in duration-150 text-slate-900 dark:text-white">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                            </h3>
                            <button 
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Kategori</label>
                                <input
                                    type="text"
                                    required
                                    value={categoryFormData.name}
                                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                                    placeholder="Contoh: Ban Luar"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Kategori</label>
                                <textarea
                                    rows={3}
                                    value={categoryFormData.description}
                                    onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                                    placeholder="Deskripsi singkat kategori..."
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-3.5 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg border border-green-600 shadow-xs transition cursor-pointer"
                                >
                                    {isLoading ? 'Menyimpan...' : 'Simpan Kategori'}
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
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[380px] overflow-hidden">
                            <img
                                src={previewProduct.image}
                                alt={previewProduct.name}
                                className="max-h-[360px] max-w-full object-contain rounded-lg shadow-xs"
                            />
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
                                    min="1"
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