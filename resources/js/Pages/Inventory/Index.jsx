import { useState, useEffect, useRef, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiSearch, FiAlertTriangle, FiPackage, FiX, FiSliders, FiChevronDown } from 'react-icons/fi';
import { getProductImage } from '@/Utils/productImage';

export default function InventoryIndex() {
    const { props } = usePage();
    const locale = props.app_settings?.locale || 'id';
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [summary, setSummary] = useState({ total_products: 0, low_stock: 0 });
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [stockFilter, setStockFilter] = useState('All'); // 'All', 'Low', 'Normal'
    const [selectedSort, setSelectedSort] = useState('Default');
    const [modal, setModal] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [form, setForm] = useState({ product_id: '', type: 'stock_in', quantity: 1, note: '' });
    const [loading, setLoading] = useState(false);
    const [lowStockItems, setLowStockItems] = useState([]);
    const searchTimer = useRef(null);

    const stockStatusMap = { All: undefined, Low: 'low', Normal: 'normal' };

    const fetchProducts = async (pageNum = 1, query = '', filter = 'All') => {
        try {
            const res = await axios.get('/api/products', {
                params: {
                    per_page: 10,
                    page: pageNum,
                    search: query || undefined,
                    stock_status: stockStatusMap[filter],
                }
            });
            const data = res.data;
            setProducts(data.products.data);
            setPage(data.products.current_page);
            setLastPage(data.products.last_page);
            setTotalItems(data.products.total);
            setSummary(data.summary);
            if (!query && filter === 'All') {
                const allRes = await axios.get('/api/products', { params: { per_page: 1000 } });
                setLowStockItems(
                    (allRes.data.products.data || []).filter(
                        p => Number(p.stock) <= Number(p.minimum_stock)
                    )
                );
            }
        } catch {
            setProducts([]);
        }
    };

    useEffect(() => { fetchProducts(1, debouncedSearch, stockFilter); }, [debouncedSearch]);

    useEffect(() => {
        if (debouncedSearch) return;
        fetchProducts(page, '', stockFilter);
    }, [page]);

    useEffect(() => {
        setPage(1);
        fetchProducts(1, debouncedSearch, stockFilter);
    }, [stockFilter]);

    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    const openAdjust = (product) => {
        setSelectedProduct(product);
        setForm({ product_id: product.id, type: 'stock_in', quantity: '', note: '' });
        setModal('form');
    };

    const handleSubmit = async () => {
        const qty = parseInt(form.quantity, 10);
        if (isNaN(qty) || qty < 1) {
            toast.error('Jumlah kuantitas wajib diisi minimal 1 unit.');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/inventory', { ...form, quantity: qty });
            
            // In-place optimistic update: keeps the product firmly in place on the screen!
            setProducts(prev => prev.map(p => {
                if (p.id !== selectedProduct.id) return p;
                let newStock = Number(p.stock);
                if (form.type === 'stock_in') newStock += qty;
                else if (form.type === 'stock_out') newStock = Math.max(0, newStock - qty);
                else newStock = qty;
                return { ...p, stock: newStock };
            }));

            // Also update summary
            setSummary(prev => {
                const oldStock = Number(selectedProduct.stock);
                const minStock = Number(selectedProduct.minimum_stock);
                let newStock = oldStock;
                if (form.type === 'stock_in') newStock += qty;
                else if (form.type === 'stock_out') newStock = Math.max(0, newStock - qty);
                else newStock = qty;

                let lowDiff = 0;
                if (oldStock <= minStock && newStock > minStock) lowDiff = -1;
                else if (oldStock > minStock && newStock <= minStock) lowDiff = 1;

                return { ...prev, low_stock: Math.max(0, prev.low_stock + lowDiff) };
            });

            const typeLabels = {
                stock_in: `ditambah +${qty} unit (Stok Masuk)`,
                stock_out: `dikurangi -${qty} unit (Stok Keluar)`,
                adjustment: `disesuaikan (${qty} unit)`,
                audit: `diaudit (${qty} unit)`
            };
            const actionText = typeLabels[form.type] || `diubah (${qty} unit)`;
            toast.success(`Stok "${selectedProduct?.name || 'Produk'}" berhasil ${actionText}!`);
            setModal(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mencatat penyesuaian stok');
        } finally {
            setLoading(false);
        }
    };

    const sortedProducts = useMemo(() => {
        return [...products].sort((a, b) => {
            if (selectedSort === 'Stock: Low to High') return Number(a.stock || 0) - Number(b.stock || 0);
            if (selectedSort === 'Stock: High to Low') return Number(b.stock || 0) - Number(a.stock || 0);
            if (selectedSort === 'Name: A-Z') return String(a.name || '').localeCompare(String(b.name || ''));
            return 0; // Posisi Tetap (Default)
        });
    }, [products, selectedSort]);

    const goToPage = (p) => {
        if (p < 1 || p > lastPage) return;
        setPage(p);
    };

    const statusBadge = (stock, minStock) => {
        const isLow = stock <= minStock;
        if (isLow) return { label: 'Stok Menipis', color: 'bg-yellow-400 text-white font-extrabold' };
        return { label: 'Aman', color: 'bg-emerald-600 text-white font-extrabold' };
    };

    // Stock filtering is now done server-side via the stock_status API parameter

    const perPage = 10;
    const fromIndex = totalItems > 0 ? (page - 1) * perPage + 1 : 0;
    const toIndex = Math.min(page * perPage, totalItems);

    return (
        <AuthenticatedLayout pageTitle={locale === 'en' ? 'Inventory Stock' : 'Stok Inventaris'}>
            <Head title={`${locale === 'en' ? 'Inventory Stock' : 'Stok Inventaris'} - Toko Sparepart`}>
                <meta name="description" content="Pantau ketersediaan stok bahan baku dan produk toko Toko Sparepart secara akurat." />
            </Head>
            <div className="w-full space-y-4">

                {/* ALERT SUMMARY RESTOCK */}
                {summary.low_stock > 0 && !debouncedSearch && (
                    <div className="bg-yellow-400 text-white rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs border border-yellow-500">
                        <div className="flex items-center gap-2.5">
                            <FiAlertTriangle className="text-white shrink-0" size={16} />
                            <p className="text-xs font-extrabold uppercase tracking-wider">
                                {summary.low_stock} produk memerlukan restock segera!
                            </p>
                        </div>
                        <span className="text-[11px] font-semibold text-yellow-50 truncate max-w-md hidden md:inline">
                            {lowStockItems.map(i => i.name).slice(0, 4).join(', ')}
                            {lowStockItems.length > 4 ? ` +${lowStockItems.length - 4} lainnya` : ''}
                        </span>
                    </div>
                )}

                {/* STATS SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onClick={() => setStockFilter('All')}
                        className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-left flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                        <div>
                            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Produk</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{summary.total_products}</p>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                            <FiPackage size={18} />
                        </div>
                    </button>

                    <button
                        onClick={() => setStockFilter('Low')}
                        className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-left flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                        <div>
                            <p className="text-[10px] font-extrabold text-yellow-500 dark:text-yellow-400 uppercase tracking-wider">Stok Menipis</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{summary.low_stock}</p>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-yellow-400 text-white flex items-center justify-center font-bold shrink-0">
                            <FiAlertTriangle size={18} />
                        </div>
                    </button>
                </div>

                {/* MAIN TABLE CONTAINER */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Stok Produk & Inventaris</h3>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama produk atau SKU..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <FiX size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* STOCK STATUS FILTER TABS & SORT DROPDOWN */}
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {[
                                { key: 'All', label: 'Semua Produk' },
                                { key: 'Low', label: 'Stok Menipis' },
                                { key: 'Normal', label: 'Aman' }
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setStockFilter(f.key)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                                        stockFilter === f.key
                                            ? 'bg-blue-600 text-white shadow-2xs'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Urutkan:</span>
                            <div className="relative inline-flex items-center">
                                <select
                                    value={selectedSort}
                                    onChange={(e) => setSelectedSort(e.target.value)}
                                    className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold shadow-xs cursor-pointer"
                                >
                                    <option value="Default">Posisi Tetap (Default)</option>
                                    <option value="Stock: Low to High">Filter: Stok Terendah</option>
                                    <option value="Stock: High to Low">Filter: Stok Tertinggi</option>
                                    <option value="Name: A-Z">Filter: Nama A-Z</option>
                                </select>
                                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={14} />
                            </div>
                        </div>
                    </div>

                    {/* TABLE — CLEAN FLEXIBLE FIT & REAL PRODUCT THUMBNAILS */}
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-extrabold text-[11px] uppercase tracking-wider bg-slate-50/90 dark:bg-slate-800/90">
                                    <th className="py-3 px-4">Produk</th>
                                    <th className="py-3 px-4">Stok Saat Ini</th>
                                    <th className="py-3 px-4">Batas Min Stok</th>
                                    <th className="py-3 px-4">Status Stok</th>
                                    <th className="py-3 px-4 text-right">Aksi Penyesuaian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedProducts.map(p => {
                                    const stock = Number(p.stock);
                                    const minStock = Number(p.minimum_stock);
                                    const badge = statusBadge(stock, minStock);
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getProductImage(p.image, p.category?.name)}
                                                        alt={p.name}
                                                        className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs"
                                                    />
                                                    <div>
                                                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block leading-snug">{p.name}</span>
                                                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-0.5">{p.sku || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{stock}</span>
                                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold inline-block ml-1">unit</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                                                {minStock} unit
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => openAdjust(p)}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-extrabold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer ml-auto"
                                                >
                                                    <FiSliders size={14} />
                                                    <span>Adjust Stok</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                                            Tidak ada data produk ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION FOOTER */}
                    {totalItems > 0 && (
                        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Menampilkan {fromIndex} - {toIndex} dari {totalItems} produk
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => goToPage(page - 1)}
                                    disabled={page <= 1}
                                    className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
                                >
                                    Sebelumnya
                                </button>
                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {page} / {lastPage}
                                </span>
                                <button
                                    onClick={() => goToPage(page + 1)}
                                    disabled={page >= lastPage}
                                    className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL PENYESUAIAN STOK */}
            {modal === 'form' && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150 text-slate-900 dark:text-white">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Adjust Stok Produk</h3>
                                <p className="text-xs font-bold text-blue-600 dark:text-yellow-400 mt-0.5">{selectedProduct.name}</p>
                            </div>
                            <button onClick={() => setModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                                <FiX size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-extrabold text-slate-900 dark:text-slate-300 block mb-1">Tipe Penyesuaian:</label>
                                <div className="relative">
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({...form, type: e.target.value})}
                                        className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3.5 pr-9 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="stock_in">Stock In (+ Tambah Stok / Restock)</option>
                                        <option value="stock_out">Stock Out (- Kurangi Stok / Rusak / Expired)</option>
                                    </select>
                                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={15} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-extrabold text-slate-900 dark:text-slate-300 block mb-1">Jumlah Kuantitas:</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.quantity}
                                    onChange={(e) => setForm({...form, quantity: e.target.value})}
                                    placeholder="Contoh: 30"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-extrabold text-slate-900 dark:text-slate-300 block mb-1">Catatan / Alasan Penyesuaian:</label>
                                <input
                                    type="text"
                                    value={form.note}
                                    onChange={(e) => setForm({...form, note: e.target.value})}
                                    placeholder="Contoh: Belanja bahan baru, stok rusak, dll..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setModal(null)}
                                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                            >
                                {loading ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
