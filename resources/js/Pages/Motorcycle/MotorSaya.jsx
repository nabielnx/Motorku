import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import { 
    FiArrowLeft, 
    FiSearch, 
    FiChevronRight, 
    FiFolder,
    FiShoppingCart,
    FiPlus,
    FiCheck,
    FiX,
    FiDisc, 
    FiDroplet, 
    FiZap, 
    FiSettings,
    FiShield, 
    FiLayers, 
    FiSun, 
    FiSliders, 
    FiTool, 
    FiBox, 
    FiCpu, 
    FiGrid,
    FiMessageSquare, 
    FiPhone,
    FiStar
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

function MotorIcon({ size = 24, className = "" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="5.5" cy="17.5" r="3.5" />
            <circle cx="18.5" cy="17.5" r="3.5" />
            <path d="M15 6h2.5l2 3.5h-5.5l-2-4H7.5L5 9" />
            <path d="M5.5 17.5L8.5 10h6l2 4h-8.5" />
            <path d="M14 6l1.5 4" />
        </svg>
    );
}

function MotorImage({ src, alt, size = 24, className = "w-full h-full object-contain p-2" }) {
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
    }, [src]);

    if (!src || error) {
        return <MotorIcon size={size} />;
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className={className} 
            onError={() => setError(true)} 
        />
    );
}

const CART_KEY = 'mie_amour_cart';

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const cartTime = localStorage.getItem(CART_KEY + '_time');
        if (raw && cartTime) {
            const timeDiff = Date.now() - parseInt(cartTime, 10);
            if (timeDiff > 4 * 60 * 60 * 1000) {
                localStorage.removeItem(CART_KEY);
                localStorage.removeItem(CART_KEY + '_time');
                return [];
            }
        }
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        localStorage.setItem(CART_KEY + '_time', Date.now().toString());
    } catch {}
}

function renderCategoryIcon(category = '') {
    const cat = category.toLowerCase();
    if (cat.includes('oli') || cat.includes('cairan') || cat.includes('coolant')) return <FiDroplet className="text-blue-600 shrink-0" size={15} />;
    if (cat.includes('ban') || cat.includes('roda') || cat.includes('velg') || cat.includes('shock')) return <FiDisc className="text-slate-700 shrink-0" size={15} />;
    if (cat.includes('rem') || cat.includes('piringan')) return <FiShield className="text-red-600 shrink-0" size={15} />;
    if (cat.includes('cvt') || cat.includes('belt') || cat.includes('roller') || cat.includes('gear') || cat.includes('rantai')) return <FiLayers className="text-amber-700 shrink-0" size={15} />;
    if (cat.includes('aki') || cat.includes('busi') || cat.includes('kiprok') || cat.includes('ecu') || cat.includes('starter')) return <FiZap className="text-yellow-600 shrink-0" size={15} />;
    if (cat.includes('lampu') || cat.includes('saklar')) return <FiSun className="text-amber-600 shrink-0" size={15} />;
    if (cat.includes('filter') || cat.includes('injektor') || cat.includes('piston') || cat.includes('mesin')) return <FiCpu className="text-emerald-700 shrink-0" size={15} />;
    if (cat.includes('spion') || cat.includes('handle') || cat.includes('kabel')) return <FiSliders className="text-purple-600 shrink-0" size={15} />;
    return <FiTool className="text-slate-600 shrink-0" size={15} />;
}

