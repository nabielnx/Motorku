import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MotorcycleSkeleton from '@/Components/Skeletons/MotorcycleSkeleton';
import { Head, router } from '@inertiajs/react';
import { getProductImage } from '@/Utils/productImage';
import { toast } from 'sonner';
import {
    FiPlus, FiEdit2, FiTrash2, FiLink, FiX, FiSearch,
    FiCheck, FiStar, FiChevronDown, FiChevronUp, FiFilter,
    FiRefreshCw, FiBox, FiAlertCircle, FiCheckCircle,
    FiLayers, FiCheckSquare, FiSquare, FiMaximize2, FiChevronLeft, FiChevronRight
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

function ProductThumbnail({ path, size = 'w-8 h-8' }) {
    const [failed, setFailed] = useState(false);

    useEffect(() => setFailed(false), [path]);

    return (
        <div className={`${size} rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center`}>
            {path && !failed ? (
                <img src={getProductImage(path)} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
            ) : (
                <FiBox size={16} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
            )}
        </div>
    );
}

// Category group badge colors (Clean neutral slate badges with high text contrast)
const GROUP_COLORS = {
    pelumas_cairan: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
    kaki_kaki_roda: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
    pengereman: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
    transmisi_penggerak: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
    kelistrikan_pengapian: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
    lampu_saklar: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
    mesin_filter: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
    bodi_aksesoris: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
    lainnya: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
};

// Brand Identity Config (Neutral slate base, Red reserved for Honda branding)
const BRAND_CONFIG = {
    Honda: {
        badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/60 font-bold',
        activeBtn: 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold',
        inactiveBtn: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750',
    },
    Yamaha: {
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-bold',
        activeBtn: 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold',
        inactiveBtn: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750',
    },
    Kawasaki: {
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-bold',
        activeBtn: 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold',
        inactiveBtn: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750',
    },
    Suzuki: {
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-bold',
        activeBtn: 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold',
        inactiveBtn: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750',
    },
    Vespa: {
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-bold',
        activeBtn: 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold',
        inactiveBtn: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750',
    },
    default: {
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-bold',
        activeBtn: 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold',
        inactiveBtn: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750',
    }
};

const getBrandConfig = (brand) => BRAND_CONFIG[brand] || BRAND_CONFIG.default;

// Engine Type Badges & Segmented Buttons
const ENGINE_CONFIG = {
    matic: {
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
        activeBtn: 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 shadow-xs font-semibold',
        label: 'Matic',
    },
    bebek: {
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
        activeBtn: 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 shadow-xs font-semibold',
        label: 'Bebek',
    },
    sport: {
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
        activeBtn: 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 shadow-xs font-semibold',
        label: 'Sport',
    },
};

const getEngineConfig = (type) => ENGINE_CONFIG[type?.toLowerCase()] || {
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
    activeBtn: 'bg-blue-600 text-white shadow-2xs font-semibold',
    label: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Lainnya',
};

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
    const [activeBrand, setActiveBrand] = useState('semua');
    const [activeType, setActiveType] = useState('semua');
    const [showMotorFilters, setShowMotorFilters] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Expanded Motorcycle & Per-Motorcycle Spareparts State
    const [expandedMotor, setExpandedMotor] = useState(null);
    const [partsData, setPartsData] = useState({}); // { [motorId]: { data, current_page, last_page, total, ... } }
    const [partsFilter, setPartsFilter] = useState({}); // { [motorId]: { search, category, group, is_recommended, page, per_page } }
    const [showPartsFilters, setShowPartsFilters] = useState(false);
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
    const [previewMotor, setPreviewMotor] = useState(null);
    const [previewPart, setPreviewPart] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Close preview / confirmation modal on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (deleteConfirm && !isDeleting) setDeleteConfirm(null);
                if (previewMotor) setPreviewMotor(null);
                if (previewPart) setPreviewPart(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewMotor, previewPart, deleteConfirm, isDeleting]);

    // ==========================================
    // BULK MAPPING STATE & HANDLERS
    // ==========================================
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkMotorIds, setBulkMotorIds] = useState([]);
    const [bulkProductIds, setBulkProductIds] = useState([]);
    const [bulkCategory, setBulkCategory] = useState('auto');
    const [bulkNotes, setBulkNotes] = useState('');
    const [bulkIsRecommended, setBulkIsRecommended] = useState(false);
    const [bulkMotorSearch, setBulkMotorSearch] = useState('');
    const [bulkProductSearch, setBulkProductSearch] = useState('');
    const [bulkBrandFilter, setBulkBrandFilter] = useState('semua');
    const [bulkCategoryFilter, setBulkCategoryFilter] = useState('semua');
    const [bulkErrors, setBulkErrors] = useState({});
    const [bulkSaving, setBulkSaving] = useState(false);

    // Reset Bulk Form
    const resetBulkForm = (initialMotorId = null) => {
        setBulkMotorIds(initialMotorId ? [initialMotorId] : []);
        setBulkProductIds([]);
        setBulkCategory('auto');
        setBulkNotes('');
        setBulkIsRecommended(false);
        setBulkMotorSearch('');
        setBulkProductSearch('');
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
        setShowPartsFilters(false);
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
            brand: (activeBrand && activeBrand !== 'semua') ? activeBrand : (brands[0] || 'Honda'),
            model: '',
            year_start: new Date().getFullYear(),
            year_end: '',
            engine_cc: 110,
            engine_type: (activeType && activeType !== 'semua') ? activeType : 'matic',
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

    // Delete motorcycle trigger (opens custom popup)
    const handleDeleteMotor = (id, modelName) => {
        setDeleteConfirm({
            type: 'motorcycle',
            id,
            title: 'Hapus Data Motor',
            name: modelName,
            message: `Apakah Anda yakin ingin menghapus motor "${modelName}" beserta semua mapping sparepartnya? Tindakan ini tidak dapat dibatalkan.`,
        });
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
            router.reload({ only: ['motorcycles', 'products'] });
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

    // Detach part mapping trigger (opens custom popup)
    const handleDetachPart = (motorcycleId, partId, productName) => {
        setDeleteConfirm({
            type: 'part_mapping',
            motorcycleId,
            partId,
            title: 'Hapus Mapping Sparepart',
            name: productName || 'Part',
            message: `Hapus mapping sparepart "${productName || 'ini'}" dari motor? Kompatibilitas untuk motor ini akan dicabut.`,
        });
    };

    // Execute deletion for custom confirmation popup
    const executeDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        setIsDeleting(true);
        try {
            if (deleteConfirm.type === 'part_mapping') {
                await window.axios.delete(`/motorcycles/${deleteConfirm.motorcycleId}/parts/${deleteConfirm.partId}`);
                toast.success(`Mapping sparepart "${deleteConfirm.name}" berhasil dihapus dari motor!`);
                fetchParts(deleteConfirm.motorcycleId);
                router.reload({ only: ['motorcycles', 'products'] });
            } else if (deleteConfirm.type === 'motorcycle') {
                await window.axios.delete(`/motorcycles/${deleteConfirm.id}`);
                toast.success(`Motor "${deleteConfirm.name}" beserta semua mappingnya berhasil dihapus!`);
                router.reload();
            }
            setDeleteConfirm(null);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Gagal menghapus data.');
        } finally {
            setIsDeleting(false);
        }
    };

    // ==========================================
    // BULK MAPPING SUBMIT & LOGIC
    // ==========================================
    const handleSaveBulkMapping = async () => {
        const errors = {};
        const motorIds = bulkMotorIds;
        const prodIds = bulkProductIds;

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
            router.reload({ only: ['motorcycles', 'products'] });
        } catch (e) {
            if (e.response?.status === 422 && e.response.data?.errors) {
                setBulkErrors({ general: Object.values(e.response.data.errors).flat()[0] });
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

    // Filtered products for bulk mapping modal
    const filteredProductsForBulk = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = bulkCategoryFilter !== 'semua' ? (p.category?.name === bulkCategoryFilter) : true;
            const q = bulkProductSearch.trim().toLowerCase();
            const matchesSearch = q ? (
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q)) ||
                (p.category?.name && p.category.name.toLowerCase().includes(q))
            ) : true;
            return matchesCategory && matchesSearch;
        });
    }, [products, bulkCategoryFilter, bulkProductSearch]);

    // Filtered motorcycles for bulk mapping modal
    const filteredMotorcyclesForBulk = useMemo(() => {
        return motorcycles.filter(m => {
            const matchesBrand = bulkBrandFilter !== 'semua' ? (m.brand === bulkBrandFilter) : true;
            const q = bulkMotorSearch.trim().toLowerCase();
            const matchesSearch = q ? (
                m.model.toLowerCase().includes(q) ||
                m.brand.toLowerCase().includes(q) ||
                (m.engine_type || '').toLowerCase().includes(q)
            ) : true;
            return matchesBrand && matchesSearch;
        });
    }, [motorcycles, bulkBrandFilter, bulkMotorSearch]);

    // Distinct product categories for bulk filter
    const productCategoriesList = useMemo(() => {
        const set = new Set(products.map(p => p.category?.name).filter(Boolean));
        return Array.from(set);
    }, [products]);

    // Distinct brands list
    const brands = useMemo(() => {
        const unique = [...new Set(motorcycles.map(m => m.brand).filter(Boolean))];
        return unique.length > 0 ? unique : ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki'];
    }, [motorcycles]);

    // Distinct engine types list
    const engineTypes = useMemo(() => {
        const unique = [...new Set(motorcycles.map(m => (m.engine_type || '').toLowerCase()).filter(Boolean))];
        return unique.length > 0 ? unique : ['matic', 'bebek', 'sport'];
    }, [motorcycles]);

    // Filtered motorcycle list
    const filteredMotorcycles = useMemo(() => {
        return motorcycles.filter(m => {
            const matchesBrand = activeBrand && activeBrand !== 'semua' ? m.brand === activeBrand : true;
            const matchesType = activeType !== 'semua' ? m.engine_type === activeType : true;
            const query = searchMotor.trim().toLowerCase();
            const matchesSearch = !query || [m.model, m.brand, m.engine_type, m.engine_cc, m.year_start, m.year_end]
                .some(value => String(value ?? '').toLowerCase().includes(query));
            return matchesBrand && matchesType && matchesSearch;
        });
    }, [motorcycles, activeBrand, activeType, searchMotor]);

    const totalMotorItems = filteredMotorcycles.length;
    const totalMotorPages = Math.ceil(totalMotorItems / perPage) || 1;
    const paginatedMotorList = filteredMotorcycles.slice((page - 1) * perPage, page * perPage);
    const motorFromIndex = totalMotorItems > 0 ? (page - 1) * perPage + 1 : 0;
    const motorToIndex = Math.min(page * perPage, totalMotorItems);

    return (
        <AuthenticatedLayout pageTitle="Data Motor" noPadding={true}>
            <Head title="Data Motor & Compatible Spareparts" />

            {/* Floating Global Notification Alert */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs sm:text-sm font-bold border transition-all animate-in fade-in slide-in-from-top-2 ${
                    notification.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                }`}>
                    {notification.type === 'success' ? <FiCheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> : <FiAlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />}
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><FiX size={16} /></button>
                </div>
            )}

            <div className="p-1.5 sm:p-4 lg:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* UNIFIED MOTORCYCLE DASHBOARD CONTAINER */}
                <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-xl border-0 sm:border border-slate-200 dark:border-slate-800 shadow-none sm:shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
                    {/* Compact Header & Filter Section */}
                    <div className="p-2 sm:p-3.5 space-y-1.5 sm:space-y-2 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
                        {/* Top Row: Title, Badge & Actions */}
                        <div className="flex items-center justify-between gap-2">
                            {/* Left: Title + Badge */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight shrink-0">
                                    Daftar Motor
                                </h1>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 sm:px-2 sm:py-0.5 sm:rounded-full sm:bg-slate-100 dark:sm:bg-slate-800 sm:border border-slate-200 dark:border-slate-700 shrink-0">
                                    {totalMotorItems}
                                </span>
                            </div>

                            {/* Right: Action Buttons */}
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => openBulkModal()}
                                    className="px-1.5 sm:px-3 py-2 sm:py-1.5 bg-transparent sm:bg-white hover:bg-slate-50 dark:sm:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-200 border-0 sm:border border-slate-300 dark:border-slate-700 rounded-md sm:rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition sm:shadow-2xs"
                                    title="Atur kompatibilitas sparepart ke banyak motor sekaligus"
                                >
                                    <FiLayers size={14} className="text-slate-500 dark:text-slate-400" />
                                    <span className="sm:hidden">Massal</span><span className="hidden sm:inline">Kompatibilitas Massal</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { resetMotorForm(); setEditMotorcycle(null); setShowAddModal(true); }}
                                    className="px-2.5 sm:px-3.5 py-2 sm:py-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                    title="Tambah Data Motor Baru"
                                >
                                    <FiPlus size={15} />
                                    <span className="sm:hidden">Tambah</span><span className="hidden sm:inline">Tambah Motor</span>
                                </button>
                            </div>
                        </div>

                        {/* Filter Bar (Search + Segmented Brand + Segmented Tipe Motor) */}
                        <div className="flex flex-wrap lg:flex-nowrap items-stretch lg:items-center justify-between gap-1.5 lg:gap-2">
                            {/* Left: Search input */}
                            <div className="relative flex-1 min-w-0 lg:max-w-xs">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Cari motor..."
                                    value={searchMotor}
                                    onChange={e => { setSearchMotor(e.target.value); setPage(1); }}
                                    className="w-full pl-9 pr-7 py-1.5 bg-transparent sm:bg-white dark:sm:bg-slate-800 border-0 border-b sm:border border-slate-200 dark:border-slate-700 rounded-none sm:rounded-lg text-sm sm:text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 sm:focus:ring-2 sm:focus:ring-blue-500 transition sm:shadow-2xs"
                                    aria-label="Cari data motor"
                                />
                                {searchMotor && (
                                    <button onClick={() => { setSearchMotor(''); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer" title="Hapus pencarian">
                                        <FiX size={13} />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowMotorFilters(value => !value)}
                                aria-expanded={showMotorFilters}
                                aria-controls="motor-mobile-filters"
                                className={`lg:hidden inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold ${showMotorFilters || activeBrand !== 'semua' || activeType !== 'semua'
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : 'text-slate-600 dark:text-slate-200'}`}
                            >
                                <FiFilter size={13} /> Filter
                                {(activeBrand !== 'semua' || activeType !== 'semua') && <span>{Number(activeBrand !== 'semua') + Number(activeType !== 'semua')}</span>}
                            </button>

                            <div id="motor-mobile-filters" className={`${showMotorFilters ? 'grid' : 'hidden'} grid-cols-2 gap-1.5 w-full lg:hidden`}>
                                <select
                                    value={activeBrand}
                                    onChange={e => { setActiveBrand(e.target.value); setPage(1); }}
                                    aria-label="Filter merek motor"
                                    className="min-w-0 w-full rounded-none border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent px-1 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    <option value="semua">Semua merek</option>
                                    {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                </select>
                                <select
                                    value={activeType}
                                    onChange={e => { setActiveType(e.target.value); setPage(1); }}
                                    aria-label="Filter tipe motor"
                                    className="min-w-0 w-full rounded-none border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent px-1 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    <option value="semua">Semua tipe</option>
                                    {engineTypes.map(type => <option key={type} value={type}>{getEngineConfig(type).label}</option>)}
                                </select>
                            </div>

                            {/* Right: Both Segmented Filters (Merek & Tipe Motor) */}
                            <div className="hidden lg:flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                                {/* Segmented Brand Filter */}
                                <div className="inline-flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs overflow-x-auto no-scrollbar">
                                    <button
                                        type="button"
                                        onClick={() => { setActiveBrand('semua'); setPage(1); }}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer whitespace-nowrap ${
                                            activeBrand === 'semua'
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Semua Merek
                                    </button>
                                    {brands.map(brand => {
                                        const isBrandActive = activeBrand === brand;
                                        return (
                                            <button
                                                key={brand}
                                                type="button"
                                                onClick={() => { setActiveBrand(brand); setPage(1); }}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer whitespace-nowrap ${
                                                    isBrandActive
                                                        ? 'bg-blue-600 text-white shadow-2xs'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {brand}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Segmented Tipe Motor */}
                                <div className="inline-flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs overflow-x-auto no-scrollbar">
                                    {['semua', ...engineTypes].map(type => {
                                        const isTypeActive = activeType === type;
                                        const engCfg = getEngineConfig(type);
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => { setActiveType(type); setPage(1); }}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer whitespace-nowrap ${
                                                    isTypeActive
                                                        ? 'bg-blue-600 text-white shadow-2xs'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {type === 'semua' ? 'Semua Tipe' : engCfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Motorcycle Models List */}
                    {totalMotorItems > 0 ? (
                        <>
                            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {paginatedMotorList.map(m => {
                                const isExpanded = expandedMotor === m.id;
                                const currentMotorParts = partsData[m.id] || { data: [], total: 0, current_page: 1, last_page: 1, total_mapped: m.parts_count || 0 };
                                const filter = partsFilter[m.id] || { search: '', category: 'semua', group: 'semua', is_recommended: false, page: 1, per_page: 5 };
                                const isLoading = loadingParts[m.id];
                                const bCfg = getBrandConfig(m.brand);

                                return (
                                    <div key={m.id} className="transition-colors">
                                        {/* Main Motor Header Row */}
                                        <div
                                            className={`p-2.5 sm:p-3.5 cursor-pointer transition-colors ${
                                                isExpanded ? 'bg-slate-50/90 dark:bg-slate-850' : 'hover:bg-slate-50/70 dark:hover:bg-slate-850/50'
                                            }`}
                                            onClick={() => toggleExpandMotor(m.id)}
                                        >
                                            <div className="flex items-center justify-between gap-2 md:gap-4">
                                                {/* Left: Thumbnail & Model Title + Clean Typography Meta */}
                                                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                                                    {/* Thumbnail: Enlarged frame closer to row boundaries with preview modal on click */}
                                                    <div
                                                        className={`w-12 h-12 sm:w-18 sm:h-18 rounded-md sm:rounded-lg shrink-0 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center border-0 sm:border border-slate-200 dark:border-slate-700 sm:shadow-2xs relative group transition ${
                                                            m.image_url ? 'cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20' : ''
                                                        }`}
                                                        onClick={(e) => {
                                                            if (m.image_url) {
                                                                e.stopPropagation();
                                                                setPreviewMotor(m);
                                                            }
                                                        }}
                                                        title={m.image_url ? `Klik untuk melihat foto ${m.brand} ${m.model}` : m.model}
                                                    >
                                                        {m.image_url ? (
                                                            <>
                                                                <img src={m.image_url} alt={m.model} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-200" />
                                                                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-lg">
                                                                    <div className="p-1 rounded bg-black/60 text-white shadow-xs">
                                                                        <FiMaximize2 size={13} />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <MotorIconPlaceholder className="text-slate-400 dark:text-slate-500" size={32} />
                                                        )}
                                                    </div>

                                                    {/* Model Title & Clean Meta */}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                                                                {m.brand}
                                                            </span>
                                                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                                                                {m.model}
                                                            </h3>
                                                        </div>
                                                        {/* Clean Meta: Typography with improved contrast */}
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{m.engine_cc}cc</span>
                                                            <span>•</span>
                                                            <span className="capitalize text-slate-600 dark:text-slate-300">{m.engine_type}</span>
                                                            <span>•</span>
                                                            <span className="text-slate-600 dark:text-slate-300">{m.year_start}{m.year_end ? ` - ${m.year_end}` : ' - sekarang'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: Clean Status, Actions, Expand Trigger */}
                                                <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-3 shrink-0">
                                                    {/* Mapping Count (Clean green semantic text without heavy box) */}
                                                    <span
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-green-500 dark:text-green-400"
                                                        title={`Motor ini memiliki ${currentMotorParts.total_mapped ?? m.parts_count ?? 0} sparepart kompatibel`}
                                                    >
                                                        <FiCheckCircle size={14} className="text-green-500 dark:text-green-400 shrink-0" />
                                                        <span className="md:hidden">{currentMotorParts.total_mapped ?? m.parts_count ?? 0} part</span>
                                                        <span className="hidden md:inline">{currentMotorParts.total_mapped ?? m.parts_count ?? 0} Part Kompatibel</span>
                                                    </span>

                                                    {/* Quick Actions (Edit & Delete) */}
                                                    <div className={`${isExpanded ? 'flex' : 'hidden'} md:flex items-center gap-1`}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); openEditMotor(m); }}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                                                            title="Edit Data Motor"
                                                            aria-label="Edit Data Motor"
                                                        >
                                                            <FiEdit2 size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteMotor(m.id, `${m.brand} ${m.model}`); }}
                                                            className="p-1 text-red-500 hover:text-red-600 transition cursor-pointer"
                                                            title="Hapus Data Motor"
                                                            aria-label="Hapus Data Motor"
                                                        >
                                                            <FiTrash2 size={15} />
                                                        </button>
                                                    </div>

                                                    {/* Expand / Collapse Button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleExpandMotor(m.id); }}
                                                        className={`inline-flex items-center gap-1.5 p-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-semibold transition border-0 md:border cursor-pointer ${
                                                            isExpanded
                                                                ? 'text-blue-700 dark:text-blue-300 md:bg-blue-50 md:border-blue-200 dark:md:bg-blue-950/60 dark:md:border-blue-800'
                                                                : 'text-slate-500 dark:text-slate-300 md:bg-white dark:md:bg-slate-800 md:border-slate-200 dark:md:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                                                        }`}
                                                        title={isExpanded ? 'Sembunyikan daftar sparepart' : 'Lihat daftar sparepart kompatibel'}
                                                    >
                                                        <span className="hidden md:inline">{isExpanded ? 'Sembunyikan Part' : 'Lihat Part'}</span>
                                                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* EXPANDED PANEL: Seamless Unified Sub-Table */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-100 sm:border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                {/* Unified Single-Row Control Bar */}
                                                <div className="px-2 sm:px-4 py-1 md:py-2 bg-white md:bg-slate-50/80 dark:bg-slate-900 dark:md:bg-slate-800/60 border-b border-slate-100 md:border-slate-200 dark:border-slate-800 flex flex-wrap md:flex-nowrap items-center gap-1.5 md:gap-2">
                                                        {/* Search inside motorcycle parts */}
                                                        <div className="relative flex-1 min-w-0 md:flex-none md:w-44 lg:w-52">
                                                            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                                            <input
                                                                type="text"
                                                                placeholder="Cari sparepart..."
                                                                value={filter.search || ''}
                                                                onChange={(e) => handleSearchParts(m.id, e.target.value)}
                                                                className="w-full pl-8 pr-7 py-1.5 text-sm md:text-xs bg-transparent md:bg-white dark:md:bg-slate-700 border-0 border-b md:border border-slate-200 dark:border-slate-700 rounded-none md:rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 md:focus:ring-1 md:focus:ring-blue-500 font-medium"
                                                                aria-label={`Cari sparepart untuk ${m.brand} ${m.model}`}
                                                            />
                                                            {filter.search && (
                                                                <button
                                                                    onClick={() => handleClearSearch(m.id)}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                                    title="Hapus pencarian"
                                                                >
                                                                    <FiX size={12} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPartsFilters(value => !value)}
                                                            aria-expanded={showPartsFilters}
                                                            aria-controls={`part-filters-${m.id}`}
                                                            className={`md:hidden inline-flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold ${showPartsFilters || filter.group !== 'semua' || filter.category !== 'semua' || filter.is_recommended
                                                                ? 'text-blue-700 dark:text-blue-300'
                                                                : 'text-slate-600 dark:text-slate-200'}`}
                                                        >
                                                            <FiFilter size={13} /> Filter
                                                            {(filter.group !== 'semua' || filter.category !== 'semua' || filter.is_recommended) && (
                                                                <span>{Number(filter.group !== 'semua') + Number(filter.category !== 'semua') + Number(filter.is_recommended)}</span>
                                                            )}
                                                        </button>

                                                        <div id={`part-filters-${m.id}`} className={`${showPartsFilters ? 'grid' : 'hidden'} order-last grid-cols-2 gap-1.5 w-full md:order-none md:w-auto md:flex md:items-center md:gap-2`}>
                                                        {/* Group Filter */}
                                                        <div className="min-w-0 md:shrink-0">
                                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 hidden lg:inline">
                                                                Grup:
                                                            </span>
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
                                                                className="w-full md:w-auto py-1.5 pl-1 md:pl-2.5 pr-7 text-sm md:text-xs bg-transparent md:bg-white dark:md:bg-slate-800 border-0 border-b md:border border-slate-200 md:border-slate-300 dark:border-slate-700 rounded-none md:rounded-md text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-blue-500 md:focus:ring-1 md:focus:ring-blue-500 cursor-pointer"
                                                                title="Filter berdasarkan Grup Part"
                                                                aria-label="Filter grup sparepart"
                                                            >
                                                                <option value="semua">Semua Grup</option>
                                                                {Object.entries(categoryGroups).map(([gKey, gVal]) => (
                                                                    <option key={gKey} value={gKey}>{gVal.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Specific Category Filter */}
                                                        <div className="min-w-0 md:shrink-0">
                                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 hidden lg:inline">
                                                                Jenis:
                                                            </span>
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
                                                                className="w-full md:w-auto py-1.5 pl-1 md:pl-2.5 pr-7 text-sm md:text-xs bg-transparent md:bg-white dark:md:bg-slate-800 border-0 border-b md:border border-slate-200 md:border-slate-300 dark:border-slate-700 rounded-none md:rounded-md text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-blue-500 md:focus:ring-1 md:focus:ring-blue-500 cursor-pointer"
                                                                title="Filter berdasarkan Jenis Part"
                                                                aria-label="Filter jenis sparepart"
                                                            >
                                                                <option value="semua">Semua Jenis</option>
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
                                                            className={`col-span-2 w-full md:w-auto py-1.5 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition border-0 md:border shrink-0 cursor-pointer ${
                                                                filter.is_recommended
                                                                    ? 'text-amber-700 dark:text-amber-300 md:bg-amber-50 md:border-amber-300 dark:md:bg-amber-950/60 dark:md:border-amber-700 md:shadow-2xs'
                                                                    : 'text-slate-600 dark:text-slate-300 md:bg-white dark:md:bg-slate-800 md:border-slate-300 dark:md:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                                                            }`}
                                                            title="Filter sparepart rekomendasi"
                                                        >
                                                            <FiStar size={12} className={filter.is_recommended ? 'fill-amber-500 text-amber-500' : 'text-slate-400'} />
                                                            <span>Rekomendasi</span>
                                                        </button>
                                                    </div>

                                                    {/* Right: Tambah Part Button */}
                                                    <div className="shrink-0 md:ml-auto md:pl-2">
                                                        <button
                                                            onClick={() => {
                                                                setShowPartModal(m.id);
                                                                setPartSearch('');
                                                                setPartFormData({ product_id: '', part_category: 'oli_mesin', notes: '', is_recommended: false });
                                                                setPartFormErrors({});
                                                            }}
                                                            className="text-xs bg-green-500 hover:bg-green-600 active:scale-95 text-white px-2 py-1.5 md:px-3 rounded-md font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                                                            title="Tambah sparepart baru ke motor ini"
                                                            aria-label="Tambah sparepart"
                                                        >
                                                            <FiPlus size={14} /> <span className="hidden md:inline">Tambah Part</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Table Header for clear tabular scanning on md+ screens */}
                                                <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                                                    <div className="col-span-5">Produk Sparepart</div>
                                                    <div className="col-span-2">Kategori</div>
                                                    <div className="col-span-2 text-right">Harga Jual</div>
                                                    <div className="col-span-2 text-center">Stok</div>
                                                    <div className="col-span-1 text-right">Aksi</div>
                                                </div>

                                                {/* SPAREPARTS LIST - Clean Structured Table Rows */}
                                                {isLoading ? (
                                                    <MotorcycleSkeleton rows={4} />
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
                                                                : 'Klik tombol "Tambah Part" di atas untuk menambahkan sparepart kompatibel.'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {currentMotorParts.data.map(part => {
                                                            const categoryLabel = partCategories[part.part_category] || part.part_category;
                                                            const stock = part.product?.stock ?? 0;
                                                            const minStock = part.product?.minimum_stock ?? 5;

                                                            return (
                                                                <div
                                                                    key={part.id}
                                                                    className="px-2.5 sm:px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition grid grid-cols-[minmax(0,1fr)_auto_auto] md:grid-cols-12 md:items-center gap-x-2 gap-y-1.5 md:gap-3 text-xs"
                                                                >
                                                                    {/* Col 1 (5 cols): Thumbnail & Product Info */}
                                                                    <div className="col-span-3 md:col-span-5 flex items-center gap-2.5 md:gap-3 min-w-0">
                                                                        {/* Product Image Thumbnail (Clickable Lightbox) */}
                                                                        <div 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPreviewPart({
                                                                                    ...part.product,
                                                                                    part_category: part.part_category,
                                                                                    categoryLabel,
                                                                                    is_recommended: part.is_recommended,
                                                                                    notes: part.notes,
                                                                                    image_url: getProductImage(part.product?.image_path, part.product?.category?.name)
                                                                                });
                                                                            }}
                                                                            className="w-10 h-10 rounded-md shrink-0 border-0 md:border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-500 hover:shadow-xs transition group"
                                                                            title="Klik untuk melihat foto sparepart resolusi penuh"
                                                                        >
                                                                            <img
                                                                                src={getProductImage(part.product?.image_path, part.product?.category?.name)}
                                                                                alt={part.product?.name || 'Sparepart'}
                                                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                                                                onError={(e) => {
                                                                                    e.target.onerror = null;
                                                                                    e.target.src = getProductImage(null, part.product?.category?.name);
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">
                                                                                <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                                                                    {part.product?.name}
                                                                                </p>
                                                                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 min-w-0">
                                                                                {part.product?.sku && (
                                                                                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate shrink-0 max-w-24 sm:max-w-none">
                                                                                        {part.product.sku}
                                                                                    </span>
                                                                                )}
                                                                                <span className="md:hidden truncate">{categoryLabel}</span>
                                                                                {part.notes && (
                                                                                    <span className="italic truncate max-w-[200px]" title={part.notes}>
                                                                                        • {part.notes}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Col 2 (2 cols): Category (Clean plain text, no box) */}
                                                                    <div className="hidden md:block md:col-span-2">
                                                                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                                            {categoryLabel}
                                                                        </span>
                                                                    </div>

                                                                    {/* Col 3 (2 cols): Price */}
                                                                    <div className="min-w-0 md:col-span-2 md:text-right">
                                                                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tabular-nums">
                                                                            {formatRp(part.product?.price)}
                                                                        </span>
                                                                    </div>

                                                                    {/* Col 4 (2 cols): Stock Status (Clean plain text, no box, no dot) */}
                                                                    <div className="md:col-span-2 md:text-center">
                                                                        <span className={`text-xs font-semibold ${
                                                                            stock <= 0
                                                                                ? 'text-rose-600 dark:text-rose-400'
                                                                                : stock <= minStock
                                                                                ? 'text-amber-600 dark:text-amber-400'
                                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                                        }`}>
                                                                            {stock <= 0 ? 'Habis' : `${stock} ${part.product?.unit || 'pcs'}`}
                                                                        </span>
                                                                    </div>

                                                                    {/* Col 5 (1 col): Actions */}
                                                                    <div className="md:col-span-1 flex items-center justify-end gap-0.5 md:gap-1 shrink-0 -translate-y-1 md:translate-y-0">
                                                                        <button
                                                                            onClick={() => togglePartRecommendation(m.id, part)}
                                                                            className={`p-1.5 rounded-md transition cursor-pointer ${
                                                                                part.is_recommended
                                                                                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                                                                                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                                            }`}
                                                                            title={part.is_recommended ? 'Hapus dari rekomendasi' : 'Tandai sebagai rekomendasi'}
                                                                            aria-label="Tandai rekomendasi"
                                                                        >
                                                                            <FiStar size={15} className={part.is_recommended ? 'fill-amber-400 text-amber-500' : ''} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openEditPart(m.id, part)}
                                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                                                                            title="Edit Mapping Part"
                                                                            aria-label="Edit Mapping Part"
                                                                        >
                                                                            <FiEdit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDetachPart(m.id, part.id, part.product?.name)}
                                                                            className="p-1 text-red-500 hover:text-red-600 transition cursor-pointer"
                                                                            title="Hapus Mapping Part"
                                                                            aria-label="Hapus Mapping Part"
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
                                                    <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white sm:bg-slate-50/80 dark:bg-slate-900 dark:sm:bg-slate-850 border-t border-slate-100 sm:border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium min-w-0">
                                                            <span className="hidden sm:inline">
                                                                Menampilkan {currentMotorParts.from || 1} - {currentMotorParts.to || currentMotorParts.total} dari {currentMotorParts.total} sparepart
                                                            </span>
                                                            <span className="sm:hidden whitespace-nowrap">{currentMotorParts.from || 1}–{currentMotorParts.to || currentMotorParts.total} / {currentMotorParts.total} part</span>
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
                                                                className="pl-1 sm:pl-2 pr-5 sm:pr-6 py-1 bg-transparent sm:bg-white dark:sm:bg-slate-800 border-0 sm:border border-slate-300 dark:border-slate-700 rounded-none sm:rounded-md text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                                                                aria-label="Jumlah sparepart per halaman"
                                                            >
                                                                <option value={5}>5 / hal</option>
                                                                <option value={10}>10 / hal</option>
                                                                <option value={20}>20 / hal</option>
                                                            </select>
                                                        </div>

                                                        <div className="flex items-center gap-1 sm:gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => fetchParts(m.id, { page: Math.max((currentMotorParts.current_page || 1) - 1, 1) })}
                                                                disabled={(currentMotorParts.current_page || 1) <= 1}
                                                                className="p-2 sm:px-3.5 sm:py-1.5 bg-transparent sm:bg-white dark:sm:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-md sm:rounded-lg text-xs font-bold text-slate-600 dark:text-slate-200 transition border-0 sm:border border-slate-300 dark:border-slate-700 sm:shadow-2xs cursor-pointer"
                                                                aria-label="Halaman sparepart sebelumnya"
                                                            >
                                                                <FiChevronLeft className="sm:hidden" size={15} /><span className="hidden sm:inline">Sebelumnya</span>
                                                            </button>
                                                            <span className="px-1 sm:px-3 py-1 bg-transparent sm:bg-slate-100 dark:sm:bg-slate-800 border-0 sm:border border-slate-300 dark:border-slate-700 rounded-none sm:rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                                                {currentMotorParts.current_page || 1} / {currentMotorParts.last_page || 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => fetchParts(m.id, { page: Math.min((currentMotorParts.current_page || 1) + 1, currentMotorParts.last_page || 1) })}
                                                                disabled={(currentMotorParts.current_page || 1) >= (currentMotorParts.last_page || 1)}
                                                                className="p-2 sm:px-3.5 sm:py-1.5 bg-transparent sm:bg-white dark:sm:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-md sm:rounded-lg text-xs font-bold text-slate-600 dark:text-slate-200 transition border-0 sm:border border-slate-300 dark:border-slate-700 sm:shadow-2xs cursor-pointer"
                                                                aria-label="Halaman sparepart berikutnya"
                                                            >
                                                                <FiChevronRight className="sm:hidden" size={15} /><span className="hidden sm:inline">Selanjutnya</span>
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
                            <div className="px-2.5 sm:px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900 shrink-0 z-10">
                                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    <span className="sm:hidden">{motorFromIndex}–{motorToIndex} / {totalMotorItems}</span>
                                    <span className="hidden sm:inline">Menampilkan {motorFromIndex} - {motorToIndex} dari {totalMotorItems} model motor</span>
                                </span>
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                        disabled={page <= 1}
                                        className="p-2 sm:px-3.5 sm:py-1.5 bg-transparent sm:bg-white dark:sm:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-md sm:rounded-lg text-xs font-bold text-slate-600 dark:text-slate-200 transition border-0 sm:border border-slate-300 dark:border-slate-700 sm:shadow-2xs cursor-pointer"
                                        aria-label="Halaman motor sebelumnya"
                                    >
                                        <FiChevronLeft className="sm:hidden" size={15} /><span className="hidden sm:inline">Sebelumnya</span>
                                    </button>
                                    <span className="px-1 sm:px-3 py-1 bg-transparent sm:bg-slate-100 dark:sm:bg-slate-800 border-0 sm:border border-slate-300 dark:border-slate-700 rounded-none sm:rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                        {page} / {totalMotorPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(prev => Math.min(prev + 1, totalMotorPages))}
                                        disabled={page >= totalMotorPages}
                                        className="p-2 sm:px-3.5 sm:py-1.5 bg-transparent sm:bg-white dark:sm:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-md sm:rounded-lg text-xs font-bold text-slate-600 dark:text-slate-200 transition border-0 sm:border border-slate-300 dark:border-slate-700 sm:shadow-2xs cursor-pointer"
                                        aria-label="Halaman motor berikutnya"
                                    >
                                        <FiChevronRight className="sm:hidden" size={15} /><span className="hidden sm:inline">Selanjutnya</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        </>
                    ) : (
                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-16 text-slate-400">
                        <p className="text-base font-extrabold text-slate-700 dark:text-slate-300">Tidak ada data motor</p>
                        <p className="text-xs font-semibold mt-1 text-center px-4">
                            {searchMotor || activeBrand !== 'semua' || activeType !== 'semua'
                                ? 'Coba ubah pencarian atau filter motor.'
                                : 'Klik "Tambah Motor" untuk mulai menambahkan model motor.'}
                        </p>
                        {(searchMotor || activeBrand !== 'semua' || activeType !== 'semua') && (
                            <button
                                type="button"
                                onClick={() => { setSearchMotor(''); setActiveBrand('semua'); setActiveType('semua'); setPage(1); }}
                                className="mt-3 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                            >
                                Reset pencarian & filter
                            </button>
                        )}
                    </div>
                )}
                </div>
            </div>

            {/* ======================================================== */}
            {/* BULK COMPATIBILITY MODAL (Atur Kompatibilitas Massal) */}
            {/* ======================================================== */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4" onClick={() => setShowBulkModal(false)}>
                    <div className="bg-white dark:bg-slate-900 sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-dvh sm:h-[94vh] sm:max-h-[900px] p-4 sm:p-6 lg:p-8 gap-3 sm:gap-5 flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-start justify-between pb-1">
                            <div>
                                <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                                    Kompatibilitas Massal
                                </h3>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1" title="Tutup">
                                <FiX size={20} />
                            </button>
                        </div>

                        {bulkErrors.general && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-md font-semibold flex items-center gap-2">
                                <FiAlertCircle size={15} /> {bulkErrors.general}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto min-h-0 flex-1 pr-1">
                            <section className="flex flex-col min-h-0">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Motor * <span className="text-blue-600 dark:text-blue-400 ml-1">{bulkMotorIds.length} dipilih</span></div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <button type="button" onClick={() => setBulkMotorIds(prev => Array.from(new Set([...prev, ...filteredMotorcyclesForBulk.map(m => m.id)])))} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Pilih semua</button>
                                        <button type="button" onClick={() => setBulkMotorIds([])} className="text-slate-500 dark:text-slate-400 hover:underline">Kosongkan</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input type="search" aria-label="Cari motor" placeholder="Cari motor..." value={bulkMotorSearch} onChange={e => setBulkMotorSearch(e.target.value)} className="w-full min-w-0 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                    <select aria-label="Filter merek motor" value={bulkBrandFilter} onChange={e => setBulkBrandFilter(e.target.value)} className="w-full min-w-0 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200">
                                        <option value="semua">Semua merek</option>
                                        {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                    </select>
                                </div>
                                <div className="max-h-48 lg:max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700">
                                    {filteredMotorcyclesForBulk.map(motor => {
                                        const selected = bulkMotorIds.includes(motor.id);
                                        return (
                                            <label key={motor.id} className={'flex items-center gap-2.5 p-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ' + (selected ? 'bg-blue-50 dark:bg-slate-800/60' : '')}>
                                                <input type="checkbox" checked={selected} onChange={() => setBulkMotorIds(prev => selected ? prev.filter(id => id !== motor.id) : [...prev, motor.id])} className="w-4 h-4 shrink-0 rounded text-blue-600 border-slate-300 dark:border-slate-600" />
                                                <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                    {motor.image_url ? <img src={motor.image_url} alt="" className="w-full h-full object-cover" /> : <MotorIconPlaceholder size={16} className="text-slate-400" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white truncate">{motor.brand} {motor.model}</p>
                                                    <p className="text-slate-500 dark:text-slate-400 truncate">{motor.engine_cc}cc · {motor.year_start}{motor.year_end ? '-' + motor.year_end : '-sekarang'}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                    {filteredMotorcyclesForBulk.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Motor tidak ditemukan.</p>}
                                </div>
                                {bulkErrors.motorcycles && <p className="text-[11px] text-red-500 font-bold mt-1">{bulkErrors.motorcycles}</p>}
                            </section>

                            <section className="flex flex-col min-h-0">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Sparepart * <span className="text-blue-600 dark:text-blue-400 ml-1">{bulkProductIds.length} dipilih</span></div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <button type="button" onClick={() => setBulkProductIds(prev => Array.from(new Set([...prev, ...filteredProductsForBulk.map(p => p.id)])))} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Pilih semua</button>
                                        <button type="button" onClick={() => setBulkProductIds([])} className="text-slate-500 dark:text-slate-400 hover:underline">Kosongkan</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input type="search" aria-label="Cari sparepart" placeholder="Cari part..." value={bulkProductSearch} onChange={e => setBulkProductSearch(e.target.value)} className="w-full min-w-0 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                    <select aria-label="Filter kategori sparepart" value={bulkCategoryFilter} onChange={e => setBulkCategoryFilter(e.target.value)} className="w-full min-w-0 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200">
                                        <option value="semua">Semua kategori</option>
                                        {productCategoriesList.map(category => <option key={category} value={category}>{category}</option>)}
                                    </select>
                                </div>
                                <div className="max-h-48 lg:max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700">
                                    {filteredProductsForBulk.map(product => {
                                        const selected = bulkProductIds.includes(product.id);
                                        return (
                                            <label key={product.id} className={'flex items-center gap-2.5 p-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ' + (selected ? 'bg-blue-50 dark:bg-slate-800/60' : '')}>
                                                <input type="checkbox" checked={selected} onChange={() => setBulkProductIds(prev => selected ? prev.filter(id => id !== product.id) : [...prev, product.id])} className="w-4 h-4 shrink-0 rounded text-blue-600 border-slate-300 dark:border-slate-600" />
                                                <ProductThumbnail path={product.image_path} size="w-8 h-8" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white truncate">{product.name}</p>
                                                    <p className="text-slate-500 dark:text-slate-400 truncate">{product.sku || '-'} · {formatRp(product.price)}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                    {filteredProductsForBulk.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Sparepart tidak ditemukan.</p>}
                                </div>
                                {bulkErrors.products && <p className="text-[11px] text-red-500 font-bold mt-1">{bulkErrors.products}</p>}
                            </section>
                            {/* Common Bulk Fields (Category, Notes, Recommendation) */}
                            <div className="lg:col-span-2 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                        Kategori part *
                                    </label>
                                    <select
                                        value={bulkCategory}
                                        onChange={e => setBulkCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="auto">Otomatis dari nama</option>
                                        {Object.entries(categoryGroups).map(([gKey, group]) => (
                                            <optgroup key={gKey} label={group.name}>
                                                {Object.entries(group.items || {}).map(([cKey, cLabel]) => (
                                                    <option key={cKey} value={cKey}>{cLabel}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {bulkCategory !== 'auto' && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                                            Kategori ini berlaku untuk semua pilihan.
                                        </p>
                                    )}
                                    {bulkErrors.part_category && <p className="text-[11px] text-red-500 font-bold mt-1">{bulkErrors.part_category}</p>}
                                </div>

                                <details className="group">
                                    <summary className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 list-none flex items-center gap-1">
                                        <FiChevronDown size={14} className="transition group-open:rotate-180" /> Catatan & rekomendasi
                                    </summary>
                                    <div className="grid grid-cols-1 gap-3 pt-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                            Catatan
                                        </label>
                                        <input
                                            type="text"
                                            value={bulkNotes}
                                            onChange={e => setBulkNotes(e.target.value)}
                                            placeholder="Contoh: Varian racing"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={bulkIsRecommended}
                                                onChange={e => setBulkIsRecommended(e.target.checked)}
                                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer border-slate-300 dark:border-slate-600"
                                            />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <FiStar size={13} className="text-amber-500 fill-amber-400 shrink-0" />
                                                Rekomendasikan
                                            </span>
                                        </label>
                                    </div>
                                    </div>
                                </details>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <div className="hidden sm:block text-sm text-slate-600 dark:text-slate-400 font-semibold">
                                Pilihan:{' '}
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {bulkMotorIds.length} motor × {bulkProductIds.length} sparepart
                                </span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkModal(false)}
                                    className="px-3 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 text-xs font-semibold transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveBulkMapping()}
                                    disabled={bulkSaving}
                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                                >
                                    {bulkSaving ? (
                                        <>
                                            <FiRefreshCw size={14} className="animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck size={16} />
                                            <span>Simpan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD/EDIT MOTORCYCLE MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <h3 className="font-black text-lg text-slate-900 dark:text-white">
                                {editMotorcycle ? 'Edit Data Motor' : 'Tambah Motor Baru'}
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"><FiX size={20} /></button>
                        </div>

                        {formErrors.general && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-md font-semibold flex items-center gap-2">
                                <FiAlertCircle size={15} /> {formErrors.general}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Brand *</label>
                                    <input
                                        type="text"
                                        list="motorcycle-brands-list"
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        placeholder="Ketik atau pilih brand..."
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    />
                                    <datalist id="motorcycle-brands-list">
                                        {brands.map(b => (
                                            <option key={b} value={b} />
                                        ))}
                                    </datalist>
                                    {formErrors.brand && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.brand}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Model *</label>
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        placeholder="Beat, Vario 160..."
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    />
                                    {formErrors.model && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.model}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tahun Mulai *</label>
                                    <input
                                        type="number"
                                        value={formData.year_start}
                                        onChange={e => setFormData({ ...formData, year_start: parseInt(e.target.value) || '' })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    />
                                    {formErrors.year_start && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.year_start}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tahun Akhir</label>
                                    <input
                                        type="number"
                                        value={formData.year_end}
                                        onChange={e => setFormData({ ...formData, year_end: e.target.value ? parseInt(e.target.value) : '' })}
                                        placeholder="Sekarang"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    />
                                    {formErrors.year_end && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.year_end}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">CC Mesin *</label>
                                    <input
                                        type="number"
                                        value={formData.engine_cc}
                                        onChange={e => setFormData({ ...formData, engine_cc: parseInt(e.target.value) || '' })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    />
                                    {formErrors.engine_cc && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.engine_cc}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tipe Mesin *</label>
                                <input
                                    type="text"
                                    list="motorcycle-types-list"
                                    value={formData.engine_type}
                                    onChange={e => setFormData({ ...formData, engine_type: e.target.value.toLowerCase() })}
                                    placeholder="Ketik atau pilih tipe mesin (matic, bebek, sport, trail, listrik...)"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                />
                                <datalist id="motorcycle-types-list">
                                    {engineTypes.map(t => (
                                        <option key={t} value={t} />
                                    ))}
                                </datalist>
                                {formErrors.engine_type && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.engine_type}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Foto Motor (Upload File / URL Gambar)</label>
                                <div className="flex items-center gap-3">
                                    {(formData.image_file || formData.image_url) && (
                                        <div className="w-12 h-12 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
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
                                            className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-200 dark:file:bg-slate-700 file:text-slate-800 dark:file:text-slate-200 hover:file:bg-slate-300 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={formData.image_url}
                                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                            placeholder="Atau masukkan URL gambar (https://...)"
                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium"
                                        />
                                    </div>
                                </div>
                                {formErrors.image && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.image}</p>}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveMotor}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50 transition shadow-xs"
                            >
                                {saving ? 'Menyimpan...' : editMotorcycle ? 'Simpan Perubahan' : 'Tambah Motor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD SINGLE PART MAPPING MODAL */}
            {showPartModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setShowPartModal(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">Mapping Sparepart ke Motor</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pilih komponen sparepart dan tipe/kategori yang sesuai.</p>
                            </div>
                            <button onClick={() => setShowPartModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"><FiX size={20} /></button>
                        </div>

                        {partFormErrors.general && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-md font-semibold flex items-center gap-2">
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
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold"
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
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-700">
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
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-medium"
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
                            <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md divide-y divide-slate-100 dark:divide-slate-750">
                                {filteredProductsForModal.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => setPartFormData({
                                            ...partFormData,
                                            product_id: p.id,
                                            part_category: p.default_part_category || partFormData.part_category
                                        })}
                                        className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition ${
                                            partFormData.product_id === p.id ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                            <div className="w-11 h-11 rounded-md shrink-0 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                                                <img
                                                    src={getProductImage(p.image_path, p.category?.name)}
                                                    alt={p.name}
                                                    className="w-full h-full object-cover rounded"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = getProductImage(null, p.category?.name);
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-slate-900 dark:text-white truncate">{p.name}</span>
                                                    {p.sku && <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded">{p.sku}</span>}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{p.category?.name || 'Katalog'}</span>
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
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                    {partFormErrors.notes && <p className="text-[11px] text-red-500 font-bold mt-1">{partFormErrors.notes}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                        Rekomendasi (Opsional)
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-2 h-[38px] rounded-md border border-slate-300 dark:border-slate-700 w-full hover:bg-slate-100 dark:hover:bg-slate-750 transition">
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

                        <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setShowPartModal(null)}
                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAttachPart}
                                disabled={saving || !partFormData.product_id}
                                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50 transition shadow-xs"
                            >
                                {saving ? 'Menyimpan...' : 'Tambah Mapping'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT SINGLE PART MAPPING MODAL */}
            {editPartModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setEditPartModal(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">Edit Mapping Sparepart</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{editPartModal.productName}</p>
                            </div>
                            <button onClick={() => setEditPartModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"><FiX size={20} /></button>
                        </div>

                        {partFormErrors.general && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-md font-semibold flex items-center gap-2">
                                <FiAlertCircle size={15} /> {partFormErrors.general}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tipe / Kategori Part *</label>
                                <select
                                    value={partFormData.part_category}
                                    onChange={e => setPartFormData({ ...partFormData, part_category: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold"
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
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                                {partFormErrors.notes && <p className="text-[11px] text-red-500 font-bold mt-1">{partFormErrors.notes}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Rekomendasi</label>
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-2 h-[38px] rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition">
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

                        <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setEditPartModal(null)}
                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleUpdatePart}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50 transition shadow-xs"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MOTORCYCLE IMAGE PREVIEW MODAL (LIGHTBOX)               */}
            {/* ======================================================== */}
            {previewMotor && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
                    onClick={() => setPreviewMotor(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {previewMotor.brand}
                                    </span>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                                        {previewMotor.model}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                    {previewMotor.engine_cc}cc • <span className="capitalize">{previewMotor.engine_type}</span> • {previewMotor.year_start}{previewMotor.year_end ? ` - ${previewMotor.year_end}` : ' - sekarang'}
                                </p>
                            </div>
                            <button
                                onClick={() => setPreviewMotor(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Tutup (Esc)"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Modal Body: Large Image Display */}
                        <div className="p-6 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-center min-h-[260px] max-h-[60vh] overflow-hidden">
                            <img
                                src={previewMotor.image_url}
                                alt={`${previewMotor.brand} ${previewMotor.model}`}
                                className="max-h-[50vh] w-auto max-w-full object-contain rounded-lg drop-shadow-md select-none"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium">Foto referensi model motor untuk pembeli di lapangan</span>
                            <button
                                onClick={() => setPreviewMotor(null)}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-md transition cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* SPAREPART IMAGE PREVIEW MODAL (LIGHTBOX)                 */}
            {/* ======================================================== */}
            {previewPart && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
                    onClick={() => setPreviewPart(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        {previewPart.categoryLabel || previewPart.category?.name || 'Sparepart'}
                                    </span>
                                    {previewPart.sku && (
                                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                                            · {previewPart.sku}
                                        </span>
                                    )}
                                    {previewPart.is_recommended && (
                                        <span title="Rekomendasi untuk motor ini" className="shrink-0 inline-flex items-center text-amber-500">
                                            <FiStar size={14} className="fill-amber-400 text-amber-500" />
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate mt-0.5" title={previewPart.name}>
                                    {previewPart.name}
                                </h3>
                            </div>
                            <button
                                onClick={() => setPreviewPart(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                                title="Tutup (Esc)"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Modal Body: Large Image Display */}
                        <div className="p-6 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-center min-h-[260px] max-h-[60vh] overflow-hidden">
                            <img
                                src={previewPart.image_url}
                                alt={previewPart.name}
                                className="max-h-[50vh] w-auto max-w-full object-contain rounded-lg drop-shadow-md select-none"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <div>
                                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 block">
                                    Rp {Number(previewPart.price || 0).toLocaleString('id-ID')}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    Persediaan: {previewPart.stock ?? 0} pcs {previewPart.notes ? `• ${previewPart.notes}` : ''}
                                </span>
                            </div>
                            <button
                                onClick={() => setPreviewPart(null)}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-md transition cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM CONFIRMATION MODAL POPUP */}
            {deleteConfirm && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-4 animate-in fade-in duration-150 backdrop-blur-xs"
                    onClick={() => !isDeleting && setDeleteConfirm(null)}
                >
                    <div 
                        className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transform transition-all animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <FiTrash2 size={22} className="text-red-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                                    {deleteConfirm.title}
                                </h3>
                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Konfirmasi Tindakan</p>
                            </div>
                        </div>

                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                            {deleteConfirm.message}
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isDeleting}
                                className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={executeDeleteConfirm}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-lg transition border border-red-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <FiRefreshCw size={13} className="animate-spin" />
                                        <span>Menghapus...</span>
                                    </>
                                ) : (
                                    <span>Ya, Hapus</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
