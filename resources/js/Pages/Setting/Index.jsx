import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, usePage } from '@inertiajs/react';
import { getTranslation } from '@/i18n/translations';
import axios from 'axios';
import { toast } from 'sonner';
import { FiSave, FiCheck, FiHome, FiPercent, FiCreditCard, FiPrinter, FiSmartphone, FiClock, FiSettings, FiUpload, FiClipboard, FiTrash2, FiAlertTriangle, FiLock } from 'react-icons/fi';

const fieldMap = {
  restaurant_name:             { group: 'restaurant',     key: 'name' },
  restaurant_phone:            { group: 'restaurant',     key: 'phone' },
  restaurant_email:            { group: 'restaurant',     key: 'email' },
  restaurant_address:          { group: 'restaurant',     key: 'address' },

  tax_enabled:                 { group: 'tax',             key: 'enabled' },
  tax_percentage:              { group: 'tax',             key: 'percentage' },
  payment_cash_enabled:        { group: 'payment',         key: 'cash_enabled' },
  payment_qris_enabled:        { group: 'payment',         key: 'qris_enabled' },
  payment_card_enabled:        { group: 'payment',         key: 'card_enabled' },
  printer_paper_size:          { group: 'printer',         key: 'paper_size' },
  printer_auto_print_receipt:  { group: 'printer',         key: 'auto_print_receipt' },
  qr_order_enabled:            { group: 'qr_order',        key: 'enabled' },
  qr_order_session_timeout:    { group: 'qr_order',        key: 'session_timeout' },
  catalog_show_total_sold:     { group: 'catalog',         key: 'show_total_sold' },
  promo_banner_enabled:        { group: 'promo_banner',    key: 'enabled' },
  store_open_time:             { group: 'store',           key: 'open_time' },
  store_close_time:            { group: 'store',           key: 'close_time' },
  system_timezone:             { group: 'system',          key: 'timezone' },
  system_locale:               { group: 'system',          key: 'locale' },
};

const defaults = {
  restaurant_name: 'Toko Sparepart', restaurant_phone: '081234567890',
  restaurant_email: 'info@tokosparepart.com', restaurant_address: 'Jl. Contoh No. 1',
  tax_enabled: 'true', tax_percentage: '10',
  payment_cash_enabled: 'true', payment_qris_enabled: 'true', payment_card_enabled: 'false',
  printer_paper_size: '80', printer_auto_print_receipt: 'true',
  qr_order_enabled: 'true', qr_order_session_timeout: '120', catalog_show_total_sold: 'true', promo_banner_enabled: 'false',
  store_open_time: '10:00', store_close_time: '22:00',
  system_timezone: 'Asia/Jakarta', system_locale: 'id',
};

// Frontend validation rules per field
const fieldValidators = {
  restaurant_phone: {
    validate: (v) => /^[0-9+\-\s()]{8,20}$/.test(v),
    message: 'Nomor telepon hanya boleh angka, +, -, spasi (8-20 karakter)',
  },
  restaurant_email: {
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: 'Format email tidak valid',
  },
  restaurant_name: {
    validate: (v) => v.trim().length >= 1 && v.length <= 100,
    message: 'Nama toko wajib diisi (maks 100 karakter)',
  },
  restaurant_address: {
    validate: (v) => v.trim().length >= 1 && v.length <= 500,
    message: 'Alamat wajib diisi (maks 500 karakter)',
  },
  tax_percentage: {
    validate: (v) => { const n = parseFloat(v); return !isNaN(n) && n >= 0 && n <= 100; },
    message: 'Persentase pajak harus angka 0-100',
  },
};

function Toggle({ value, onChange }) {
    const on = value === 'true';
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={on} onChange={onChange} className="sr-only peer" />
        <div className="w-10 h-5 bg-slate-200 peer-checked:bg-blue-600 rounded-full after:content-['']
after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
peer-checked:after:translate-x-5" />
      </label>
    );
}

