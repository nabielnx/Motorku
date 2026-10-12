import AdminButton from '@/Components/Admin/Button';

import { getBrandConfig } from '@/Components/Motorcycle/presentation';
import useMotorcycleParts from '@/Hooks/useMotorcycleParts';
import BulkMappingModal from '@/Components/Motorcycle/BulkMappingModal';
import MotorcycleFormModal from '@/Components/Motorcycle/MotorcycleFormModal';
import AttachPartModal from '@/Components/Motorcycle/AttachPartModal';
import EditPartModal from '@/Components/Motorcycle/EditPartModal';
import MotorcyclePreviewModal from '@/Components/Motorcycle/MotorcyclePreviewModal';
import PartPreviewModal from '@/Components/Motorcycle/PartPreviewModal';
import DeleteMappingModal from '@/Components/Motorcycle/DeleteMappingModal';

import { useState, useEffect, useCallback, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MotorcycleSkeleton from '@/Components/Skeletons/MotorcycleSkeleton';
import { Head, router } from '@inertiajs/react';
import { getProductImage } from '@/Utils/productImage';
import { POS_CART_KEY, formatPosProduct, readPosCart, addToPosCart } from '@/Utils/posCart';
import { ProductPhoto } from '@/Components/Customer/Storefront';
import MotorIcon from '@/Components/MotorIcon';
import { toast } from 'sonner';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiStar, FiChevronDown, FiChevronUp, FiFilter, FiAlertCircle, FiCheckCircle, FiLayers, FiMaximize2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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
    const [showPartsFilters, setShowPartsFilters] = useState(false);
    const { partsData, partsFilter, setPartsFilter, loadingParts, fetchParts, handleSearchParts, handleClearSearch } = useMotorcycleParts();

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

    const addPartToPosCart = product => {
        let nextCart;
        try {
            nextCart = addToPosCart(readPosCart(localStorage), formatPosProduct(product));
        } catch (error) {
            toast.error(error.message);
            return;
        }
        try {
            localStorage.setItem(POS_CART_KEY, JSON.stringify(nextCart));
        } catch {
            toast.error('Keranjang POS tidak dapat disimpan. Periksa penyimpanan browser lalu coba lagi.');
            return;
        }
        toast.success(`${product.name} (+1) masuk ke keranjang POS.`, {
            action: { label: 'Buka POS', onClick: () => router.visit('/pos') },
        });
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
                    <button aria-label="Tutup" onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 admin-icon-button"><FiX size={16} /></button>
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
                                <h1 className="text-base sm:text-lg font-bold text-primaryDark dark:text-white tracking-tight shrink-0 admin-page-title">
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

                                <AdminButton
                                    type="button"
                                    onClick={() => { resetMotorForm(); setEditMotorcycle(null); setShowAddModal(true); }}
                                    variant="primary"
                                    title="Tambah Data Motor Baru"
                                >
                                    <FiPlus size={15} />
                                    <span className="sm:hidden">Tambah</span><span className="hidden sm:inline">Tambah Motor</span>
                                </AdminButton>
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
                                    className="w-full pl-9 pr-7 py-1.5 font-semibold placeholder-slate-400 transition admin-control"
                                    aria-label="Cari data motor"
                                />
                                {searchMotor && (
                                    <button aria-label="Tutup" onClick={() => { setSearchMotor(''); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer admin-icon-button" title="Hapus pencarian">
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
                                    ? 'text-primaryDark dark:text-accentYellow'
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
                                    className="min-w-0 w-full px-1 py-1.5 font-semibold admin-control"
                                >
                                    <option value="semua">Semua merek</option>
                                    {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                </select>
                                <select
                                    value={activeType}
                                    onChange={e => { setActiveType(e.target.value); setPage(1); }}
                                    aria-label="Filter tipe motor"
                                    className="min-w-0 w-full px-1 py-1.5 font-semibold admin-control"
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
                                                ? 'bg-primary text-white shadow-2xs'
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
                                                        ? 'bg-primary text-white shadow-2xs'
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
                                                        ? 'bg-accentYellow text-primaryDark shadow-2xs'
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
                            <div className="flex-1 min-h-0 overflow-y-auto">
                            {paginatedMotorList.map(m => {
                                const isExpanded = expandedMotor === m.id;
                                const currentMotorParts = partsData[m.id] || { data: [], total: 0, current_page: 1, last_page: 1, total_mapped: m.parts_count || 0 };
                                const filter = partsFilter[m.id] || { search: '', category: 'semua', group: 'semua', is_recommended: false, page: 1, per_page: 5 };
                                const isLoading = loadingParts[m.id];
                                const bCfg = getBrandConfig(m.brand);

                                return (
                                    <div key={m.id} className={`border-2 transition-colors ${isExpanded
                                        ? 'mx-1 my-2 rounded-xl overflow-hidden border-primary dark:border-accentYellow'
                                        : 'border-transparent border-b-slate-100 dark:border-b-slate-800'}`}>
                                        {/* Main Motor Header Row */}
                                        <div
                                            className={`p-2.5 sm:p-3.5 cursor-pointer transition-colors ${
                                                isExpanded ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                            onClick={() => toggleExpandMotor(m.id)}
                                        >
                                            <div className="flex items-center justify-between gap-2 md:gap-4">
                                                {/* Left: Thumbnail & Model Title + Clean Typography Meta */}
                                                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                                                    {/* Thumbnail: Enlarged frame closer to row boundaries with preview modal on click */}
                                                    <div
                                                        className={`w-12 h-12 sm:w-18 sm:h-18 rounded-md sm:rounded-lg shrink-0 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center border-0 sm:border border-slate-200 dark:border-slate-700 sm:shadow-2xs relative group transition ${
                                                            m.image_url ? 'cursor-pointer hover:border-slate-400' : ''
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
                                                            <MotorIcon className="text-slate-400 dark:text-slate-500" size={32} />
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
                                                            {isExpanded && (
                                                                <span className="rounded-full bg-accentYellow px-2 py-0.5 text-[10px] font-bold text-primaryDark">
                                                                    Dipilih
                                                                </span>
                                                            )}
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
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary dark:text-accentYellow"
                                                        title={`Motor ini memiliki ${currentMotorParts.total_mapped ?? m.parts_count ?? 0} sparepart kompatibel`}
                                                    >
                                                        <FiCheckCircle size={14} className="shrink-0" />
                                                        <span className="md:hidden">{currentMotorParts.total_mapped ?? m.parts_count ?? 0} part</span>
                                                        <span className="hidden md:inline">{currentMotorParts.total_mapped ?? m.parts_count ?? 0} Part Kompatibel</span>
                                                    </span>

                                                    {/* Quick Actions (Edit & Delete) */}
                                                    <div className={`${isExpanded ? 'flex' : 'hidden'} md:flex items-center gap-1`}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); openEditMotor(m); }}
                                                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer admin-icon-button"
                                                            title="Edit Data Motor"
                                                            aria-label="Edit Data Motor"
                                                        >
                                                            <FiEdit2 size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteMotor(m.id, `${m.brand} ${m.model}`); }}
                                                            className="p-1 text-red-500 hover:text-red-600 transition cursor-pointer admin-icon-button"
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
                                                                ? 'text-primaryDark dark:text-accentYellow md:bg-primary md:text-white md:border-primary dark:md:text-white'
                                                                : 'text-slate-500 dark:text-slate-300 md:bg-white dark:md:bg-slate-800 md:border-slate-200 dark:md:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                                                        }`}
                                                        title={isExpanded ? 'Sembunyikan daftar sparepart' : 'Lihat daftar sparepart kompatibel'}
                                                        aria-expanded={isExpanded}
                                                        aria-controls={`motor-parts-${m.id}`}
                                                    >
                                                        <span className="hidden md:inline">{isExpanded ? 'Sembunyikan Part' : 'Lihat Part'}</span>
                                                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* EXPANDED PANEL: Seamless Unified Sub-Table */}
                                        {isExpanded && (
                                            <div id={`motor-parts-${m.id}`} className="border-t border-primary/20 dark:border-accentYellow/20 bg-white dark:bg-slate-900">
                                                {/* Unified Single-Row Control Bar */}
                                                <div className="px-2 sm:px-4 py-1 md:py-2 bg-white md:bg-slate-50 dark:bg-slate-900 dark:md:bg-slate-800 border-b border-slate-100 md:border-slate-200 dark:border-slate-800 flex flex-wrap md:flex-nowrap items-center gap-1.5 md:gap-2">
                                                        {/* Search inside motorcycle parts */}
                                                        <div className="relative flex-1 min-w-0 md:flex-none md:w-44 lg:w-52">
                                                            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                                            <input
                                                                type="text"
                                                                placeholder="Cari sparepart..."
                                                                value={filter.search || ''}
                                                                onChange={(e) => handleSearchParts(m.id, e.target.value)}
                                                                className="w-full pl-8 pr-7 py-1.5 font-medium admin-control"
                                                                aria-label={`Cari sparepart untuk ${m.brand} ${m.model}`}
                                                            />
                                                            {filter.search && (
                                                                <button aria-label="Tutup"
                                                                    onClick={() => handleClearSearch(m.id)}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer admin-icon-button"
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
                                                                className="w-full md:w-auto py-1.5 pl-1 md:pl-2.5 pr-7 font-semibold cursor-pointer admin-control"
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
                                                                className="w-full md:w-auto py-1.5 pl-1 md:pl-2.5 pr-7 font-semibold cursor-pointer admin-control"
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
                                                                    ? 'text-primaryDark md:bg-accentYellow md:border-accentYellow md:shadow-2xs'
                                                                    : 'text-slate-600 dark:text-slate-300 md:bg-white dark:md:bg-slate-800 md:border-slate-300 dark:md:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                                                            }`}
                                                            title="Filter sparepart rekomendasi"
                                                        >
                                                            <FiStar size={12} className={filter.is_recommended ? 'fill-accentYellow text-[#b58f00]' : 'text-slate-400'} />
                                                            <span>Rekomendasi</span>
                                                        </button>
                                                    </div>

                                                    {/* Right: Tambah Part Button */}
                                                    <div className="shrink-0 md:ml-auto md:pl-2">
                                                        <AdminButton
                                                            onClick={() => {
                                                                setShowPartModal(m.id);
                                                                setPartSearch('');
                                                                setPartFormData({ product_id: '', part_category: 'oli_mesin', notes: '', is_recommended: false });
                                                                setPartFormErrors({});
                                                            }}
                                                            variant="primary"
                                                            title="Tambah sparepart baru ke motor ini"
                                                            aria-label="Tambah sparepart"
                                                        >
                                                            <FiPlus size={14} /> <span className="hidden md:inline">Tambah Part</span>
                                                        </AdminButton>
                                                    </div>
                                                </div>

                                                {/* Table Header for clear tabular scanning on md+ screens */}
                                                <div className="hidden md:grid md:grid-cols-[repeat(11,minmax(0,1fr))_116px] gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
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
                                                        <p className="mt-1 admin-help">
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
                                                                    className="px-2.5 sm:px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition grid grid-cols-[minmax(0,1fr)_auto_auto] md:grid-cols-[repeat(11,minmax(0,1fr))_116px] md:items-center gap-x-2 gap-y-1.5 md:gap-3 text-xs"
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
                                                                            className="w-10 h-10 rounded-md shrink-0 border-0 md:border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center cursor-pointer hover:border-slate-400 hover:shadow-xs transition group"
                                                                            title="Klik untuk melihat foto sparepart resolusi penuh"
                                                                        >
                                                                            <ProductPhoto
                                                                                src={getProductImage(part.product?.image_path)}
                                                                                name={part.product?.name}
                                                                                category={part.product?.category?.name || part.product?.category || categoryLabel}
                                                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                                                                compact
                                                                            />
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm whitespace-normal break-words leading-snug">
                                                                                {part.product?.name}
                                                                            </p>
                                                                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 min-w-0">
                                                                                {part.product?.sku && (
                                                                                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate shrink-0 max-w-24 sm:max-w-none">
                                                                                        {part.product.sku}
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
                                                                                ? 'text-red-600 dark:text-red-400'
                                                                                : stock <= minStock
                                                                                ? 'text-primaryDark dark:text-accentYellow'
                                                                                : 'text-slate-700 dark:text-slate-300'
                                                                        }`}>
                                                                            {stock <= 0 ? 'Habis' : `${stock} ${part.product?.unit || 'pcs'}`}
                                                                        </span>
                                                                    </div>

                                                                    {/* Col 5 (1 col): Actions */}
                                                                    <div className="md:col-span-1 flex items-center justify-end gap-0.5 md:gap-1 shrink-0 -translate-y-1 md:translate-y-0">
                                                                        <AdminButton
                                                                            type="button"
                                                                            onClick={() => addPartToPosCart(part.product)}
                                                                            disabled={!part.product?.id || stock <= 0 || part.product.is_available === false}
                                                                            variant="primary"
                                                                            title={stock <= 0 ? 'Stok habis' : part.product?.is_available === false ? 'Produk nonaktif di POS' : 'Tambah 1 ke keranjang POS'}
                                                                            aria-label={`Tambahkan ${part.product?.name || 'produk'} ke keranjang POS`}
                                                                        >
                                                                            <FiPlus size={14} strokeWidth={2.5} />
                                                                        </AdminButton>
                                                                        <button
                                                                            onClick={() => togglePartRecommendation(m.id, part)}
                                                                            className={`p-1.5 rounded-md transition cursor-pointer ${
                                                                                part.is_recommended
                                                                                    ? 'text-[#b58f00] hover:bg-slate-100 dark:hover:bg-slate-800'
                                                                                    : 'text-slate-400 hover:text-[#b58f00] hover:bg-slate-100 dark:hover:bg-slate-800'
                                                                            }`}
                                                                            title={part.is_recommended ? 'Hapus dari rekomendasi' : 'Tandai sebagai rekomendasi'}
                                                                            aria-label="Tandai rekomendasi"
                                                                        >
                                                                            <FiStar size={15} className={part.is_recommended ? 'fill-accentYellow text-[#b58f00]' : ''} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openEditPart(m.id, part)}
                                                                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer admin-icon-button"
                                                                            title="Edit Mapping Part"
                                                                            aria-label="Edit Mapping Part"
                                                                        >
                                                                            <FiEdit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDetachPart(m.id, part.id, part.product?.name)}
                                                                            className="p-1 text-red-500 hover:text-red-600 transition cursor-pointer admin-icon-button"
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
                                                    <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white sm:bg-slate-50 dark:bg-slate-900 dark:sm:bg-slate-800 border-t border-slate-100 sm:border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
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
                                                                className="pl-1 sm:pl-2 pr-5 sm:pr-6 py-1 font-bold cursor-pointer admin-control"
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
                                className="mt-3 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold"
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
                <BulkMappingModal
                setShowBulkModal={setShowBulkModal}
                bulkErrors={bulkErrors}
                bulkMotorIds={bulkMotorIds}
                setBulkMotorIds={setBulkMotorIds}
                filteredMotorcyclesForBulk={filteredMotorcyclesForBulk}
                bulkMotorSearch={bulkMotorSearch}
                setBulkMotorSearch={setBulkMotorSearch}
                bulkBrandFilter={bulkBrandFilter}
                setBulkBrandFilter={setBulkBrandFilter}
                brands={brands}
                bulkProductIds={bulkProductIds}
                setBulkProductIds={setBulkProductIds}
                filteredProductsForBulk={filteredProductsForBulk}
                bulkProductSearch={bulkProductSearch}
                setBulkProductSearch={setBulkProductSearch}
                bulkCategoryFilter={bulkCategoryFilter}
                setBulkCategoryFilter={setBulkCategoryFilter}
                productCategoriesList={productCategoriesList}
                formatRp={formatRp}
                bulkCategory={bulkCategory}
                setBulkCategory={setBulkCategory}
                categoryGroups={categoryGroups}
                bulkNotes={bulkNotes}
                setBulkNotes={setBulkNotes}
                bulkIsRecommended={bulkIsRecommended}
                setBulkIsRecommended={setBulkIsRecommended}
                handleSaveBulkMapping={handleSaveBulkMapping}
                bulkSaving={bulkSaving}
            />
            )}

            {/* ADD/EDIT MOTORCYCLE MODAL */}
            {showAddModal && (
                <MotorcycleFormModal
                setShowAddModal={setShowAddModal}
                editMotorcycle={editMotorcycle}
                formErrors={formErrors}
                formData={formData}
                setFormData={setFormData}
                brands={brands}
                engineTypes={engineTypes}
                handleSaveMotor={handleSaveMotor}
                saving={saving}
            />
            )}

            {/* ADD SINGLE PART MAPPING MODAL */}
            {showPartModal && (
                <AttachPartModal
                setShowPartModal={setShowPartModal}
                partFormErrors={partFormErrors}
                partFormData={partFormData}
                setPartFormData={setPartFormData}
                categoryGroups={categoryGroups}
                partSearch={partSearch}
                filteredProductsForModal={filteredProductsForModal}
                products={products}
                setPartSearch={setPartSearch}
                formatRp={formatRp}
                handleAttachPart={handleAttachPart}
                saving={saving}
            />
            )}

            {/* EDIT SINGLE PART MAPPING MODAL */}
            {editPartModal && (
                <EditPartModal
                setEditPartModal={setEditPartModal}
                editPartModal={editPartModal}
                partFormErrors={partFormErrors}
                partFormData={partFormData}
                setPartFormData={setPartFormData}
                categoryGroups={categoryGroups}
                handleUpdatePart={handleUpdatePart}
                saving={saving}
            />
            )}

            {/* ======================================================== */}
            {/* MOTORCYCLE IMAGE PREVIEW MODAL (LIGHTBOX)               */}
            {/* ======================================================== */}
            {previewMotor && (
                <MotorcyclePreviewModal
                setPreviewMotor={setPreviewMotor}
                previewMotor={previewMotor}
            />
            )}

            {/* ======================================================== */}
            {/* SPAREPART IMAGE PREVIEW MODAL (LIGHTBOX)                 */}
            {/* ======================================================== */}
            {previewPart && (
                <PartPreviewModal
                setPreviewPart={setPreviewPart}
                previewPart={previewPart}
            />
            )}

            {/* CUSTOM CONFIRMATION MODAL POPUP */}
            {deleteConfirm && (
                <DeleteMappingModal
                isDeleting={isDeleting}
                setDeleteConfirm={setDeleteConfirm}
                deleteConfirm={deleteConfirm}
                executeDeleteConfirm={executeDeleteConfirm}
            />
            )}
        </AuthenticatedLayout>
    );
}
