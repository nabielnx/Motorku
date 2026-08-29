import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { getProductImage } from '@/Utils/productImage';
import { toast } from 'sonner';
import {
    FiPlus, FiEdit2, FiTrash2, FiLink, FiX, FiSearch,
    FiCheck, FiStar, FiChevronDown, FiChevronUp, FiFilter,
    FiRefreshCw, FiBox, FiAlertCircle, FiCheckCircle,
    FiLayers, FiCheckSquare, FiSquare
} from 'react-icons/fi';

function MotorIconPlaceholder({ size = 22, className = "" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="5.5" cy="17.5" r="3.5" />
            <circle cx="18.5" cy="17.5" r="3.5" />
            <path d="M15 6h2l3 5.5V17" />
            <path d="M5.5 17.5h9.5" />
            <path d="m15 11-3-5.5H8.5L5 11.5V17" />
        </svg>
    );
}

// Category group badge colors for distinct visual grouping
const GROUP_COLORS = {
    pelumas_cairan: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    kaki_kaki_roda: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
    pengereman: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    transmisi_penggerak: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    kelistrikan_pengapian: 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/60',
    lampu_saklar: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60',
    mesin_filter: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    bodi_aksesoris: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/60',
    lainnya: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

// Integrated Searchable Product Dropdown Component
function SearchableProductDropdown({ products = [], value, onChange, error }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('semua');
    const containerRef = useRef(null);

    const selectedProduct = useMemo(() => {
        return products.find(p => p.id === value) || null;
    }, [products, value]);

    const categories = useMemo(() => {
        return ['semua', ...new Set(products.map(p => p.category?.name).filter(Boolean))];
    }, [products]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return products.filter(p => {
            const matchesCat = categoryFilter !== 'semua' ? p.category?.name === categoryFilter : true;
            const matchesSearch = q ? (
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q)) ||
                (p.category?.name && p.category.name.toLowerCase().includes(q))
            ) : true;
            return matchesCat && matchesSearch;
        });
    }, [products, search, categoryFilter]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Pilih Produk Sparepart *
            </label>

            {/* Dropdown Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                tabIndex={0}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border rounded-lg text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between gap-2 transition select-none ${
                    isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                } ${error ? 'border-red-500' : ''}`}
            >
                {selectedProduct ? (
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                                src={getProductImage(selectedProduct.image_path, selectedProduct.category?.name)}
                                alt={selectedProduct.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = getProductImage(null, selectedProduct.category?.name);
                                }}
                            />
                        </div>
                        <span className="truncate font-bold text-slate-900 dark:text-white">
                            {selectedProduct.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                            ({selectedProduct.sku || 'No SKU'} · Rp {Number(selectedProduct.price).toLocaleString('id-ID')})
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-400 font-normal">-- Pilih / Cari Produk Sparepart --</span>
                )}
                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                    <FiChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </div>
            </div>

            {/* Dropdown Floating Panel */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    {/* Integrated Search & Filter Header */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-750/90 space-y-1.5">
                        <div className="relative">
                            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Ketik nama produk, SKU, atau kategori..."
                                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                    <FiX size={12} />
                                </button>
                            )}
                        </div>

                        {/* Category filter pills */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                                        categoryFilter === cat
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                    {cat === 'semua' ? 'Semua' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Products List */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                        {filtered.map(p => {
                            const isSelected = p.id === value;
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        onChange(p.id);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between p-2 text-xs cursor-pointer transition ${
                                        isSelected
                                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                        <div className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                            <img
                                                src={getProductImage(p.image_path, p.category?.name)}
                                                alt={p.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = getProductImage(null, p.category?.name);
                                                }}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-extrabold truncate">{p.name}</p>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {p.sku ? `${p.sku} · ` : ''}{p.category?.name || 'Katalog'} · Rp {Number(p.price).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                            Stok: {p.stock}
                                        </span>
                                        {isSelected && (
                                            <FiCheck size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="py-6 text-center text-xs text-slate-400">
                                Tidak ada produk sparepart yang cocok.
                            </div>
                        )}
                    </div>
                </div>
            )}
            {error && <p className="text-[11px] text-red-500 font-bold mt-1">{error}</p>}
        </div>
    );
}

// Integrated Searchable Motor Dropdown Component
function SearchableMotorDropdown({ motorcycles = [], value, onChange, error }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [brandFilter, setBrandFilter] = useState('semua');
    const containerRef = useRef(null);

    const selectedMotor = useMemo(() => {
        return motorcycles.find(m => m.id === value) || null;
    }, [motorcycles, value]);

    const brands = useMemo(() => {
        return ['semua', ...new Set(motorcycles.map(m => m.brand))];
    }, [motorcycles]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return motorcycles.filter(m => {
            const matchesBrand = brandFilter !== 'semua' ? m.brand === brandFilter : true;
            const matchesSearch = q ? (
                m.model.toLowerCase().includes(q) ||
                m.brand.toLowerCase().includes(q) ||
                m.engine_type.toLowerCase().includes(q)
            ) : true;
            return matchesBrand && matchesSearch;
        });
    }, [motorcycles, search, brandFilter]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Pilih Model Motor Sasaran *
            </label>

            {/* Dropdown Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                tabIndex={0}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border rounded-lg text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between gap-2 transition select-none ${
                    isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                } ${error ? 'border-red-500' : ''}`}
            >
                {selectedMotor ? (
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {selectedMotor.image_url ? (
                                <img src={selectedMotor.image_url} alt={selectedMotor.model} className="w-full h-full object-cover" />
                            ) : (
                                <MotorIconPlaceholder size={16} className="text-indigo-600 dark:text-indigo-400" />
                            )}
                        </div>
                        <span className="truncate font-bold text-slate-900 dark:text-white">
                            {selectedMotor.brand} {selectedMotor.model}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                            ({selectedMotor.engine_cc}cc · {selectedMotor.engine_type.toUpperCase()} · {selectedMotor.year_start}{selectedMotor.year_end ? `-${selectedMotor.year_end}` : '-sekarang'})
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-400 font-normal">-- Pilih / Cari Model Motor --</span>
                )}
                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                    <FiChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </div>
            </div>

            {/* Dropdown Floating Panel */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    {/* Integrated Search & Filter Header */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-750/90 space-y-1.5">
                        <div className="relative">
                            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Ketik model motor atau brand..."
                                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                    <FiX size={12} />
                                </button>
                            )}
                        </div>

                        {/* Brand filter pills */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                            {brands.map(brand => (
                                <button
                                    key={brand}
                                    type="button"
                                    onClick={() => setBrandFilter(brand)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                                        brandFilter === brand
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                    {brand === 'semua' ? 'Semua Brand' : brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Motors List */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                        {filtered.map(m => {
                            const isSelected = m.id === value;
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => {
                                        onChange(m.id);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between p-2 text-xs cursor-pointer transition ${
                                        isSelected
                                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                        <div className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                            {m.image_url ? (
                                                <img src={m.image_url} alt={m.model} className="w-full h-full object-cover" />
                                            ) : (
                                                <MotorIconPlaceholder size={16} className="text-slate-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-extrabold truncate">{m.brand} {m.model}</p>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {m.engine_cc}cc · {m.engine_type.toUpperCase()} · {m.year_start}{m.year_end ? `-${m.year_end}` : '-sekarang'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                            {m.parts_count || 0} part
                                        </span>
                                        {isSelected && (
                                            <FiCheck size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="py-6 text-center text-xs text-slate-400">
                                Tidak ada model motor yang sesuai.
                            </div>
                        )}
                    </div>
                </div>
            )}
            {error && <p className="text-[11px] text-red-500 font-bold mt-1">{error}</p>}
        </div>
    );
}

export default function MotorcycleIndex({
    motorcycles = [],
    products = [],
    partCategories = {},
    categoryGroups = {}
}) {
    // Motorcycle Modals & State
    const [showAddModal, setShowAddModal] = useState(false);
    const [editMotorcycle, setEditMotorcycle] = useState(null);
    const [formData, setFormData] = useState({
        brand: 'Honda', model: '', year_start: 2024, year_end: '',
        engine_cc: 110, engine_type: 'matic', image_url: '', image_file: null
    });
    const [formErrors, setFormErrors] = useState({});

    // Filter & Search for Motorcycle List
    const [searchMotor, setSearchMotor] = useState('');
    const [activeBrand, setActiveBrand] = useState(motorcycles[0]?.brand || 'Honda');
    const [activeType, setActiveType] = useState('semua');
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Expanded Motorcycle & Per-Motorcycle Spareparts State
    const [expandedMotor, setExpandedMotor] = useState(null);
    const [partsData, setPartsData] = useState({}); // { [motorId]: { data, current_page, last_page, total, ... } }
    const [partsFilter, setPartsFilter] = useState({}); // { [motorId]: { search, category, group, is_recommended, page, per_page } }
    const [loadingParts, setLoadingParts] = useState({}); // { [motorId]: boolean }

    // Refs for race-condition prevention & search debouncing
    const searchTimersRef = useRef({});
    const fetchSeqRef = useRef({});
    const partsFilterRef = useRef(partsFilter);
    useEffect(() => { partsFilterRef.current = partsFilter; }, [partsFilter]);

    // Clean up debounced timers on unmount
    useEffect(() => {
        return () => {
            Object.values(searchTimersRef.current).forEach(t => clearTimeout(t));
        };
    }, []);

    // Mapping Modals (Add / Edit Single Part Mapping)
    const [showPartModal, setShowPartModal] = useState(null); // motorId or null
    const [editPartModal, setEditPartModal] = useState(null); // { motorId, part } or null
    const [partFormData, setPartFormData] = useState({
        product_id: '', part_category: 'oli_mesin', notes: '', is_recommended: false
    });
    const [partFormErrors, setPartFormErrors] = useState({});
    const [partSearch, setPartSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    // ==========================================
    // BULK MAPPING STATE & HANDLERS
    // ==========================================
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkMode, setBulkMode] = useState('motor_to_parts'); // 'motor_to_parts' | 'part_to_motors'
    const [bulkMotorId, setBulkMotorId] = useState('');
    const [bulkMotorIds, setBulkMotorIds] = useState([]);
    const [bulkProductId, setBulkProductId] = useState('');
    const [bulkProductIds, setBulkProductIds] = useState([]);
    const [bulkCategory, setBulkCategory] = useState('oli_mesin');
    const [bulkNotes, setBulkNotes] = useState('');
    const [bulkIsRecommended, setBulkIsRecommended] = useState(false);
    const [bulkSearch, setBulkSearch] = useState('');
    const [bulkBrandFilter, setBulkBrandFilter] = useState('semua');
    const [bulkCategoryFilter, setBulkCategoryFilter] = useState('semua');
    const [bulkErrors, setBulkErrors] = useState({});
    const [bulkSaving, setBulkSaving] = useState(false);

    // Reset Bulk Form
    const resetBulkForm = (initialMotorId = null) => {
        setBulkMode('motor_to_parts');
        setBulkMotorId(initialMotorId || (motorcycles[0]?.id || ''));
        setBulkMotorIds(initialMotorId ? [initialMotorId] : []);
        setBulkProductId(products[0]?.id || '');
        setBulkProductIds([]);
        setBulkCategory('oli_mesin');
        setBulkNotes('');
        setBulkIsRecommended(false);
        setBulkSearch('');
        setBulkBrandFilter('semua');
        setBulkCategoryFilter('semua');
        setBulkErrors({});
    };

    const openBulkModal = (initialMotorId = null) => {
        resetBulkForm(initialMotorId);
        setShowBulkModal(true);
    };

    // Auto-dismiss notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Reset pagination when motor filters change
    useEffect(() => {
        setPage(1);
    }, [activeBrand, activeType, searchMotor]);

    // Helper to format IDR
    const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

    // Helper to get group key for a category
    const getGroupKey = useCallback((category) => {
        for (const [groupKey, group] of Object.entries(categoryGroups)) {
            if (group.items && group.items[category]) {
                return groupKey;
            }
        }
        return 'lainnya';
    }, [categoryGroups]);

    // Helper to fetch parts for a motorcycle with sequence race-condition guard
    const fetchParts = useCallback(async (motorId, overrideParams = {}) => {
        setLoadingParts(prev => ({ ...prev, [motorId]: true }));

        // Track request sequence to prevent out-of-order race conditions
        const seq = (fetchSeqRef.current[motorId] || 0) + 1;
        fetchSeqRef.current[motorId] = seq;

        try {
            const currentFilter = partsFilterRef.current[motorId] || {
                search: '',
                category: 'semua',
                group: 'semua',
                is_recommended: false,
                page: 1,
                per_page: 5
            };

            const query = {
                page: overrideParams.page !== undefined ? overrideParams.page : currentFilter.page,
                per_page: overrideParams.per_page !== undefined ? overrideParams.per_page : currentFilter.per_page,
                search: overrideParams.search !== undefined ? overrideParams.search : currentFilter.search,
                part_category: overrideParams.category !== undefined ? overrideParams.category : currentFilter.category,
                group: overrideParams.group !== undefined ? overrideParams.group : currentFilter.group,
                is_recommended: overrideParams.is_recommended !== undefined ? (overrideParams.is_recommended ? 1 : '') : (currentFilter.is_recommended ? 1 : ''),
            };

            // Clean up 'semua' values
            if (query.part_category === 'semua') delete query.part_category;
            if (query.group === 'semua') delete query.group;
            if (!query.search) delete query.search;
            if (!query.is_recommended) delete query.is_recommended;

            const res = await window.axios.get(`/motorcycles/${motorId}/parts`, { params: query });

            // Discard response if a newer request was made while this was in flight
            if (fetchSeqRef.current[motorId] !== seq) return;

            setPartsData(prev => ({ ...prev, [motorId]: res.data }));
            setPartsFilter(prev => {
                const prevM = prev[motorId] || {};
                return {
                    ...prev,
                    [motorId]: {
                        ...prevM,
                        ...(overrideParams.category !== undefined && { category: overrideParams.category }),
                        ...(overrideParams.group !== undefined && { group: overrideParams.group }),
                        ...(overrideParams.is_recommended !== undefined && { is_recommended: overrideParams.is_recommended }),
                        page: res.data.current_page || 1,
                        per_page: res.data.per_page || 5,
                    }
                };
            });
        } catch (err) {
            if (fetchSeqRef.current[motorId] === seq) {
                console.error("Gagal memuat sparepart motor", err);
            }
        } finally {
            if (fetchSeqRef.current[motorId] === seq) {
                setLoadingParts(prev => ({ ...prev, [motorId]: false }));
            }
        }
    }, []);

    // Debounced search handler for motorcycle spareparts
    const handleSearchParts = useCallback((motorId, val) => {
        setPartsFilter(prev => ({
            ...prev,
            [motorId]: {
                ...(prev[motorId] || { category: 'semua', group: 'semua', is_recommended: false, page: 1, per_page: 5 }),
                search: val,
                page: 1,
            }
        }));

        if (searchTimersRef.current[motorId]) {
            clearTimeout(searchTimersRef.current[motorId]);
        }

        searchTimersRef.current[motorId] = setTimeout(() => {
            fetchParts(motorId, { search: val, page: 1 });
        }, 300);
    }, [fetchParts]);

    // Instant clear search handler
    const handleClearSearch = useCallback((motorId) => {
        if (searchTimersRef.current[motorId]) {
            clearTimeout(searchTimersRef.current[motorId]);
        }
        setPartsFilter(prev => ({
            ...prev,
            [motorId]: {
                ...(prev[motorId] || { category: 'semua', group: 'semua', is_recommended: false, page: 1, per_page: 5 }),
                search: '',
                page: 1,
            }
        }));
        fetchParts(motorId, { search: '', page: 1 });
    }, [fetchParts]);

    // Toggle expand motorcycle row
    const toggleExpandMotor = (motorId) => {
        if (expandedMotor === motorId) {
            setExpandedMotor(null);
        } else {
            setExpandedMotor(motorId);
            if (!partsData[motorId]) {
                fetchParts(motorId, { page: 1, per_page: 5, search: '', category: 'semua', group: 'semua', is_recommended: false });
            }
        }
    };

    // Reset motorcycle form
    const resetMotorForm = () => {
        setFormData({
            brand: activeBrand || 'Honda',
            model: '',
            year_start: new Date().getFullYear(),
            year_end: '',
            engine_cc: 110,
            engine_type: 'matic',
            image_url: '',
            image_file: null
        });
        setFormErrors({});
    };

    const openEditMotor = (m) => {
        setFormData({
            brand: m.brand,
            model: m.model,
            year_start: m.year_start,
            year_end: m.year_end || '',
            engine_cc: m.engine_cc,
            engine_type: m.engine_type,
            image_url: m.image_url || '',
            image_file: null
        });
        setEditMotorcycle(m);
        setFormErrors({});
        setShowAddModal(true);
    };

    // Frontend validation for motorcycle form
    const validateMotorForm = () => {
        const errors = {};
        if (!formData.brand?.trim()) errors.brand = 'Brand motor wajib diisi.';
        if (!formData.model?.trim()) errors.model = 'Model motor wajib diisi.';
        if (!formData.year_start) errors.year_start = 'Tahun mulai wajib diisi.';
        else if (formData.year_start < 1990 || formData.year_start > 2030) errors.year_start = 'Tahun mulai antara 1990 - 2030.';
        
        if (formData.year_end && formData.year_end < formData.year_start) {
            errors.year_end = 'Tahun akhir tidak boleh lebih kecil dari tahun mulai.';
        }
        if (!formData.engine_cc || formData.engine_cc < 50 || formData.engine_cc > 1500) {
            errors.engine_cc = 'CC mesin antara 50 - 1500.';
        }
        if (!['matic', 'bebek', 'sport'].includes(formData.engine_type)) {
            errors.engine_type = 'Tipe mesin harus matic, bebek, atau sport.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save motorcycle (create or update)
    const handleSaveMotor = async () => {
        if (!validateMotorForm()) return;

        setSaving(true);
        try {
            const data = new FormData();
            data.append('brand', formData.brand);
            data.append('model', formData.model);
            data.append('year_start', formData.year_start);
            if (formData.year_end) data.append('year_end', formData.year_end);
            data.append('engine_cc', formData.engine_cc);
            data.append('engine_type', formData.engine_type);
            if (formData.image_url) data.append('image_url', formData.image_url);
            if (formData.image_file) data.append('image', formData.image_file);

            if (editMotorcycle) {
                data.append('_method', 'PUT');
                await window.axios.post(`/motorcycles/${editMotorcycle.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(`Data motor "${formData.brand} ${formData.model}" (${formData.engine_cc}cc) berhasil diperbarui!`);
            } else {
                await window.axios.post('/motorcycles', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(`Motor "${formData.brand} ${formData.model}" (${formData.engine_cc}cc) berhasil ditambahkan!`);
            }
            router.reload();
            setShowAddModal(false);
            setEditMotorcycle(null);
            resetMotorForm();
        } catch (e) {
            if (e.response?.status === 422 && e.response.data?.errors) {
                setFormErrors(e.response.data.errors);
            } else {
                toast.error(e.response?.data?.message || 'Gagal menyimpan data motor.');
            }
        } finally {
            setSaving(false);
        }
    };

    // Delete motorcycle
    const handleDeleteMotor = async (id, modelName) => {
        if (!confirm(`Hapus motor "${modelName}" beserta semua mapping sparepartnya?`)) return;
        try {
            await window.axios.delete(`/motorcycles/${id}`);
            toast.success(`Motor "${modelName}" beserta semua mappingnya berhasil dihapus!`);
            router.reload();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Gagal menghapus motor.');
        }
    };

    // Frontend validation for attaching single part mapping
    const validatePartForm = () => {
        const errors = {};
        if (!partFormData.product_id) errors.product_id = 'Pilih produk sparepart yang akan di-mapping.';
        if (!partFormData.part_category) errors.part_category = 'Pilih kategori / tipe sparepart.';
        if (partFormData.notes && partFormData.notes.length > 255) errors.notes = 'Catatan maksimal 255 karakter.';
        setPartFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Attach single part to motorcycle
    const handleAttachPart = async () => {
        if (!validatePartForm() || !showPartModal) return;

        setSaving(true);
        try {
            await window.axios.post(`/motorcycles/${showPartModal}/parts`, partFormData);
            const prod = products.find(p => p.id === partFormData.product_id);
            toast.success(`Sparepart "${prod?.name || 'Produk'}" berhasil di-mapping ke motor!`);
            const targetMotorId = showPartModal;
            setShowPartModal(null);
            setPartFormData({ product_id: '', part_category: 'oli_mesin', notes: '', is_recommended: false });
            setPartFormErrors({});
            fetchParts(targetMotorId);
            router.reload({ only: ['motorcycles'] });
        } catch (e) {
            if (e.response?.status === 422 && e.response.data?.errors) {
                setPartFormErrors(e.response.data.errors);
            } else {
                const msg = e.response?.data?.message || 'Gagal menambahkan mapping part.';
                setPartFormErrors({ general: msg });
                toast.error(msg);
            }
        } finally {
            setSaving(false);
        }
    };

    // Open edit part mapping modal
    const openEditPart = (motorId, part) => {
        setEditPartModal({
            motorId,
            partId: part.id,
            productName: part.product?.name,
            sku: part.product?.sku,
            price: part.product?.price,
        });
        setPartFormData({
            product_id: part.product_id,
            part_category: part.part_category,
            notes: part.notes || '',
            is_recommended: Boolean(part.is_recommended),
        });
        setPartFormErrors({});
    };

    // Save edited part mapping
    const handleUpdatePart = async () => {
        if (!editPartModal) return;
        setSaving(true);
        try {
            await window.axios.put(`/motorcycles/${editPartModal.motorId}/parts/${editPartModal.partId}`, {
                part_category: partFormData.part_category,
                notes: partFormData.notes,
                is_recommended: partFormData.is_recommended,
            });
            toast.success(`Mapping sparepart "${editPartModal.productName || 'Produk'}" berhasil diperbarui!`);
            const motorId = editPartModal.motorId;
            setEditPartModal(null);
            setPartFormData({ product_id: '', part_category: 'oli_mesin', notes: '', is_recommended: false });
            setPartFormErrors({});
            fetchParts(motorId);
        } catch (e) {
            if (e.response?.status === 422 && e.response.data?.errors) {
                setPartFormErrors(e.response.data.errors);
            } else {
                const msg = e.response?.data?.message || 'Gagal memperbarui mapping part.';
                setPartFormErrors({ general: msg });
                toast.error(msg);
            }
        } finally {
            setSaving(false);
        }
    };

    // Quick toggle recommendation on a part
    const togglePartRecommendation = async (motorId, part) => {
        try {
            const nextRec = !part.is_recommended;
            await window.axios.put(`/motorcycles/${motorId}/parts/${part.id}`, {
                is_recommended: nextRec,
            });
            toast.success(`Status "${part.product?.name || 'Part'}" diubah ke ${nextRec ? 'Rekomendasi ⭐' : 'Biasa'}.`);
            fetchParts(motorId);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Gagal mengubah status rekomendasi.');
        }
    };

    // Detach part mapping
    const handleDetachPart = async (motorcycleId, partId, productName) => {
        if (!confirm(`Hapus mapping sparepart "${productName || 'ini'}" dari motor?`)) return;
        try {
            await window.axios.delete(`/motorcycles/${motorcycleId}/parts/${partId}`);
            toast.success(`Mapping sparepart "${productName || 'Part'}" berhasil dihapus dari motor!`);
            fetchParts(motorcycleId);
            router.reload({ only: ['motorcycles'] });
        } catch (e) {
            toast.error(e.response?.data?.message || 'Gagal menghapus mapping sparepart.');
        }
    };

    // ==========================================
    // BULK MAPPING SUBMIT & LOGIC
    // ==========================================
    const handleSaveBulkMapping = async () => {
        const errors = {};
        const motorIds = bulkMode === 'motor_to_parts' ? (bulkMotorId ? [bulkMotorId] : []) : bulkMotorIds;
        const prodIds = bulkMode === 'motor_to_parts' ? bulkProductIds : (bulkProductId ? [bulkProductId] : []);

        if (motorIds.length === 0) {
            errors.motorcycles = 'Pilih minimal 1 model motor.';
        }
        if (prodIds.length === 0) {
            errors.products = 'Pilih minimal 1 produk sparepart.';
        }
        if (!bulkCategory) {
            errors.part_category = 'Pilih kategori / tipe sparepart.';
        }

        if (Object.keys(errors).length > 0) {
            setBulkErrors(errors);
            return;
        }

        setBulkSaving(true);
        setBulkErrors({});
        try {
            const payload = {
                motorcycle_ids: motorIds,
                product_ids: prodIds,
                part_category: bulkCategory,
                notes: bulkNotes || null,
                is_recommended: bulkIsRecommended,
            };

            const res = await window.axios.post('/motorcycles/bulk-attach', payload);
            toast.success(res.data.message || 'Bulk mapping berhasil disimpan!');
            setShowBulkModal(false);
            resetBulkForm();

            // Refresh expanded motor data if affected
            motorIds.forEach(mId => {
                if (expandedMotor === mId) {
                    fetchParts(mId);
                }
            });
            router.reload({ only: ['motorcycles'] });
        } catch (e) {
            if (e.response?.status === 422 && e.response.data?.errors) {
                setBulkErrors(e.response.data.errors);
            } else {
                toast.error(e.response?.data?.message || 'Gagal menyimpan bulk mapping.');
            }
        } finally {
            setBulkSaving(false);
        }
    };

    // Filtered products for single mapping modal search
    const filteredProductsForModal = useMemo(() => {
        if (!partSearch.trim()) return products;
        const q = partSearch.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.category?.name && p.category.name.toLowerCase().includes(q))
        );
    }, [products, partSearch]);

    // Filtered products for bulk mapping modal (Mode A: multi-select parts)
    const filteredProductsForBulk = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = bulkCategoryFilter !== 'semua' ? (p.category?.name === bulkCategoryFilter) : true;
            const q = bulkSearch.trim().toLowerCase();
            const matchesSearch = q ? (
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q)) ||
                (p.category?.name && p.category.name.toLowerCase().includes(q))
            ) : true;
            return matchesCategory && matchesSearch;
        });
    }, [products, bulkCategoryFilter, bulkSearch]);

    // Filtered motorcycles for bulk mapping modal (Mode B: multi-select motors)
    const filteredMotorcyclesForBulk = useMemo(() => {
        return motorcycles.filter(m => {
            const matchesBrand = bulkBrandFilter !== 'semua' ? (m.brand === bulkBrandFilter) : true;
            const q = bulkSearch.trim().toLowerCase();
            const matchesSearch = q ? (
                m.model.toLowerCase().includes(q) ||
                m.brand.toLowerCase().includes(q) ||
                m.engine_type.toLowerCase().includes(q)
            ) : true;
            return matchesBrand && matchesSearch;
        });
    }, [motorcycles, bulkBrandFilter, bulkSearch]);

    // Distinct product categories for bulk filter
    const productCategoriesList = useMemo(() => {
        const set = new Set(products.map(p => p.category?.name).filter(Boolean));
        return Array.from(set);
    }, [products]);

    // Distinct brands list
    const brands = useMemo(() => {
        const unique = [...new Set(motorcycles.map(m => m.brand))];
        return unique.length > 0 ? unique : ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki'];
    }, [motorcycles]);

    // Filtered motorcycle list
    const filteredMotorcycles = useMemo(() => {
        return motorcycles.filter(m => {
            const matchesBrand = activeBrand ? m.brand === activeBrand : true;
            const matchesType = activeType !== 'semua' ? m.engine_type === activeType : true;
            const matchesSearch = searchMotor
                ? (m.model.toLowerCase().includes(searchMotor.toLowerCase()) ||
                   m.engine_type.toLowerCase().includes(searchMotor.toLowerCase()) ||
                   m.brand.toLowerCase().includes(searchMotor.toLowerCase()))
                : true;
            return matchesBrand && matchesType && matchesSearch;
        });
    }, [motorcycles, activeBrand, activeType, searchMotor]);

    const totalMotorItems = filteredMotorcycles.length;
    const totalMotorPages = Math.ceil(totalMotorItems / perPage) || 1;
    const paginatedMotorList = filteredMotorcycles.slice((page - 1) * perPage, page * perPage);
    const motorFromIndex = totalMotorItems > 0 ? (page - 1) * perPage + 1 : 0;
    const motorToIndex = Math.min(page * perPage, totalMotorItems);

    return (
        <AuthenticatedLayout pageTitle="Data Motor">
            <Head title="Data Motor & Compatible Spareparts - Toko Sparepart" />

            {/* Floating Global Notification Alert */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-bold border transition-all animate-in fade-in slide-in-from-top-2 ${
                    notification.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                }`}>
                    {notification.type === 'success' ? <FiCheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> : <FiAlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />}
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><FiX size={16} /></button>
                </div>
            )}

            <div className="w-full space-y-4">
                {/* Header & Main Search Bar */}
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Data Motor & Compatible Mapping</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Kelola model motor dan mapping sparepart kompatibel per tipe komponen.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                        <div className="relative flex-1 sm:w-60 md:w-64">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={15} />
                            <input
                                type="text"
                                placeholder="Cari model, brand, tipe..."
                                value={searchMotor}
                                onChange={e => setSearchMotor(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                            />
                            {searchMotor && (
                                <button onClick={() => setSearchMotor('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>

                        {/* Bulk Mapping Button */}
                        <button
                            onClick={() => openBulkModal()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs shrink-0"
                            title="Mapping sparepart ke banyak motor sekaligus"
                        >
                            <FiLayers size={15} /> <span>Bulk Mapping</span>
                        </button>

                        {/* Add Motor Button */}
                        <button
                            onClick={() => { resetMotorForm(); setEditMotorcycle(null); setShowAddModal(true); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs shrink-0"
                        >
                            <FiPlus size={16} /> <span>Tambah Motor</span>
                        </button>
                    </div>
                </div>

                {/* Filter Tabs (Brand & Engine Type - Compact) */}
                <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
                    {/* Brand Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
                        {brands.map(brand => (
                            <button
                                key={brand}
                                onClick={() => { setActiveBrand(brand); setActiveType('semua'); }}
                                className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                                    activeBrand === brand
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                {brand}
                            </button>
                        ))}
                    </div>

                    {/* Engine Type Filter */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        {['semua', 'matic', 'bebek', 'sport'].map(type => (
                            <button
                                key={type}
                                onClick={() => setActiveType(type)}
                                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                                    activeType === type
                                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                                        : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                {type === 'semua' ? 'Semua Tipe Mesin' : type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Motorcycle Models List */}
                {totalMotorItems > 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                        <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                {activeBrand} {activeType !== 'semua' ? `· ${activeType.toUpperCase()}` : ''}
                            </span>
                            <span className="text-xs font-extrabold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                {totalMotorItems} model
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {paginatedMotorList.map(m => {
                                const isExpanded = expandedMotor === m.id;
                                const currentMotorParts = partsData[m.id] || { data: [], total: 0, current_page: 1, last_page: 1, total_mapped: m.parts_count || 0 };
                                const filter = partsFilter[m.id] || { search: '', category: 'semua', group: 'semua', is_recommended: false, page: 1, per_page: 5 };
                                const isLoading = loadingParts[m.id];

                                return (
                                    <div key={m.id} className="transition-colors">
                                        {/* Main Motor Header Row */}
                                        <div
                                            className={`flex items-center justify-between p-3 sm:px-4 cursor-pointer transition-colors gap-2 ${
                                                isExpanded ? 'bg-blue-50/50 dark:bg-blue-950/30' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                                            }`}
                                            onClick={() => toggleExpandMotor(m.id)}
                                        >
                                            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                                                {/* Motor Image / Placeholder */}
                                                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shadow-2xs">
                                                    {m.image_url ? (
                                                        <img src={m.image_url} alt={m.model} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <MotorIconPlaceholder className="text-slate-400 dark:text-slate-500" size={22} />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">{m.model}</span>
                                                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded-md font-extrabold shrink-0">{m.engine_cc}cc</span>
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 border border-slate-200 dark:border-slate-700">{m.engine_type}</span>
                                                    </div>
                                                    <p className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                                        {m.year_start}{m.year_end ? ` - ${m.year_end}` : ' - sekarang'} · <span className="text-blue-600 dark:text-blue-400 font-extrabold">{currentMotorParts.total_mapped ?? m.parts_count ?? 0} sparepart</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditMotor(m); }}
                                                    className="p-2 sm:p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                                    title="Edit Motor"
                                                >
                                                    <FiEdit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteMotor(m.id, `${m.brand} ${m.model}`); }}
                                                    className="p-2 sm:p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                                    title="Hapus Motor"
                                                >
                                                    <FiTrash2 size={15} />
                                                </button>
                                                <div className="p-1.5 text-slate-400">
                                                    {isExpanded ? <FiChevronUp size={18} className="text-blue-600" /> : <FiChevronDown size={18} />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* EXPANDED PANEL: Seamless Unified Sub-Table */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                {/* Unified Compact Responsive Control Bar */}
                                                <div className="px-3 sm:px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
                                                    {/* Search, Dropdowns, and Recommendation Button */}
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                                        {/* Search inside motorcycle parts */}
                                                        <div className="relative w-full sm:w-48 md:w-56 shrink-0">
                                                            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                                            <input
                                                                type="text"
                                                                placeholder="Cari nama part, SKU, catatan..."
                                                                value={filter.search || ''}
                                                                onChange={(e) => handleSearchParts(m.id, e.target.value)}
                                                                className="w-full pl-8 pr-7 py-1.5 sm:py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                                            />
                                                            {filter.search && (
                                                                <button
                                                                    onClick={() => handleClearSearch(m.id)}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                                >
                                                                    <FiX size={12} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Dropdown Filters on mobile/tablet */}
                                                        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 flex-1 min-w-0">
                                                            {/* Group Filter */}
                                                            <select
                                                                value={filter.group}
                                                                onChange={(e) => {
                                                                    const g = e.target.value;
                                                                    setPartsFilter(prev => ({
                                                                        ...prev,
                                                                        [m.id]: { ...filter, group: g, category: 'semua' }
                                                                    }));
                                                                    fetchParts(m.id, { group: g, category: 'semua', page: 1 });
                                                                }}
                                                                className="w-full sm:w-auto py-1.5 sm:py-1 px-2 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            >
                                                                <option value="semua">Semua Grup</option>
                                                                {Object.entries(categoryGroups).map(([gKey, gVal]) => (
                                                                    <option key={gKey} value={gKey}>{gVal.name}</option>
                                                                ))}
                                                            </select>

                                                            {/* Specific Category Filter */}
                                                            <select
                                                                value={filter.category}
                                                                onChange={(e) => {
                                                                    const c = e.target.value;
                                                                    setPartsFilter(prev => ({
                                                                        ...prev,
                                                                        [m.id]: { ...filter, category: c }
                                                                    }));
                                                                    fetchParts(m.id, { category: c, page: 1 });
                                                                }}
                                                                className="w-full sm:w-auto py-1.5 sm:py-1 px-2 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            >
                                                                <option value="semua">Semua Tipe Part</option>
                                                                {Object.entries(categoryGroups).map(([gKey, gVal]) => {
                                                                    if (filter.group !== 'semua' && filter.group !== gKey) return null;
                                                                    return (
                                                                        <optgroup key={gKey} label={gVal.name}>
                                                                            {Object.entries(gVal.items || {}).map(([catKey, catLabel]) => (
                                                                                <option key={catKey} value={catKey}>{catLabel}</option>
                                                                            ))}
                                                                        </optgroup>
                                                                    );
                                                                })}
                                                            </select>
                                                        </div>

                                                        {/* Recommendation Toggle */}
                                                        <button
                                                            onClick={() => {
                                                                const nextRec = !filter.is_recommended;
                                                                setPartsFilter(prev => ({
                                                                    ...prev,
                                                                    [m.id]: { ...filter, is_recommended: nextRec }
                                                                }));
                                                                fetchParts(m.id, { is_recommended: nextRec, page: 1 });
                                                            }}
                                                            className={`py-1.5 sm:py-1 px-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition border shrink-0 ${
                                                                filter.is_recommended
                                                                    ? 'bg-amber-500 text-white border-amber-600'
                                                                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                                                            }`}
                                                            title="Filter sparepart rekomendasi"
                                                        >
                                                            <FiStar size={12} className={filter.is_recommended ? 'fill-white' : 'text-amber-500'} />
                                                            <span>Rekomendasi</span>
                                                        </button>
                                                    </div>

                                                    {/* Right: Tambah Part & Quick Bulk Buttons */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => openBulkModal(m.id)}
                                                            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1.5 sm:py-1 rounded-md font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition"
                                                            title="Bulk mapping banyak part ke motor ini"
                                                        >
                                                            <FiLayers size={13} /> Bulk Part
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowPartModal(m.id);
                                                                setPartSearch('');
                                                                setPartFormData({ product_id: '', part_category: 'oli_mesin', notes: '', is_recommended: false });
                                                                setPartFormErrors({});
                                                            }}
                                                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 sm:py-1 rounded-md font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0 transition"
                                                        >
                                                            <FiLink size={13} /> Tambah Part
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* SPAREPARTS LIST - Clean Seamless Table Rows */}
                                                {isLoading ? (
                                                    <div className="text-center py-6 text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                                                        <FiRefreshCw className="animate-spin text-blue-600" size={16} />
                                                        <span className="text-xs font-bold">Memuat daftar sparepart...</span>
                                                    </div>
                                                ) : (currentMotorParts.data || []).length === 0 ? (
                                                    <div className="py-8 px-4 text-center text-slate-400">
                                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                            {filter.search || filter.category !== 'semua' || filter.group !== 'semua' || filter.is_recommended
                                                                ? 'Tidak ada sparepart yang sesuai dengan filter pencarian.'
                                                                : 'Belum ada sparepart yang di-mapping ke motor ini.'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 mt-1">
                                                            {filter.search || filter.category !== 'semua' || filter.group !== 'semua' || filter.is_recommended
                                                                ? 'Coba ganti kata kunci pencarian atau reset filter di atas.'
                                                                : 'Klik tombol "Tambah Part" atau "Bulk Part" di atas untuk menambahkan sparepart kompatibel.'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {currentMotorParts.data.map(part => {
                                                            const groupKey = getGroupKey(part.part_category);
                                                            const badgeStyle = GROUP_COLORS[groupKey] || GROUP_COLORS.lainnya;
                                                            const categoryLabel = partCategories[part.part_category] || part.part_category;
                                                            const stock = part.product?.stock ?? 0;
                                                            const minStock = part.product?.minimum_stock ?? 5;

                                                            return (
                                                                <div
                                                                    key={part.id}
                                                                    className="px-3 sm:px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-2.5 sm:gap-3 text-xs"
                                                                >
                                                                    {/* Left: Product Thumbnail & Info */}
                                                                    <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                                                                        {/* Product Image Thumbnail */}
                                                                        <div className="w-10 h-10 rounded-lg shrink-0 border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center shadow-2xs">
                                                                            <img
                                                                                src={getProductImage(part.product?.image_path, part.product?.category?.name)}
                                                                                alt={part.product?.name || 'Sparepart'}
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => {
                                                                                    e.target.onerror = null;
                                                                                    e.target.src = getProductImage(null, part.product?.category?.name);
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                                                <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
                                                                                    {part.product?.name}
                                                                                </span>
                                                                                {/* Type Badge */}
                                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badgeStyle}`}>
                                                                                    {categoryLabel}
                                                                                </span>
                                                                                {part.is_recommended && (
                                                                                    <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                                                                        <FiStar size={10} className="fill-amber-500 text-amber-600" /> Rekomendasi
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex items-center gap-2 sm:gap-2.5 mt-0.5 text-[11px] flex-wrap text-slate-500 dark:text-slate-400">
                                                                                {part.product?.sku && (
                                                                                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                                                                        {part.product.sku}
                                                                                    </span>
                                                                                )}
                                                                                <span className="font-black text-blue-600 dark:text-blue-400">
                                                                                    {formatRp(part.product?.price)}
                                                                                </span>
                                                                                <span className={`font-semibold ${stock <= 0 ? 'text-red-500' : stock <= minStock ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                                                    Stok: {stock} {part.product?.unit || 'pcs'}
                                                                                </span>
                                                                                {part.notes && (
                                                                                    <span className="text-slate-400 dark:text-slate-500 italic truncate max-w-[180px] sm:max-w-xs">
                                                                                        · {part.notes}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Right: Actions */}
                                                                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                                                        <button
                                                                            onClick={() => togglePartRecommendation(m.id, part)}
                                                                            className={`p-2 sm:p-1.5 rounded-md border transition cursor-pointer ${
                                                                                part.is_recommended
                                                                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-300 dark:border-amber-700'
                                                                                    : 'text-slate-400 hover:text-amber-500 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                                                            }`}
                                                                            title={part.is_recommended ? 'Hapus dari rekomendasi' : 'Tandai sebagai rekomendasi'}
                                                                        >
                                                                            <FiStar size={14} className={part.is_recommended ? 'fill-amber-500 text-amber-500' : ''} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openEditPart(m.id, part)}
                                                                            className="p-2 sm:p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                                                                            title="Edit Mapping Part"
                                                                        >
                                                                            <FiEdit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDetachPart(m.id, part.id, part.product?.name)}
                                                                            className="p-2 sm:p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                                                                            title="Hapus Mapping Part"
                                                                        >
                                                                            <FiTrash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Unified Bottom Pagination Bar */}
                                                {(currentMotorParts.total || 0) > 0 && (
                                                    <div className="px-3 sm:px-4 py-2 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                                                            <span>
                                                                Menampilkan {currentMotorParts.from || 1} - {currentMotorParts.to || currentMotorParts.total} dari {currentMotorParts.total} sparepart
                                                            </span>
                                                            <select
                                                                value={filter.per_page || 5}
                                                                onChange={(e) => {
                                                                    const pp = parseInt(e.target.value);
                                                                    setPartsFilter(prev => ({
                                                                        ...prev,
                                                                        [m.id]: { ...filter, per_page: pp }
                                                                    }));
                                                                    fetchParts(m.id, { per_page: pp, page: 1 });
                                                                }}
                                                                className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-700 dark:text-slate-200"
                                                            >
                                                                <option value={5}>5 / hal</option>
                                                                <option value={10}>10 / hal</option>
                                                                <option value={20}>20 / hal</option>
                                                            </select>
                                                        </div>

                                                        <div className="flex items-center space-x-1.5">
                                                            <button
                                                                onClick={() => fetchParts(m.id, { page: Math.max((currentMotorParts.current_page || 1) - 1, 1) })}
                                                                disabled={(currentMotorParts.current_page || 1) <= 1}
                                                                className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-40 rounded-md font-bold text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-600 cursor-pointer"
                                                            >
                                                                Sebelumnya
                                                            </button>
                                                            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-md font-extrabold text-xs">
                                                                Hal {currentMotorParts.current_page || 1} dari {currentMotorParts.last_page || 1}
                                                            </span>
                                                            <button
                                                                onClick={() => fetchParts(m.id, { page: Math.min((currentMotorParts.current_page || 1) + 1, currentMotorParts.last_page || 1) })}
                                                                disabled={(currentMotorParts.current_page || 1) >= (currentMotorParts.last_page || 1)}
                                                                className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-40 rounded-md font-bold text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-600 cursor-pointer"
                                                            >
                                                                Berikutnya
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* MOTORCYCLES LIST PAGINATION FOOTER */}
                        {totalMotorItems > 0 && (
                            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Menampilkan {motorFromIndex} - {motorToIndex} dari {totalMotorItems} model motor
                                </span>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                        disabled={page <= 1}
                                        className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
                                    >
                                        Sebelumnya
                                    </button>
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {page} / {totalMotorPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(prev => Math.min(prev + 1, totalMotorPages))}
                                        disabled={page >= totalMotorPages}
                                        className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center py-16 text-slate-400">
                        <p className="text-lg font-extrabold text-slate-700 dark:text-slate-300">Tidak ada data motor</p>
                        <p className="text-xs font-semibold mt-1">
                            {searchMotor ? 'Tidak ditemukan motor yang cocok dengan pencarian.' : 'Klik "Tambah Motor" untuk mulai menambahkan model motor.'}
                        </p>
                    </div>
                )}
            </div>

            {/* ======================================================== */}
            {/* BULK MAPPING MODAL (High-Quality Dual-Mode Interface) */}
            {/* ======================================================== */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4" onClick={() => setShowBulkModal(false)}>
                    <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                                    <FiLayers size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                                        Bulk Mapping Sparepart
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Petakan banyak komponen ke model motor sekaligus secara efisien.
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1">
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Mode Selector Tabs */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setBulkMode('motor_to_parts');
                                    setBulkSearch('');
                                }}
                                className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                    bulkMode === 'motor_to_parts'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <span>1 Motor → Banyak Part</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setBulkMode('part_to_motors');
                                    setBulkSearch('');
                                }}
                                className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                    bulkMode === 'part_to_motors'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <span>1 Part → Banyak Motor</span>
                            </button>
                        </div>

                        {/* Error Alert */}
                        {bulkErrors.general && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg font-semibold flex items-center gap-2">
                                <FiAlertCircle size={15} /> {bulkErrors.general}
                            </div>
                        )}

                        <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
                            {/* MODE A: 1 Motor -> Many Parts */}
                            {bulkMode === 'motor_to_parts' && (
                                <>
                                    {/* Integrated Searchable Single Motor Dropdown */}
                                    <SearchableMotorDropdown
                                        motorcycles={motorcycles}
                                        value={bulkMotorId}
                                        onChange={setBulkMotorId}
                                        error={bulkErrors.motorcycles}
                                    />

                                    {/* Multi-Select Products */}
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    Pilih Sparepart Kompatibel *
                                                </label>
                                                <span className="text-[11px] font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                                                    {bulkProductIds.length} dipilih
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const allIds = filteredProductsForBulk.map(p => p.id);
                                                        setBulkProductIds(Array.from(new Set([...bulkProductIds, ...allIds])));
                                                    }}
                                                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                                                >
                                                    Pilih Semua ({filteredProductsForBulk.length})
                                                </button>
                                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setBulkProductIds([])}
                                                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                                                >
                                                    Reset Pilihan
                                                </button>
                                            </div>
                                        </div>

                                        {/* Product Filters & Search */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                            <div className="relative">
                                                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                                <input
                                                    type="text"
                                                    placeholder="Cari sparepart..."
                                                    value={bulkSearch}
                                                    onChange={e => setBulkSearch(e.target.value)}
                                                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                                {bulkSearch && (
                                                    <button onClick={() => setBulkSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                                        <FiX size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <select
                                                value={bulkCategoryFilter}
                                                onChange={e => setBulkCategoryFilter(e.target.value)}
                                                className="w-full py-1.5 px-2 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
                                            >
                                                <option value="semua">Semua Kategori Katalog</option>
                                                {productCategoriesList.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Checkable List */}
                                        <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-750">
                                            {filteredProductsForBulk.map(p => {
                                                const isSelected = bulkProductIds.includes(p.id);
                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setBulkProductIds(bulkProductIds.filter(id => id !== p.id));
                                                            } else {
                                                                setBulkProductIds([...bulkProductIds, p.id]);
                                                            }
                                                        }}
                                                        className={`flex items-center justify-between p-2 text-xs cursor-pointer transition ${
                                                            isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                                                            <div className={`p-1 rounded text-indigo-600 dark:text-indigo-400 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                                {isSelected ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                                                            </div>
                                                            <div className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                                <img
                                                                    src={getProductImage(p.image_path, p.category?.name)}
                                                                    alt={p.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = getProductImage(null, p.category?.name);
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-extrabold text-slate-900 dark:text-white truncate">{p.name}</p>
                                                                <p className="text-[10px] text-slate-400 truncate">
                                                                    {p.sku ? `${p.sku} · ` : ''}{p.category?.name || 'Katalog'} · {formatRp(p.price)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                                                            Stok: {p.stock}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {filteredProductsForBulk.length === 0 && (
                                                <p className="text-xs text-slate-400 text-center py-6">
                                                    Tidak ada sparepart yang sesuai dengan filter.
                                                </p>
                                            )}
                                        </div>
                                        {bulkErrors.products && <p className="text-[11px] text-red-500 font-bold mt-1">{bulkErrors.products}</p>}
                                    </div>
                                </>
                            )}

                            {/* MODE B: 1 Part -> Many Motors */}
                            {bulkMode === 'part_to_motors' && (
                                <>
                                    {/* Integrated Searchable Single Product Dropdown */}
                                    <SearchableProductDropdown
                                        products={products}
                                        value={bulkProductId}
                                        onChange={setBulkProductId}
                                        error={bulkErrors.products}
                                    />

                                    {/* Multi-Select Motorcycles */}
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    Pilih Model Motor Sasaran *
                                                </label>
                                                <span className="text-[11px] font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                                                    {bulkMotorIds.length} dipilih
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const allIds = filteredMotorcyclesForBulk.map(m => m.id);
                                                        setBulkMotorIds(Array.from(new Set([...bulkMotorIds, ...allIds])));
                                                    }}
                                                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                                                >
                                                    Pilih Semua ({filteredMotorcyclesForBulk.length})
                                                </button>
                                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setBulkMotorIds([])}
                                                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                                                >
                                                    Reset Pilihan
                                                </button>
                                            </div>
                                        </div>

                                        {/* Motor Filters & Search */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                            <div className="relative">
                                                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                                <input
                                                    type="text"
                                                    placeholder="Cari model motor..."
                                                    value={bulkSearch}
                                                    onChange={e => setBulkSearch(e.target.value)}
                                                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                                {bulkSearch && (
                                                    <button onClick={() => setBulkSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                                        <FiX size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <select
                                                value={bulkBrandFilter}
                                                onChange={e => setBulkBrandFilter(e.target.value)}
                                                className="w-full py-1.5 px-2 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
                                            >
                                                <option value="semua">Semua Brand Motor</option>
                                                {brands.map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Checkable List */}
                                        <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-750">
                                            {filteredMotorcyclesForBulk.map(m => {
                                                const isSelected = bulkMotorIds.includes(m.id);
                                                return (
                                                    <div
                                                        key={m.id}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setBulkMotorIds(bulkMotorIds.filter(id => id !== m.id));
                                                            } else {
                                                                setBulkMotorIds([...bulkMotorIds, m.id]);
                                                            }
                                                        }}
                                                        className={`flex items-center justify-between p-2 text-xs cursor-pointer transition ${
                                                            isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                                                            <div className={`p-1 rounded text-indigo-600 dark:text-indigo-400 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                                {isSelected ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                                                            </div>
                                                            <div className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                                {m.image_url ? (
                                                                    <img src={m.image_url} alt={m.model} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <MotorIconPlaceholder size={18} className="text-slate-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-extrabold text-slate-900 dark:text-white truncate">
                                                                    {m.brand} {m.model}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 truncate">
                                                                    {m.engine_cc}cc · {m.engine_type.toUpperCase()} · {m.year_start}{m.year_end ? `-${m.year_end}` : '-sekarang'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                            {m.parts_count || 0} part
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {filteredMotorcyclesForBulk.length === 0 && (
                                                <p className="text-xs text-slate-400 text-center py-6">
                                                    Tidak ada model motor yang sesuai dengan filter.
                                                </p>
                                            )}
                                        </div>
                                        {bulkErrors.motorcycles && <p className="text-[11px] text-red-500 font-bold mt-1">{bulkErrors.motorcycles}</p>}
                                    </div>
                                </>
                            )}

                            {/* Common Bulk Fields (Category, Notes, Recommendation) */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                        Tipe / Kategori Part yang Ditetapkan *
                                    </label>
                                    <select
                                        value={bulkCategory}
                                        onChange={e => setBulkCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        {Object.entries(categoryGroups).map(([gKey, group]) => (
                                            <optgroup key={gKey} label={group.name}>
                                                {Object.entries(group.items || {}).map(([cKey, cLabel]) => (
                                                    <option key={cKey} value={cKey}>{cLabel}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {bulkErrors.part_category && <p className="text-[11px] text-red-500 font-bold mt-1">{bulkErrors.part_category}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                            Catatan Kompatibilitas (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            value={bulkNotes}
                                            onChange={e => setBulkNotes(e.target.value)}
                                            placeholder="Contoh: Cocok untuk varian standar & racing"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                            Tanda Rekomendasi
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-750 px-3 py-2 h-[38px] rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                                            <input
                                                type="checkbox"
                                                checked={bulkIsRecommended}
                                                onChange={e => setBulkIsRecommended(e.target.checked)}
                                                className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 select-none">
                                                <FiStar size={13} className="text-amber-500 fill-amber-400 shrink-0" /> Tandai Rekomendasi
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Total kombinasi:{' '}
                                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                                    {bulkMode === 'motor_to_parts'
                                        ? `${bulkProductIds.length} part ke 1 motor`
                                        : `${bulkMotorIds.length} motor ke 1 part`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkModal(false)}
                                    className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveBulkMapping}
                                    disabled={bulkSaving}
                                    className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer disabled:opacity-50 transition shadow-2xs"
                                >
                                    {bulkSaving ? 'Memproses...' : 'Terapkan Bulk Mapping'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD/EDIT MOTORCYCLE MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                                {editMotorcycle ? 'Edit Data Motor' : 'Tambah Motor Baru'}
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><FiX size={20} /></button>
                        </div>

                        {formErrors.general && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg font-semibold flex items-center gap-2">
                                <FiAlertCircle size={15} /> {formErrors.general}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Brand *</label>
                                    <select
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-semibold"
                                    >
                                        <option value="Honda">Honda</option>
                                        <option value="Yamaha">Yamaha</option>
                                        <option value="Suzuki">Suzuki</option>
                                        <option value="Kawasaki">Kawasaki</option>
                                    </select>
                                    {formErrors.brand && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.brand}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Model *</label>
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        placeholder="Beat, Vario 160..."
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-semibold"
                                    />
                                    {formErrors.model && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.model}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Tahun Mulai *</label>
                                    <input
                                        type="number"
                                        value={formData.year_start}
                                        onChange={e => setFormData({ ...formData, year_start: parseInt(e.target.value) || '' })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-semibold"
                                    />
                                    {formErrors.year_start && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.year_start}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Tahun Akhir</label>
                                    <input
                                        type="number"
                                        value={formData.year_end}
                                        onChange={e => setFormData({ ...formData, year_end: e.target.value ? parseInt(e.target.value) : '' })}
                                        placeholder="Sekarang"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-semibold"
                                    />
                                    {formErrors.year_end && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.year_end}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">CC Mesin *</label>
                                    <input
                                        type="number"
                                        value={formData.engine_cc}
                                        onChange={e => setFormData({ ...formData, engine_cc: parseInt(e.target.value) || '' })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-semibold"
                                    />
                                    {formErrors.engine_cc && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.engine_cc}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Tipe Mesin *</label>
                                <select
                                    value={formData.engine_type}
                                    onChange={e => setFormData({ ...formData, engine_type: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-semibold"
                                >
                                    <option value="matic">Matic</option>
                                    <option value="bebek">Bebek</option>
                                    <option value="sport">Sport</option>
                                </select>
                                {formErrors.engine_type && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.engine_type}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Foto Motor (Upload File / URL Gambar)</label>
                                <div className="flex items-center gap-3">
                                    {(formData.image_file || formData.image_url) && (
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                                            <img
                                                src={formData.image_file ? URL.createObjectURL(formData.image_file) : formData.image_url}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-1.5">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setFormData({ ...formData, image_file: e.target.files[0] })}
                                            className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={formData.image_url}
                                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                            placeholder="Atau masukkan URL gambar (https://...)"
                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-medium"
                                        />
                                    </div>
                                </div>
                                {formErrors.image && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.image}</p>}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveMotor}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer disabled:opacity-50 transition shadow-2xs"
                            >
                                {saving ? 'Menyimpan...' : editMotorcycle ? 'Simpan Perubahan' : 'Tambah Motor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD SINGLE PART MAPPING MODAL */}
            {showPartModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setShowPartModal(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                            <div>
                                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">Mapping Sparepart ke Motor</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Pilih komponen sparepart dan tipe/kategori yang sesuai.</p>
                            </div>
                            <button onClick={() => setShowPartModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><FiX size={20} /></button>
                        </div>

                        {partFormErrors.general && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg font-semibold flex items-center gap-2">
                                <FiAlertCircle size={15} /> {partFormErrors.general}
                            </div>
                        )}

                        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                            {/* Kategori / Tipe Part Dropdown with Optgroups */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tipe / Kategori Part *</label>
                                <select
                                    value={partFormData.part_category}
                                    onChange={e => setPartFormData({ ...partFormData, part_category: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-semibold"
                                >
                                    {Object.entries(categoryGroups).map(([gKey, group]) => (
                                        <optgroup key={gKey} label={group.name}>
                                            {Object.entries(group.items || {}).map(([cKey, cLabel]) => (
                                                <option key={cKey} value={cKey}>{cLabel}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                {partFormErrors.part_category && <p className="text-[11px] text-red-500 font-bold mt-1">{partFormErrors.part_category}</p>}
                            </div>

                            {/* Search Product */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Cari Produk Sparepart *
                                    </label>
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
                                        {partSearch.trim()
                                            ? `${filteredProductsForModal.length} dari ${products.length} sparepart`
                                            : `Total: ${products.length} sparepart`}
                                    </span>
                                </div>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        value={partSearch}
                                        onChange={e => setPartSearch(e.target.value)}
                                        placeholder="Cari nama, SKU, atau kategori..."
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-medium"
                                    />
                                    {partSearch && (
                                        <button onClick={() => setPartSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                            <FiX size={13} />
                                        </button>
                                    )}
                                </div>
                                {partFormErrors.product_id && <p className="text-[11px] text-red-500 font-bold mt-1">{partFormErrors.product_id}</p>}
                            </div>

                            {/* Product Select List */}
                            <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredProductsForModal.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => {
                                            setPartFormData({ ...partFormData, product_id: p.id });
                                            setPartFormErrors(prev => ({ ...prev, product_id: null }));
                                        }}
                                        className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition ${
                                            partFormData.product_id === p.id ? 'bg-blue-50 dark:bg-blue-900/40 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                            <div className="w-12 h-12 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                                                <img
                                                    src={getProductImage(p.image_path, p.category?.name)}
                                                    alt={p.name}
                                                    className="w-full h-full object-cover rounded-md"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = getProductImage(null, p.category?.name);
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-slate-900 dark:text-white truncate">{p.name}</span>
                                                    {p.sku && <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">{p.sku}</span>}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">{p.category?.name || 'Katalog'}</span>
                                                    <span>·</span>
                                                    <span className={`font-semibold ${p.stock <= 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>Stok: {p.stock} {p.unit || 'pcs'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-black text-blue-600 dark:text-blue-400">{formatRp(p.price)}</span>
                                            {partFormData.product_id === p.id && <FiCheck size={16} className="text-blue-600" />}
                                        </div>
                                    </div>
                                ))}
                                {filteredProductsForModal.length === 0 && (
                                    <p className="text-xs text-slate-400 text-center py-6">
                                        Tidak ada sparepart ditemukan untuk kata kunci &quot;{partSearch}&quot;.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                        Catatan Kompatibilitas (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={partFormData.notes}
                                        onChange={e => setPartFormData({ ...partFormData, notes: e.target.value })}
                                        placeholder="Contoh: Cocok untuk varian CBS & ABS"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                    {partFormErrors.notes && <p className="text-[11px] text-red-500 font-bold mt-1">{partFormErrors.notes}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                        Rekomendasi (Opsional)
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-700/60 px-3 py-2 h-[38px] rounded-lg border border-slate-200 dark:border-slate-600 w-full hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                                        <input
                                            type="checkbox"
                                            checked={partFormData.is_recommended}
                                            onChange={e => setPartFormData({ ...partFormData, is_recommended: e.target.checked })}
                                            className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 select-none">
                                            <FiStar size={13} className="text-amber-500 fill-amber-400 shrink-0" /> Tandai Rekomendasi
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => setShowPartModal(null)}
                                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAttachPart}
                                disabled={saving || !partFormData.product_id}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer disabled:opacity-50 transition shadow-2xs"
                            >
                                {saving ? 'Menyimpan...' : 'Tambah Mapping'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT SINGLE PART MAPPING MODAL */}
            {editPartModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setEditPartModal(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                            <div>
                                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">Edit Mapping Sparepart</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{editPartModal.productName}</p>
                            </div>
                            <button onClick={() => setEditPartModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><FiX size={20} /></button>
                        </div>

                        {partFormErrors.general && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg font-semibold flex items-center gap-2">
                                <FiAlertCircle size={15} /> {partFormErrors.general}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tipe / Kategori Part *</label>
                                <select
                                    value={partFormData.part_category}
                                    onChange={e => setPartFormData({ ...partFormData, part_category: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-semibold"
                                >
                                    {Object.entries(categoryGroups).map(([gKey, group]) => (
                                        <optgroup key={gKey} label={group.name}>
                                            {Object.entries(group.items || {}).map(([cKey, cLabel]) => (
                                                <option key={cKey} value={cKey}>{cLabel}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                {partFormErrors.part_category && <p className="text-[11px] text-red-500 font-bold mt-1">{partFormErrors.part_category}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Catatan Kompatibilitas</label>
                                <input
                                    type="text"
                                    value={partFormData.notes}
                                    onChange={e => setPartFormData({ ...partFormData, notes: e.target.value })}
                                    placeholder="Contoh: Cocok untuk varian CBS & ABS"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                                {partFormErrors.notes && <p className="text-[11px] text-red-500 font-bold mt-1">{partFormErrors.notes}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Rekomendasi</label>
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-700/60 px-3 py-2 h-[38px] rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                                    <input
                                        type="checkbox"
                                        checked={partFormData.is_recommended}
                                        onChange={e => setPartFormData({ ...partFormData, is_recommended: e.target.checked })}
                                        className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 select-none">
                                        <FiStar size={13} className="text-amber-500 fill-amber-400 shrink-0" /> Tandai Rekomendasi
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => setEditPartModal(null)}
                                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleUpdatePart}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer disabled:opacity-50 transition shadow-2xs"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