export default function SettingIndex() {
  const { props } = usePage();
  const locale = props.app_settings?.locale || 'id';
  const [form, setForm] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Reset transactions state
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleResetTransactions = async (e) => {
    e.preventDefault();
    if (!confirmPassword) {
      toast.error('Silakan masukkan kata sandi Anda!');
      return;
    }
    setIsResetting(true);
    try {
      const res = await axios.post('/api/settings/reset-transactions', { password: confirmPassword });
      toast.success(res.data.message || 'Data transaksi berhasil direset!');
      setShowResetModal(false);
      setConfirmPassword('');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mereset data transaksi!');
    } finally {
      setIsResetting(false);
    }
  };

  // Banner promo state: { 1: { url, file, preview }, 2: {...}, 3: {...} }
  const [banners, setBanners] = useState({ 1: {}, 2: {}, 3: {} });
  const [bannerUploading, setBannerUploading] = useState({ 1: false, 2: false, 3: false });
  // Konfirmasi hapus logo/banner: { type: 'logo' } | { type: 'banner', slot }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'logo') {
      setUploading(true);
      try {
        await axios.delete('/api/settings/logo');
        setLogoUrl(null);
        setLogoFile(null);
        setLogoPreview(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        toast.success('Logo toko berhasil dihapus.');
      } catch (err) {
        toast.error('Gagal menghapus logo: ' + (err.response?.data?.message || err.message));
      } finally {
        setUploading(false);
      }
    } else {
      const slot = deleteConfirm.slot;
      setBannerUploading(prev => ({ ...prev, [slot]: true }));
      try {
        await axios.delete(`/api/settings/banners/${slot}`);
        setBanners(prev => ({ ...prev, [slot]: {} }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        toast.success(`Banner slot ${slot} berhasil dihapus.`);
      } catch (err) {
        toast.error(`Gagal menghapus banner slot ${slot}: ` + (err.response?.data?.message || err.message));
      } finally {
        setBannerUploading(prev => ({ ...prev, [slot]: false }));
      }
    }
    setDeleteConfirm(null);
  };

  useEffect(() => {
    (async () => {
      try {
        const [settingsRes, logoRes] = await Promise.all([
          axios.get('/api/settings'),
          axios.get('/api/settings/logo'),
        ]);
        if (settingsRes.data?.data) {
          const loaded = {};
          settingsRes.data.data.forEach(s => { loaded[s.group + '_' + s.key] = s.value; });
          setForm(prev => {
            const next = { ...prev };
            Object.keys(fieldMap).forEach(f => {
              if (loaded[f] !== undefined) next[f] = loaded[f];
            });
            return next;
          });
        }
        if (logoRes.data?.url) {
          setLogoUrl(logoRes.data.url);
        }
        // Load existing banners
        try {
          const bannersRes = await axios.get('/api/settings/banners');
          if (bannersRes.data?.banners) {
            const b = bannersRes.data.banners;
            setBanners({
              1: { url: b[1] || null },
              2: { url: b[2] || null },
              3: { url: b[3] || null },
            });
          }
        } catch { /* silent */ }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error on change, re-validate
    if (fieldValidators[field]) {
      const isValid = fieldValidators[field].validate(value);
      setFieldErrors(prev => {
        const next = { ...prev };
        if (isValid) { delete next[field]; } else { next[field] = fieldValidators[field].message; }
        return next;
      });
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      const res = await axios.post('/api/settings/logo', fd);
      if (res.data?.url) setLogoUrl(res.data.url);
      setLogoFile(null);
      setLogoPreview(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error('Gagal upload logo: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = () => {
    setDeleteConfirm({ type: 'logo' });
  };

  const handleUploadBanner = async (slot) => {
    const file = banners[slot]?.file;
    if (!file) return;
    setBannerUploading(prev => ({ ...prev, [slot]: true }));
    try {
      const fd = new FormData();
      fd.append('banner', file);
      fd.append('slot', slot);
      const res = await axios.post('/api/settings/banners', fd);
      setBanners(prev => ({ ...prev, [slot]: { url: res.data?.url, file: null, preview: null } }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(`Gagal upload banner slot ${slot}: ` + (err.response?.data?.message || err.message));
    } finally {
      setBannerUploading(prev => ({ ...prev, [slot]: false }));
    }
  };

  const handleDeleteBanner = (slot) => {
    setDeleteConfirm({ type: 'banner', slot });
  };

  const handleBannerFileSelect = (slot, file) => {
    if (!file) return;
    setBanners(prev => ({ ...prev, [slot]: { ...prev[slot], file, preview: URL.createObjectURL(file) } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run all frontend validators before submit
    const errors = {};
    Object.entries(fieldValidators).forEach(([field, { validate, message }]) => {
      if (!validate(form[field] || '')) {
        errors[field] = message;
      }
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Ada kolom yang tidak valid, periksa kembali.');
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const settings = Object.entries(fieldMap).map(([field, { group, key }]) => ({
        group, key, value: String(form[field]),
      }));
      await axios.post('/api/settings', { settings });
      setSaved(true);
      toast.success('Pengaturan berhasil disimpan!');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      if (err.response?.status === 419) {
        toast.error('Sesi telah diperbarui, silakan tekan Simpan sekali lagi.');
      } else {
        toast.error('Gagal menyimpan: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1';

  const sections = [
    { title: 'Informasi Toko', icon: FiHome, fields: [
      { field: 'restaurant_name', label: 'Nama Toko', type: 'text', maxLength: 100, placeholder: 'Nama toko Anda' },
      { field: 'restaurant_phone', label: 'Telepon', type: 'tel', maxLength: 20, placeholder: '081234567890', inputMode: 'tel' },
      { field: 'restaurant_email', label: 'Email', type: 'email', maxLength: 100, placeholder: 'email@contoh.com' },
      { field: 'restaurant_address', label: 'Alamat', type: 'text', span: true, maxLength: 500, placeholder: 'Jl. Contoh No. 1' },
    ]},

    { title: 'Pajak', icon: FiPercent, fields: [
      { field: 'tax_enabled', label: 'Aktifkan Pajak', type: 'toggle' },
      { field: 'tax_percentage', label: 'Persentase Pajak (%)', type: 'number', min: 0, max: 100, step: 0.1 },
    ]},
    { title: 'Pembayaran', icon: FiCreditCard, fields: [
      { field: 'payment_cash_enabled', label: 'Tunai', type: 'toggle' },
      { field: 'payment_qris_enabled', label: 'QRIS (via Doku)', type: 'toggle' },
      { field: 'payment_card_enabled', label: 'Kartu (Debit/Kredit)', type: 'toggle' },
    ]},
    { title: 'Printer', icon: FiPrinter, fields: [
      { field: 'printer_paper_size', label: 'Ukuran Kertas', type: 'select', options: [
        { value: '80', label: '80mm (Standar Thermal Struk)' },
        { value: '58', label: '58mm (Mini Portable Thermal)' },
      ]},
      { field: 'printer_auto_print_receipt', label: 'Cetak Otomatis Struk', type: 'toggle' },
    ]},
    { title: 'Katalog & Tampilan', icon: FiSmartphone, fields: [
      { field: 'qr_order_enabled', label: 'Aktifkan Katalog QR', type: 'toggle' },
      { field: 'catalog_show_total_sold', label: 'Tampilkan Total Produk Terjual di Katalog', type: 'toggle' },
    ]},
    { title: 'Jam Operasional', icon: FiClock, fields: [
      { field: 'store_open_time', label: 'Jam Buka', type: 'time' },
      { field: 'store_close_time', label: 'Jam Tutup', type: 'time' },
    ]},
    { title: 'Sistem', icon: FiSettings, fields: [
      { field: 'system_timezone', label: 'Zona Waktu', type: 'select', options: [
        { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB)' },
        { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA)' },
        { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT)' },
      ]},
      { field: 'system_locale', label: 'Bahasa', type: 'select', options: [
        { value: 'id', label: 'Bahasa Indonesia (id)' },
        { value: 'en', label: 'English (en)' },
      ]},
    ]},
  ];

  return (
    <AuthenticatedLayout pageTitle={locale === 'en' ? 'Settings' : 'Pengaturan'}>
      <Head title={`${locale === 'en' ? 'Settings' : 'Pengaturan'} - Toko Sparepart`}>
        <meta name="description" content="Pengaturan sistem toko, logo, printer struk, pajak, zona waktu, dan bahasa." />
      </Head>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {saved && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl flex items-center gap-2 font-bold text-sm">
            <FiCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
            Pengaturan berhasil disimpan!
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FiHome className="text-blue-600 dark:text-yellow-400" size={20} />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Logo Toko</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-24 aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0 p-1">
              {logoPreview ? (
                <img src={logoPreview} alt="preview" className="w-full h-full object-contain" />
              ) : logoUrl ? (
                <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 text-center px-1">Belum ada logo</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors w-fit">
                  <FiUpload size={14} />
                  <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
                  }} className="hidden" />
                  Pilih Gambar
                </label>

                {(logoUrl || logoPreview) && (
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition border border-red-700 shadow-xs cursor-pointer"
                  >
                    <FiTrash2 size={14} />
                    <span>Hapus Logo</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">JPEG, PNG, WEBP. Maks 2MB.</p>
              {logoPreview && (
                <div className="flex gap-2 pt-1">
                  <button onClick={handleUploadLogo} disabled={uploading} className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-700">
                    {uploading ? 'Mengupload...' : 'Simpan Logo Baru'}
                  </button>
                  <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer">
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PROMO BANNER SECTION */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FiUpload className="text-blue-600 dark:text-yellow-400" size={20} />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Banner Promo Self-Order</h3>
            <div className="ml-auto flex items-center gap-2">
              <Toggle
                value={form.promo_banner_enabled}
                onChange={() => set('promo_banner_enabled', form.promo_banner_enabled === 'true' ? 'false' : 'true')}
              />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {form.promo_banner_enabled === 'true' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>
          {form.promo_banner_enabled !== 'true' ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">Banner promo dinonaktifkan. Aktifkan toggle di atas untuk mengatur banner.</p>
          ) : (
          <>
          <p className="text-xs text-slate-500 dark:text-slate-400">Upload hingga 3 foto banner promo yang akan tampil sebagai auto-slide carousel di halaman self-order pelanggan. Ratio ideal: 16:5 (misalnya 1600×500 px).</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(slot => {
              const b = banners[slot] || {};
              const preview = b.preview || b.url;
              const isUploading = bannerUploading[slot];
              return (
                <div key={slot} className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Slot {slot}</p>
                  {/* Preview */}
                  <div className="w-full aspect-[16/5] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                    {preview ? (
                      <img src={preview} alt={`Banner ${slot}`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">Belum ada banner</span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors">
                      <FiUpload size={12} />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={e => handleBannerFileSelect(slot, e.target.files?.[0])}
                        className="hidden"
                      />
                      Pilih
                    </label>
                    {b.preview && (
                      <button
                        onClick={() => handleUploadBanner(slot)}
                        disabled={isUploading}
                        className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-300 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-slate-700"
                      >
                        {isUploading ? 'Upload...' : 'Simpan'}
                      </button>
                    )}
                    {b.preview && (
                      <button
                        onClick={() => setBanners(prev => ({ ...prev, [slot]: { ...prev[slot], file: null, preview: null } }))}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                    {b.url && !b.preview && (
                      <button
                        onClick={() => handleDeleteBanner(slot)}
                        disabled={isUploading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <FiTrash2 size={11} />
                        {isUploading ? 'Menghapus...' : 'Hapus'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {sections.map(({ title, icon: Icon, fields }) => (
            <div key={title} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Icon className="text-blue-600 dark:text-yellow-400" size={20} />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{title}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(({ field, label, type, options, span, note, maxLength, placeholder, inputMode, min, max, step }) => (
                  <div key={field} className={span ? 'sm:col-span-2' : ''}>
                    <label className={labelCls}>{label}</label>
                    {type === 'toggle' ? (
                      <div className="flex items-center gap-3 mt-1">
                        <Toggle
                          value={form[field]}
                          onChange={() => set(field, form[field] === 'true' ? 'false' : 'true')}
                        />
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                          {form[field] === 'true' ? 'Aktif' : 'Nonaktif'}
                        </span>
                        {note && <span className="text-xs text-slate-400 dark:text-slate-500 italic">— {note}</span>}
                      </div>
                    ) : type === 'select' ? (
                      <select
                        value={form[field] || ''}
                        onChange={e => set(field, e.target.value)}
                        className={inputCls}
                      >
                        {options?.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : type === 'time' ? (
                      <input type="time" value={form[field] || ''} onChange={e => set(field, e.target.value)} className={fieldErrors[field] ? inputCls + ' !border-red-400 !ring-red-400' : inputCls} />
                    ) : (
                      <input
                        type={type}
                        value={form[field] || ''}
                        onChange={e => {
                          let val = e.target.value;
                          // For tel fields, strip non-phone characters on input
                          if (type === 'tel') {
                            val = val.replace(/[^0-9+\-\s()]/g, '');
                          }
                          set(field, val);
                        }}
                        className={fieldErrors[field] ? inputCls + ' !border-red-400 !ring-red-400' : inputCls}
                        maxLength={maxLength}
                        placeholder={placeholder}
                        inputMode={inputMode}
                        min={min}
                        max={max}
                        step={step}
                      />
                    )}
                    {fieldErrors[field] && (
                      <p className="text-[11px] text-red-500 font-semibold mt-1">{fieldErrors[field]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end sticky bottom-4">
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer">
              <FiSave size={18} />
              {loading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
            </button>
          </div>
        </form>

        {/* RESET DATA TRANSAKSI */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FiTrash2 className="text-red-600 dark:text-red-400" size={20} />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Reset Data Transaksi</h3>
          </div>
          
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Fitur ini digunakan untuk menghapus riwayat transaksi dan mengosongkan data pesanan sistem:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <span className="font-extrabold block text-slate-900 dark:text-white mb-1">Data Yang Akan Dihapus:</span>
                <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <li>Riwayat Pesanan (Orders & Order Items)</li>
                  <li>Riwayat Pembayaran (Payments)</li>
                  <li>Log Riwayat Stok (Inventory Logs)</li>
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <span className="font-extrabold block text-slate-900 dark:text-white mb-1">Data Yang Tidak Dihapus:</span>
                <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <li>Katalog Produk & Kategori</li>
                  <li>Akun Pengguna (Owner & Kasir)</li>
                  <li>Pengaturan Toko & Sistem</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <FiTrash2 size={16} />
              <span>Reset Data Transaksi</span>
            </button>
          </div>
        </div>

        {/* Modal Konfirmasi Reset Transaksi */}
        <Modal show={showResetModal} onClose={() => setShowResetModal(false)} maxWidth="md">
          <form onSubmit={handleResetTransactions} className="p-6 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 bg-red-50 dark:bg-red-950/60 rounded-lg text-red-600 dark:text-red-400">
                <FiTrash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Konfirmasi Reset Data Transaksi</h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/60 p-3.5 rounded-lg border border-yellow-200 dark:border-yellow-700 text-xs font-semibold text-yellow-800 dark:text-yellow-300 space-y-1">
              <p>Seluruh riwayat pesanan dan pembayaran akan dihapus dari sistem. Data produk dan stok Anda akan tetap tersimpan.</p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                <FiLock size={13} className="text-slate-400 dark:text-slate-500" />
                <span>Masukkan Kata Sandi untuk Konfirmasi:</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Kata sandi Anda..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setShowResetModal(false); setConfirmPassword(''); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isResetting || !confirmPassword}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-xs font-extrabold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <FiTrash2 size={14} />
                <span>{isResetting ? 'Mereset Data...' : 'Reset Transaksi'}</span>
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </AuthenticatedLayout>
  );
}
