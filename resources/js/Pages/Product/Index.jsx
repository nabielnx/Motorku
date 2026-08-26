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
    FiX, 
    FiCheck, 
    FiCoffee, 
    FiTag,
    FiSearch,
    FiAlertTriangle,
    FiGrid,
    FiList
} from 'react-icons/fi';

export default function MenuManagement({ initialProducts = [], initialCategories = [], filters = {} }) {
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
            search: searchQuery || undefined
        }, { preserveState: true, preserveScroll: true });
    };

    const handleCategoryFilterChange = (cat) => {
        setSelectedCategoryFilter(cat);
        router.get('/products', {
            page: 1,
            category: cat === 'All' ? undefined : cat,
            search: searchQuery || undefined
        }, { preserveState: true, preserveScroll: true });
    };

    // Search yang di-debounce → refetch dari server agar mencari SEMUA produk
    // (bukan hanya halaman yang sedang tampil). Kategori diambil via ref agar
    // selalu pakai nilai terbaru tanpa perlu memasukkannya ke dependency effect.
    const categoryFilterRef = useRef(selectedCategoryFilter);
    useEffect(() => { categoryFilterRef.current = selectedCategoryFilter; }, [selectedCategoryFilter]);

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
                search: searchQuery || undefined
            }, { preserveState: true, preserveScroll: true });
        }, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // Loading State
    const [isLoading, setIsLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Product Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [productFormData, setProductFormData] = useState({
        sku: '',
        name: '',
        subtitle: '',
        category_id: '',
        price: '',
        stock: '100',
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
            stock: '100',
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
            stock: item.stock,
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
        fd.append('stock', String(parseInt(productFormData.stock) || 100));
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
                    stock: parseInt(productFormData.stock) || item.stock,
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
        'Aksesoris': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    const getCategoryColor = (catName) => CATEGORY_COLORS[catName] || 'bg-slate-100 text-slate-800 border-slate-200';

    // Filtering & Sorting Products
    const filteredItems = items.filter(item => {
        if (!item) return false;
        const matchesCategory = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
        const nameStr = String(item.name || '').toLowerCase();
        const subtitleStr = String(item.subtitle || '').toLowerCase();
        const skuStr = String(item.sku || '').toLowerCase();
        const query = (searchQuery || '').toLowerCase();
        const matchesSearch = nameStr.includes(query) || subtitleStr.includes(query) || skuStr.includes(query);
        return matchesCategory && matchesSearch;
    }).sort((a, b) => {
        if (selectedSort === 'Price: Low to High') return (a.price || 0) - (b.price || 0);
        if (selectedSort === 'Price: High to Low') return (b.price || 0) - (a.price || 0);
        if (selectedSort === 'Name: A-Z') return String(a.name || '').localeCompare(String(b.name || ''));
        return 0; // Newest / Default
    });

    const categoryListForFilter = ['All', ...categories.map(c => c.name)];

    return (
        <AuthenticatedLayout pageTitle={getTranslation(locale, 'menu_produk', 'Menu & Produk')}>
            <Head title={`${locale === 'en' ? 'Products & Stock' : 'Produk & Stok'} - Toko Sparepart`}>
                <meta name="description" content="Kelola katalog produk sparepart, oli, aki, ban, harga, dan ketersediaan stok Toko Sparepart." />
            </Head>

            <div className="p-3.5 sm:p-5 w-full space-y-4">
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`pb-2 px-1 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                                activeTab === 'products'
                                    ? 'border-blue-600 text-blue-600 dark:text-yellow-400'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            <FiCoffee className="w-4 h-4 shrink-0" />
                            <span>Daftar Produk ({totalProducts})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`pb-2 px-1 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                                activeTab === 'categories'
                                    ? 'border-blue-600 text-blue-600 dark:text-yellow-400'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            <FiTag className="w-4 h-4 shrink-0" />
                            <span>Kategori Menu ({categories.length})</span>
                        </button>
                    </div>

                    <div className="flex items-center shrink-0">
                        {activeTab === 'products' ? (
                            <button 
                                onClick={openAddProductModal}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-2xs transition-all gap-1.5 cursor-pointer"
                            >
                                <FiPlus className="w-4 h-4" />
                                <span>Tambah Produk</span>
                            </button>
                        ) : (
                            <button 
                                onClick={openAddCategoryModal}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-2xs transition-all gap-1.5 cursor-pointer"
                            >
                                <FiPlus className="w-4 h-4" />
                                <span>Tambah Kategori</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* TAB 1: PRODUCTS */}
                {activeTab === 'products' && (
                <>
                    {/* Filters, Search Bar, and View Toggle */}
                    <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl shadow-xs border border-slate-300 dark:border-slate-800 flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center justify-between transition-colors">
                        {/* Search Input */}
                        <div className="relative w-full lg:w-72 shrink-0">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Cari produk atau SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
                            />
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full lg:w-auto py-1">
                            {categoryListForFilter.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryFilterChange(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border shrink-0 cursor-pointer ${
                                        selectedCategoryFilter === cat
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Right: Sort Dropdown & View Mode Toggle */}
                        <div className="flex items-center space-x-2 w-full lg:w-auto justify-between lg:justify-end shrink-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-1.5">
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Urutkan:</span>
                                <div className="relative inline-flex items-center">
                                    <select
                                        value={selectedSort}
                                        onChange={(e) => setSelectedSort(e.target.value)}
                                        className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold shadow-xs cursor-pointer"
                                    >
                                        <option value="Default">Posisi Tetap (Default)</option>
                                        <option value="Price: High to Low">Filter: Harga Tertinggi</option>
                                        <option value="Price: Low to High">Filter: Harga Terendah</option>
                                        <option value="Name: A-Z">Filter: Nama A-Z</option>
                                    </select>
                                    <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={14} />
                                </div>
                            </div>

                            {/* View Toggle (Grid / List) */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => handleViewModeChange('grid')}
                                    className={`p-1.5 rounded-md transition cursor-pointer ${
                                        viewMode === 'grid'
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                    title="Tampilan Grid Kompak"
                                >
                                    <FiGrid size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleViewModeChange('list')}
                                    className={`p-1.5 rounded-md transition cursor-pointer ${
                                        viewMode === 'list'
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                    title="Tampilan List / Tabel"
                                >
                                    <FiList size={15} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products Content: Compact Grid or List View (Natural scroll without trapped inner height) */}
                    <div className="w-full">
                        {filteredItems.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 p-12 rounded-xl text-center border border-slate-200 dark:border-slate-800 shadow-xs">
                                <FiCoffee className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Tidak ada produk ditemukan</h4>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Coba ubah kata kunci pencarian atau filter kategori kamu.</p>
                            </div>
                        ) : viewMode === 'grid' ? (
                            /* COMPACT GRID VIEW (Ramping & Space-Efficient di HP, Tablet, dan Desktop) */
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
                                {filteredItems.map((item) => (
                                    <div 
                                        key={item.id}
                                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition duration-200 overflow-hidden flex flex-col group"
                                    >
                                        {/* Image Container - Compact Height */}
                                        <div className="relative h-28 sm:h-32 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <img 
                                                src={item.image} 
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                            <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 max-w-[65%]">
                                                <span className={`inline-block truncate max-w-full px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold border shadow-2xs ${getCategoryColor(item.category)}`}>
                                                    {item.category}
                                                </span>
                                            </div>
                                            <div className="absolute top-1.5 sm:top-2 right-1.5 sm:top-2 right-2">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider ${
                                                    item.status === 'Active' 
                                                        ? 'bg-emerald-600 text-white shadow-2xs' 
                                                        : 'bg-slate-600 text-white shadow-2xs'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Container */}
                                        <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors" title={item.name}>
                                                    {item.name}
                                                </h3>
                                                <p className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                                    {item.sku || '-'}
                                                </p>
                                                {item.subtitle && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                                                        {item.subtitle}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs sm:text-sm block truncate">
                                                        Rp {Number(item.price).toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5 truncate">
                                                        Stok: <span className={`font-bold ${item.stock <= 5 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>{item.stock}</span>
                                                    </span>
                                                </div>

                                                <div className="flex items-center space-x-0.5 shrink-0">
                                                    <button
                                                        onClick={() => openEditProductModal(item)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors"
                                                        title="Edit Produk"
                                                    >
                                                        <FiEdit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(item)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                                                        title="Hapus Produk"
                                                    >
                                                        <FiTrash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* LIST / TABLE VIEW (Super Ramping & Cepat Scan Data) */
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredItems.map((item) => (
                                        <div 
                                            key={item.id}
                                            className="px-3 sm:px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-2.5 sm:gap-3 text-xs"
                                        >
                                            {/* Left: Image & Info */}
                                            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                                                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg shrink-0 border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden shadow-2xs">
                                                    <img 
                                                        src={item.image} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                        <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
                                                            {item.name}
                                                        </span>
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border shadow-2xs shrink-0 ${getCategoryColor(item.category)}`}>
                                                            {item.category}
                                                        </span>
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shrink-0 shadow-2xs ${
                                                            item.status === 'Active' 
                                                                ? 'bg-emerald-600 text-white' 
                                                                : 'bg-slate-600 text-white'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:gap-2.5 mt-0.5 text-[11px] flex-wrap text-slate-500 dark:text-slate-400">
                                                        {item.sku && (
                                                            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                                                {item.sku}
                                                            </span>
                                                        )}
                                                        <span className="font-black text-blue-600 dark:text-blue-400">
                                                            Rp {Number(item.price).toLocaleString('id-ID')}
                                                        </span>
                                                        <span className={`font-semibold ${item.stock <= 0 ? 'text-red-500' : item.stock <= 5 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                            Stok: {item.stock} pcs
                                                        </span>
                                                        {item.subtitle && (
                                                            <span className="text-slate-400 dark:text-slate-500 italic truncate max-w-[180px] sm:max-w-md">
                                                                · {item.subtitle}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                                <button
                                                    onClick={() => openEditProductModal(item)}
                                                    className="p-2 sm:p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                                                    title="Edit Produk"
                                                >
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(item)}
                                                    className="p-2 sm:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                                                    title="Hapus Produk"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Pagination Footer */}
                    {totalProducts > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold text-center sm:text-left">
                                Menampilkan {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalProducts)} dari {totalProducts} produk
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => changeProductPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
                                >
                                    Sebelumnya
                                </button>
                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => changeProductPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </>)}

                {/* TAB 2: CATEGORIES */}
                {activeTab === 'categories' && (
                    <div className="w-full">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden">
                            <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Daftar Kategori Produk</h3>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total {categories.length} Kategori</span>
                            </div>

                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3">
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-yellow-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-black text-sm shrink-0">
                                                {cat.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{cat.name}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{cat.description || 'Tidak ada deskripsi'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 sm:space-x-6 shrink-0">
                                            <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-700">
                                                {cat.count} Produk
                                            </span>

                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => openEditCategoryModal(cat)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                                                    title="Edit Kategori"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                                    title="Hapus Kategori"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Menu</label>
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
                                        placeholder="MIE001"
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
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Subtitle</label>
                                <input
                                    type="text"
                                    value={productFormData.subtitle}
                                    onChange={(e) => setProductFormData({...productFormData, subtitle: e.target.value})}
                                    placeholder="Contoh: Mie + Ayam Cincang + Pangsit"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga (Rp)</label>
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
                                        <img src={productFormData.imagePreview} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700" />
                                    ) : productFormData.image ? (
                                        <img src={productFormData.image} alt="current" className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold border border-slate-300 dark:border-slate-700">Foto</div>
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
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg border border-blue-700 shadow-xs transition"
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
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg border border-blue-700 shadow-xs transition"
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
        </AuthenticatedLayout>
    );
}