export default function MotorSaya({ motorcyclesByBrand = {}, settings = {}, partCategories = {} }) {
    useForceLightTheme();

    const [activeBrand, setActiveBrand] = useState('Honda');
    const [activeType, setActiveType] = useState('semua');
    const [searchMotor, setSearchMotor] = useState('');
    const [selectedMotor, setSelectedMotor] = useState(null);
    const [partsData, setPartsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeCategoryPart, setActiveCategoryPart] = useState('semua');
    const [searchPart, setSearchPart] = useState('');
    const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
    const [detailQty, setDetailQty] = useState(1);
    const [cart, setCart] = useState(loadCart);
    const [addedId, setAddedId] = useState(null);

    useEffect(() => { saveCart(cart); }, [cart]);

    const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);

    const selectMotor = async (motor) => {
        setSelectedMotor(motor);
        setActiveCategoryPart('semua');
        setLoading(true);
        try {
            const res = await window.axios.get(`/api/motor-saya/${motor.id}/parts`);
            setPartsData(res.data);
        } catch {
            setPartsData({ motorcycle: motor, parts: [] });
        }
        setLoading(false);
    };

    const addToCart = (item, addQty = 1) => {
        if (item.stock <= 0) return;
        const existingIndex = cart.findIndex(i => i.id === item.id && !i.notes);
        if (existingIndex > -1) {
            const newQty = Math.min(item.stock, cart[existingIndex].qty + addQty);
            setCart(prev => prev.map((i, idx) => idx === existingIndex ? { ...i, qty: newQty } : i));
        } else {
            setCart(prev => [...prev, {
                id: item.id, name: item.name, price: item.price, stock: item.stock,
                image: item.image, category: item.category_name || 'Produk',
                qty: Math.min(item.stock, addQty), notes: '', cartItemId: `${item.id}-${Date.now()}`
            }]);
        }
        setAddedId(item.id);
        setTimeout(() => setAddedId(null), 1200);
    };

    const brands = Object.keys(motorcyclesByBrand);

    // ─── STEP 1: Pilih Motor ───
    if (!selectedMotor) {
        return (
            <div className="min-h-screen bg-amber-50/60 font-sans text-slate-800 flex justify-center">
                <Head title="Motor Saya - Cari Sparepart">
                    <meta name="description" content="Cari sparepart yang cocok untuk motor kamu. Pilih merek dan model, langsung lihat part yang kompatibel." />
                </Head>

                <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col">
                    {/* STICKY TOP CONTAINER (HEADER + SEARCH & FILTERS) */}
                    <div className="sticky top-0 z-30 bg-white shadow-2xs">
                        {/* Header */}
                        <header className="bg-[#1E3A8A] text-white px-4 py-3.5 border-b-[3px] border-amber-400">
                            <div className="flex items-center gap-3">
                                <Link href="/" className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition cursor-pointer">
                                    <FiArrowLeft size={18} />
                                </Link>
                                {(settings['store.logo'] || settings['logo'] || settings['restaurant.logo']) && (
                                    <img 
                                        src={
                                            (settings['store.logo'] || settings['logo'] || settings['restaurant.logo']).startsWith('/storage')
                                                ? (settings['store.logo'] || settings['logo'] || settings['restaurant.logo'])
                                                : `/storage/${settings['store.logo'] || settings['logo'] || settings['restaurant.logo']}`
                                        } 
                                        alt="Logo" 
                                        className="w-9 h-9 object-contain rounded-md bg-white p-0.5 shrink-0 shadow-2xs"
                                    />
                                )}
                                <div>
                                    <h1 className="font-extrabold text-base md:text-lg flex items-center gap-2">
                                        <MotorIcon size={22} className="text-amber-400" /> Motor Saya
                                    </h1>
                                    <p className="text-[10px] md:text-xs text-[#9ECAE1] font-medium">Pilih motor kamu, temukan sparepart yang cocok</p>
                                </div>
                            </div>
                        </header>

                        {/* COMPACT UNIFIED FILTER TOOLBAR */}
                        <div className="p-2.5 sm:p-3 bg-slate-50 border-b border-slate-200 space-y-2">
                            {/* Search Bar */}
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <input 
                                    type="text" 
                                    placeholder="Cari model/tipe motor (e.g. Beat, NMAX)..." 
                                    value={searchMotor}
                                    onChange={e => setSearchMotor(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition shadow-2xs"
                                />
                            </div>

                            {/* Brand & Type Filter Pills */}
                            <div className="space-y-1.5 pt-0.5">
                                {/* Row 1: Brand Filter */}
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                    {brands.map(brand => (
                                        <button
                                            key={brand}
                                            onClick={() => { setActiveBrand(brand); setActiveType('semua'); }}
                                            className={`px-3 py-1 rounded-md text-xs font-extrabold whitespace-nowrap transition border cursor-pointer ${
                                                activeBrand === brand 
                                                    ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-2xs' 
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                                            }`}
                                        >
                                            {brand}
                                        </button>
                                    ))}
                                </div>

                                {/* Row 2: Type Filter */}
                                {activeBrand && (
                                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 pt-1 border-t border-slate-200/60">
                                        {['semua', 'matic', 'bebek', 'sport'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setActiveType(type)}
                                                className={`px-3 py-1 rounded-md text-xs font-extrabold whitespace-nowrap transition border cursor-pointer ${
                                                    activeType === type 
                                                        ? 'bg-[#1E3A8A] border-blue-900 text-white shadow-2xs' 
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                                }`}
                                            >
                                                {type === 'semua' ? 'Semua Tipe' : type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Brand + Model Selection */}
                    <div className="flex-1 p-3 sm:p-4 space-y-3">

                        {/* MOTOR GRID */}
                        {activeBrand && (
                            <div className="space-y-3 pt-1">
                                <div className="flex items-baseline gap-2 px-0.5">
                                    <div className="w-1.5 h-3.5 rounded-full bg-amber-400 shrink-0 self-center"></div>
                                    <h3 className="font-extrabold text-sm text-slate-900">{activeBrand} {activeType !== 'semua' ? `- ${activeType.charAt(0).toUpperCase() + activeType.slice(1)}` : ''}</h3>
                                    <span className="text-xs font-semibold text-slate-400">
                                        {motorcyclesByBrand[activeBrand]?.filter(m => activeType === 'semua' || m.engine_type === activeType).filter(m => searchMotor === '' || m.model.toLowerCase().includes(searchMotor.toLowerCase())).length || 0} model
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {motorcyclesByBrand[activeBrand]
                                        ?.filter(m => activeType === 'semua' || m.engine_type === activeType)
                                        .filter(m => searchMotor === '' || m.model.toLowerCase().includes(searchMotor.toLowerCase()))
                                        .map(motor => (
                                            <button
                                                key={motor.id}
                                                onClick={() => selectMotor(motor)}
                                                className="bg-white border border-slate-200 rounded-md overflow-hidden text-left hover:border-amber-400 hover:shadow-xs transition cursor-pointer group active:scale-[0.99] flex flex-col justify-between"
                                            >
                                                <div className="w-full h-32 sm:h-36 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50/50 transition overflow-hidden">
                                                    <MotorImage src={motor.image_url} alt={motor.model} size={32} />
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-amber-900 truncate">{motor.model}</h4>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="text-[9px] bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded-sm font-bold border border-blue-100">{motor.engine_cc}cc</span>
                                                        <span className="text-[9px] text-slate-400 font-medium">
                                                            {motor.year_start}{motor.year_end ? `-${motor.year_end}` : '+'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-amber-600 font-bold mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                                        Lihat Part <FiChevronRight size={10} />
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        {brands.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <FiFolder size={28} className="mx-auto text-slate-300 mb-2" />
                                <p className="font-bold text-sm">Belum ada data motor</p>
                                <p className="text-xs mt-0.5">Data motor sedang disiapkan oleh admin.</p>
                            </div>
                        )}
                    </div>

                    {/* Cart floating indicator */}
                    {totalQty > 0 && (
                        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
                            <Link
                                href="/"
                                className="bg-[#1E3A8A] text-white px-4 py-2.5 rounded-md shadow-lg flex items-center gap-3 font-extrabold text-xs hover:bg-blue-950 transition border border-blue-900"
                            >
                                <FiShoppingCart size={16} />
                                <span>{totalQty} item di keranjang</span>
                                <FiChevronRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── STEP 2: Dashboard Motor — Compatible Parts ───
    const motorcycle = partsData?.motorcycle || selectedMotor;
    const parts = partsData?.parts || [];

    const searchPartWords = (searchPart || '').trim().toLowerCase().split(/\s+/).filter(Boolean);

    const filteredParts = parts.map(group => {
        if (activeCategoryPart !== 'semua' && group.category !== activeCategoryPart) return null;

        const items = group.items.filter(item => {
            if (searchPartWords.length === 0) return true;
            const target = `${item.name} ${item.sku || ''} ${item.notes || ''} ${item.category_name || ''}`.toLowerCase();
            return searchPartWords.every(word => target.includes(word));
        });

        if (items.length === 0) return null;
        return { ...group, items };
    }).filter(Boolean);

    const totalAvailableParts = parts.reduce((acc, g) => acc + g.items.length, 0);

    return (
        <div className="min-h-screen bg-amber-50/60 font-sans text-slate-800 flex justify-center">
            <Head title={`${motorcycle.brand} ${motorcycle.model} - Sparepart Kompatibel`} />

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-24">
                {/* STICKY TOP CONTAINER (HEADER + SEARCH PART + CATEGORY FILTERS) */}
                <div className="sticky top-0 z-30 bg-white shadow-2xs">
                    {/* Header with motor info */}
                    <header className="bg-[#1E3A8A] text-white border-b-[3px] border-amber-400 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => { setSelectedMotor(null); setPartsData(null); setSearchPart(''); }} 
                                className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
                            >
                                <FiArrowLeft size={18} />
                            </button>
                            <div className="flex-1 min-w-0">
                                <h1 className="font-extrabold text-sm sm:text-base flex items-center gap-2 truncate">
                                    <span>{motorcycle.brand} {motorcycle.model}</span>
                                    <span className="text-[10px] bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-xs font-black shrink-0">{motorcycle.engine_cc}cc</span>
                                </h1>
                                <p className="text-[10px] sm:text-xs text-[#9ECAE1] font-medium truncate">
                                    {motorcycle.year_start}{motorcycle.year_end ? `-${motorcycle.year_end}` : '+'} · {motorcycle.engine_type} · {totalAvailableParts} part tersedia
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Part Search Bar & Category Filters */}
                    <div className="p-2.5 sm:p-3 bg-slate-50 border-b border-slate-200 space-y-2">
                        {/* Search Input for Parts */}
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="text" 
                                placeholder={`Cari part ${motorcycle.model} (e.g. kampas, busi, oli, roller)...`} 
                                value={searchPart}
                                onChange={e => setSearchPart(e.target.value)}
                                className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition shadow-2xs"
                            />
                            {searchPart && (
                                <button 
                                    onClick={() => setSearchPart('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                    <FiX size={13} />
                                </button>
                            )}
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            <button
                                onClick={() => setActiveCategoryPart('semua')}
                                className={`px-3 py-1 rounded-md text-xs font-extrabold whitespace-nowrap transition cursor-pointer border ${
                                    activeCategoryPart === 'semua' 
                                        ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-2xs' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                                }`}
                            >
                                Semua Kategori
                            </button>
                            {parts.map(group => (
                                <button
                                    key={group.category}
                                    onClick={() => setActiveCategoryPart(group.category)}
                                    className={`px-3 py-1 rounded-md text-xs font-extrabold whitespace-nowrap transition cursor-pointer border ${
                                        activeCategoryPart === group.category 
                                            ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-2xs' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                                    }`}
                                >
                                    {group.category_label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Parts Content */}
                <div className="flex-1 p-3 sm:p-4 space-y-3">
                    {/* Compact WA Inquiry Row */}
                    <div className="bg-emerald-50 border border-emerald-200/90 rounded-md px-3 py-2 flex items-center justify-between gap-2 text-xs text-emerald-950 shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                            <FaWhatsapp className="text-[#25D366] shrink-0" size={16} />
                            <span className="font-bold text-emerald-950 text-xs truncate">
                                Part yang kamu cari tidak ada di list?
                            </span>
                        </div>
                        <a
                            href={`https://wa.me/${(settings['restaurant.phone'] || settings['phone'] || '081234567890').replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo admin, saya cari part untuk ${motorcycle.brand} ${motorcycle.model} yang belum ada di daftar.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] font-extrabold shrink-0 transition shadow-2xs flex items-center gap-1"
                        >
                            Tanya WA
                        </a>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-slate-400">
                            <div className="inline-block w-7 h-7 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="font-bold text-xs">Mencari sparepart kompatibel...</p>
                        </div>
                    ) : filteredParts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <FiFolder size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-sm text-slate-700">
                                {searchPart ? `Tidak ada part dengan kata kunci "${searchPart}"` : 'Belum ada data sparepart'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {searchPart ? 'Coba gunakan kata kunci lain (misal: kampas, busi, oli).' : 'Data part untuk motor ini sedang disiapkan oleh admin toko.'}
                            </p>
                            {searchPart ? (
                                <button 
                                    onClick={() => setSearchPart('')}
                                    className="mt-3 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border border-slate-200"
                                >
                                    Reset Pencarian
                                </button>
                            ) : (
                                <button 
                                    onClick={() => { setSelectedMotor(null); setPartsData(null); setSearchPart(''); }} 
                                    className="mt-4 bg-amber-400 text-amber-950 px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer hover:bg-amber-300 transition"
                                >
                                    Pilih Motor Lain
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Parts by category */}
                            {filteredParts.map(group => (
                                <div key={group.category} className="space-y-2">
                                    <div className="flex items-baseline gap-2 px-0.5">
                                        <div className="w-1.5 h-3.5 rounded-full bg-amber-400 shrink-0 self-center"></div>
                                        <h2 className="font-extrabold text-xs md:text-sm text-slate-900">{group.category_label}</h2>
                                        <span className="text-[10px] font-semibold text-slate-400">
                                            {group.items.length} opsi
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {group.items.map(item => {
                                            const isOutOfStock = item.stock <= 0;
                                            const justAdded = addedId === item.id;
                                            return (
                                                <div key={item.id} className={`flex items-center gap-3 bg-white border rounded-md p-2.5 transition ${
                                                    isOutOfStock ? 'bg-slate-50/80 border-slate-200' : 'border-slate-200 hover:border-amber-300 hover:shadow-2xs'
                                                }`}>
                                                    {/* Clickable Product image & info area */}
                                                    <div 
                                                        onClick={() => { setSelectedDetailProduct(item); setDetailQty(1); }}
                                                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
                                                    >
                                                        {item.image && (
                                                            <div className="w-11 h-11 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                                                            </div>
                                                        )}

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <h3 className={`font-bold text-xs leading-snug group-hover:text-amber-900 transition ${isOutOfStock ? 'text-slate-500' : 'text-slate-900'}`}>{item.name}</h3>
                                                                {item.is_recommended && (
                                                                    <span className="bg-amber-400 text-amber-950 text-[8px] px-1.5 py-0.2 rounded-xs font-black shrink-0 flex items-center gap-0.5">
                                                                        <FiStar size={8} /> Rekomendasi
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.notes && <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.notes}</p>}
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`font-black text-xs ${isOutOfStock ? 'text-slate-400' : 'text-red-600'}`}>{formatRp(item.price)}</span>
                                                                <span className={`text-[9px] font-semibold ${isOutOfStock ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                                                    {isOutOfStock ? 'Stok Habis' : `Stok: ${item.stock}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Add to cart */}
                                                    <button
                                                        onClick={() => addToCart(item, 1)}
                                                        disabled={isOutOfStock}
                                                        className={`p-2 rounded-md transition cursor-pointer active:scale-95 shrink-0 ${
                                                            justAdded
                                                                ? 'bg-emerald-600 text-white'
                                                                : isOutOfStock
                                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                                    : 'bg-[#9ECAE1] hover:bg-sky-300 text-slate-950'
                                                        }`}
                                                    >
                                                        {justAdded ? <FiCheck size={14} strokeWidth={3} /> : <FiPlus size={14} strokeWidth={2.5} />}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom cart bar */}
            {totalQty > 0 && (
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl z-40 p-3 bg-gradient-to-t from-white via-white/95 to-transparent">
                    <Link
                        href="/"
                        className="w-full bg-[#1E3A8A] hover:bg-blue-950 text-white font-bold text-xs md:text-sm py-3 px-4 rounded-md shadow-lg flex items-center justify-between transition border border-blue-900"
                    >
                        <div className="flex items-center gap-2">
                            <FiShoppingCart size={16} strokeWidth={2.5} />
                            <span>Lihat Keranjang & Checkout</span>
                        </div>
                        <span className="bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-sm text-xs font-extrabold">{totalQty} item</span>
                    </Link>
                </div>
            )}

            {/* MODAL DETAIL PRODUK */}
            {selectedDetailProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200">
                        {/* Header Modal */}
                        <div className="relative bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between">
                            <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-200/60">
                                {selectedDetailProduct.category_name || selectedDetailProduct.category || 'Sparepart'}
                            </span>
                            <button
                                onClick={() => setSelectedDetailProduct(null)}
                                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 font-sans">
                            {/* Gambar Produk */}
                            {selectedDetailProduct.image && (
                                <div className="w-full h-48 sm:h-56 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center relative">
                                    <img 
                                        src={selectedDetailProduct.image} 
                                        alt={selectedDetailProduct.name} 
                                        className="w-full h-full object-contain p-2" 
                                    />
                                    {selectedDetailProduct.stock <= 0 ? (
                                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-extrabold shadow-2xs">Habis</span>
                                    ) : (
                                        <span className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold backdrop-blur-xs">Stok: {selectedDetailProduct.stock}</span>
                                    )}
                                </div>
                            )}

                            {/* Info Produk */}
                            <div>
                                <h2 className="font-extrabold text-base text-slate-900 leading-snug">{selectedDetailProduct.name}</h2>
                                {selectedDetailProduct.sku && (
                                    <p className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5">SKU: {selectedDetailProduct.sku}</p>
                                )}
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="font-black text-xl text-red-600">{formatRp(selectedDetailProduct.price)}</span>
                                </div>
                            </div>

                            {/* Catatan Kompatibilitas jika ada */}
                            {selectedDetailProduct.notes && (
                                <div className="bg-amber-50 border border-amber-200/80 rounded-md p-2.5 text-xs text-amber-950 font-medium">
                                    <span className="font-extrabold">Keterangan:</span> {selectedDetailProduct.notes}
                                </div>
                            )}

                            {/* Deskripsi */}
                            {selectedDetailProduct.description && (
                                <div className="border-t border-slate-100 pt-3">
                                    <h3 className="text-xs font-extrabold text-slate-900 mb-1">Deskripsi & Spesifikasi</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{selectedDetailProduct.description}</p>
                                </div>
                            )}

                            {/* Stepper Jumlah Manual */}
                            {selectedDetailProduct.stock > 0 && (
                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">Jumlah Pesanan:</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setDetailQty(q => Math.max(1, q - 1))}
                                            className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center transition cursor-pointer border border-slate-200"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={detailQty}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                if (isNaN(val) || val <= 0) setDetailQty(1);
                                                else setDetailQty(Math.min(selectedDetailProduct.stock || 999, val));
                                            }}
                                            className="w-12 h-8 text-center text-xs font-extrabold bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                                            min="1"
                                            max={selectedDetailProduct.stock || 999}
                                        />
                                        <button
                                            onClick={() => setDetailQty(q => Math.min(selectedDetailProduct.stock, q + 1))}
                                            className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center transition cursor-pointer border border-slate-200"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Modal: Tombol Tambah ke Keranjang */}
                        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200">
                            <button
                                onClick={() => {
                                    if (selectedDetailProduct.stock <= 0) return;
                                    addToCart(selectedDetailProduct, detailQty);
                                    setSelectedDetailProduct(null);
                                }}
                                disabled={selectedDetailProduct.stock <= 0}
                                className={`w-full py-2.5 px-4 rounded-md font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer ${
                                    selectedDetailProduct.stock <= 0
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                        : 'bg-[#1E3A8A] hover:bg-blue-950 text-white'
                                }`}
                            >
                                <FiShoppingCart size={16} />
                                <span>Tambah ({formatRp(selectedDetailProduct.price * detailQty)})</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
