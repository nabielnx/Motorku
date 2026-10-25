import DeleteButton from '@/Components/Admin/DeleteButton';
import AdminButton from '@/Components/Admin/Button';
import ImagePicker from '@/Components/ImagePicker';
import { IMAGE_HELP, validImage } from '@/Utils/imageUpload';
import { useEffect, useState } from 'react';
import { readQrisPayload, qrisErrorMessage } from '@/Utils/qris';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiSave, FiCheck, FiHome, FiPercent, FiCreditCard, FiPrinter, FiSmartphone, FiClock, FiSettings, FiUpload, FiClipboard, FiTrash2, FiAlertTriangle, FiBookOpen } from 'react-icons/fi';

const settingCategories = [
  { key: 'store', label: 'Toko', icon: FiHome, description: 'Identitas, kontak, logo, dan jam operasional toko.' },
  { key: 'catalog', label: 'Katalog', icon: FiSmartphone, description: 'Katalog pelanggan, referensi motor, dan banner promo.' },
  { key: 'payment', label: 'Pembayaran', icon: FiCreditCard, description: 'Metode pembayaran, pajak, dan printer struk.' },
  { key: 'system', label: 'Sistem', icon: FiSettings, description: 'Bahasa, zona waktu, tampilan login, dan penghapusan data.' },
];

const fieldMap = {
  store_tagline: { group: 'store', key: 'tagline' },
  store_name:                  { group: 'store',          key: 'name' },
  store_phone:                 { group: 'store',          key: 'phone' },
  store_email:                 { group: 'store',          key: 'email' },
  store_address:               { group: 'store',          key: 'address' },

  tax_enabled:                 { group: 'tax',             key: 'enabled' },
  tax_percentage:              { group: 'tax',             key: 'percentage' },
  payment_cash_enabled:        { group: 'payment',         key: 'cash_enabled' },
  payment_qris_enabled:        { group: 'payment',         key: 'qris_enabled' },
  payment_card_enabled:        { group: 'payment',         key: 'card_enabled' },
  printer_paper_size:          { group: 'printer',         key: 'paper_size' },
  printer_auto_print_receipt:  { group: 'printer',         key: 'auto_print_receipt' },
  qr_order_enabled:            { group: 'qr_order',        key: 'enabled' },
  qr_order_session_timeout:    { group: 'qr_order',        key: 'session_timeout' },
  references_enabled: { group: 'references', key: 'enabled' },
  catalog_show_total_sold:     { group: 'catalog',         key: 'show_total_sold' },
  promo_banner_enabled:        { group: 'promo_banner',    key: 'enabled' },
  store_open_time:             { group: 'store',           key: 'open_time' },
  store_close_time:            { group: 'store',           key: 'close_time' },
  system_timezone:             { group: 'system',          key: 'timezone' },
  system_locale:               { group: 'system',          key: 'locale' },
  system_deletion_enabled:     { group: 'system',          key: 'deletion_enabled' },
};

const defaults = {
  references_enabled: 'true',
  store_tagline: 'POS & ORDER',
  store_name: 'Motorku', store_phone: '081234567890',
  store_email: 'info@tokosparepart.com', store_address: 'Jl. Contoh No. 1',
  tax_enabled: 'true', tax_percentage: '10',
  payment_cash_enabled: 'true', payment_qris_enabled: 'true', payment_card_enabled: 'false',
  printer_paper_size: '80', printer_auto_print_receipt: 'true',
  qr_order_enabled: 'true', qr_order_session_timeout: '120', catalog_show_total_sold: 'true', promo_banner_enabled: 'false',
  store_open_time: '10:00', store_close_time: '22:00',
  system_timezone: 'Asia/Jakarta', system_locale: 'id',
  system_deletion_enabled: 'true',
};

// Frontend validation rules per field
const fieldValidators = {
  store_phone: {
    validate: (v) => /^[0-9+\-\s()]{8,20}$/.test(v),
    message: 'Nomor telepon hanya boleh angka, +, -, spasi (8-20 karakter)',
  },
  store_email: {
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: 'Format email tidak valid',
  },
  store_name: {
    validate: (v) => v.trim().length >= 1 && v.length <= 100,
    message: 'Nama toko wajib diisi (maks 100 karakter)',
  },
  store_address: {
    validate: (v) => v.trim().length >= 1 && v.length <= 500,
    message: 'Alamat wajib diisi (maks 500 karakter)',
  },
  tax_percentage: {
    validate: (v) => { const n = parseFloat(v); return !isNaN(n) && n >= 0 && n <= 100; },
    message: 'Persentase pajak harus angka 0-100',
  },
};

function Toggle({ value, onChange, label, id, disabled = false }) {
    const on = value === 'true';
    return (
      <label className={`relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input id={id} type="checkbox" checked={on} onChange={onChange} disabled={disabled} aria-label={label} className="sr-only peer" />
        <div className="relative w-10 h-5 bg-slate-200 peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#19231f] rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
      </label>
    );
}

export default function SettingIndex() {
  const { props } = usePage();
  const locale = props.app_settings?.locale || 'id';
  const [form, setForm] = useState(() => {
    const initial = { ...defaults };
    Object.keys(fieldMap).forEach(field => {
      if (props.initialSettings?.[field] !== undefined) initial[field] = props.initialSettings[field];
    });
    return initial;
  });
  const [selectedCategory, setSelectedCategory] = useState('store');
  const [savedForm, setSavedForm] = useState(form);
  const [savingReferences, setSavingReferences] = useState(false);
  const [referenceError, setReferenceError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUrl, setLogoUrl] = useState(props.logoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [qrisFile, setQrisFile] = useState(null);
  const [qrisPreview, setQrisPreview] = useState(null);
  const [qrisUrl, setQrisUrl] = useState(props.qrisUrl || null);
  const [qrisConfig, setQrisConfig] = useState(props.qrisConfig || null);
  const [uploadingQris, setUploadingQris] = useState(false);
  const [savingQrisEnabled, setSavingQrisEnabled] = useState(false);
  useEffect(() => () => { if (qrisPreview) URL.revokeObjectURL(qrisPreview); }, [qrisPreview]);
  const [loginImageFile, setLoginImageFile] = useState(null);
  const [loginImagePreview, setLoginImagePreview] = useState(null);
  const [loginImageUrl, setLoginImageUrl] = useState(props.loginImageUrl || null);
  const [uploadingLoginImage, setUploadingLoginImage] = useState(false);

  // Banner promo state: { 1: { url, file, preview }, 2: {...}, 3: {...} }
  const [banners, setBanners] = useState(() => ({
    1: { url: props.bannerUrls?.[1] || null },
    2: { url: props.bannerUrls?.[2] || null },
    3: { url: props.bannerUrls?.[3] || null },
  }));
  const [bannerUploading, setBannerUploading] = useState({ 1: false, 2: false, 3: false });
  // Konfirmasi hapus gambar toko.
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
        toast.success('Logo toko berhasil dihapus.');
      } catch (err) {
        toast.error('Gagal menghapus logo: ' + (err.response?.data?.message || err.message));
      } finally {
        setUploading(false);
      }
    } else if (deleteConfirm.type === 'qris') {
      setUploadingQris(true);
      try {
        await axios.delete('/api/settings/qris-image');
        setQrisUrl(null);
        setQrisFile(null);
        setQrisPreview(null);
        setQrisConfig(null);
        setForm(prev => ({ ...prev, payment_qris_enabled: 'false' }));
        router.reload({ only: ['app_settings'] });
        toast.success('Gambar QRIS dihapus dan pembayaran QRIS dinonaktifkan.');
      } catch (err) {
        toast.error('Gagal menghapus gambar QRIS: ' + (err.response?.data?.message || err.message));
      } finally {
        setUploadingQris(false);
      }
    } else if (deleteConfirm.type === 'login_image') {
      setUploadingLoginImage(true);
      try {
        await axios.delete('/api/settings/login-image');
        setLoginImageUrl(null);
        setLoginImageFile(null);
        setLoginImagePreview(null);
        toast.success('Gambar login berhasil dihapus.');
      } catch (err) {
        toast.error('Gagal menghapus gambar login: ' + (err.response?.data?.message || err.message));
      } finally {
        setUploadingLoginImage(false);
      }
    } else {
      const slot = deleteConfirm.slot;
      setBannerUploading(prev => ({ ...prev, [slot]: true }));
      try {
        await axios.delete(`/api/settings/banners/${slot}`);
        setBanners(prev => ({ ...prev, [slot]: {} }));
        toast.success(`Banner slot ${slot} berhasil dihapus.`);
      } catch (err) {
        toast.error(`Gagal menghapus banner slot ${slot}: ` + (err.response?.data?.message || err.message));
      } finally {
        setBannerUploading(prev => ({ ...prev, [slot]: false }));
      }
    }
    setDeleteConfirm(null);
  };

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
    } catch (err) {
      toast.error('Gagal upload logo: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = () => {
    setDeleteConfirm({ type: 'logo' });
  };

  const handleToggleReferences = async () => {
    if (savingReferences || loading) return;
    const enabled = form.references_enabled !== 'true';
    setSavingReferences(true);
    setReferenceError('');
    try {
      await axios.post('/api/settings', { settings: [{ group: 'references', key: 'enabled', value: String(enabled) }] });
      setForm(prev => ({ ...prev, references_enabled: String(enabled) }));
      setSavedForm(prev => ({ ...prev, references_enabled: String(enabled) }));
      router.reload({ only: ['app_settings', 'reference_modules'] });
      toast.success(enabled ? 'Referensi dan Motor Saya diaktifkan.' : 'Referensi dan Motor Saya dinonaktifkan. Data tetap tersimpan.');
    } catch (error) {
      const message = error.response?.data?.message || 'Status referensi gagal disimpan. Coba ubah toggle lagi.';
      setReferenceError(message);
      toast.error(message);
    } finally {
      setSavingReferences(false);
    }
  };

  const handleToggleQris = async () => {
    if (savingQrisEnabled || uploadingQris || loading) return;
    const enabled = form.payment_qris_enabled !== 'true';
    if (enabled && !qrisUrl) {
      toast.error('Unggah dan simpan gambar QRIS terlebih dahulu.');
      return;
    }
    setSavingQrisEnabled(true);
    try {
      await axios.post('/api/settings', { settings: [{ group: 'payment', key: 'qris_enabled', value: String(enabled) }] });
      setForm(prev => ({ ...prev, payment_qris_enabled: String(enabled) }));
      setQrisConfig(prev => prev ? { ...prev, enabled, available: enabled && Boolean(qrisUrl) } : prev);
      router.reload({ only: ['app_settings'] });
      toast.success(enabled ? 'Pembayaran QRIS aktif untuk POS dan checkout pelanggan.' : 'Pembayaran QRIS dinonaktifkan.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status QRIS gagal disimpan. Coba lagi.');
    } finally {
      setSavingQrisEnabled(false);
    }
  };

  const handleUploadQris = async () => {
    if (!qrisFile) return;
    setUploadingQris(true);
    try {
      const data = new FormData();
      data.append('qris_image', qrisFile);
      data.append('qris_payload', await readQrisPayload(qrisFile));
      const response = await axios.post('/api/settings/qris-image', data);
      setQrisUrl(response.data?.url || null);
      setQrisConfig(response.data);
      setQrisFile(null);
      setQrisPreview(null);
      toast.success(form.payment_qris_enabled === 'true' ? 'Gambar QRIS toko berhasil disimpan.' : 'Gambar disimpan. Aktifkan pembayaran QRIS melalui toggle di atas.');
    } catch (err) {
      toast.error(qrisErrorMessage(err));
    } finally {
      setUploadingQris(false);
    }
  };

  const handleActivateQris = async () => {
    if (!qrisUrl || !qrisConfig?.image_revision) return;
    setUploadingQris(true);
    try {
      const payload = await readQrisPayload(qrisUrl);
      const { data } = await axios.post('/api/settings/qris-payload', { qris_payload: payload, image_revision: qrisConfig.image_revision });
      setQrisConfig(data);
      toast.success(`Nominal otomatis aktif untuk ${data.merchant.name}.`);
    } catch (error) {
      toast.error(qrisErrorMessage(error));
    } finally {
      setUploadingQris(false);
    }
  };

  const handleUploadLoginImage = async () => {
    if (!loginImageFile) return;
    setUploadingLoginImage(true);
    try {
      const fd = new FormData();
      fd.append('login_image', loginImageFile);
      const res = await axios.post('/api/settings/login-image', fd);
      setLoginImageUrl(res.data?.url || null);
      setLoginImageFile(null);
      setLoginImagePreview(null);
      toast.success('Gambar login berhasil disimpan.');
    } catch (err) {
      toast.error('Gagal upload gambar login: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingLoginImage(false);
    }
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
    if (!validImage(file)) return;
    setBanners(prev => ({ ...prev, [slot]: { ...prev[slot], file, preview: URL.createObjectURL(file) } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || savingQrisEnabled || uploadingQris || savingReferences) return;

    // Validate and save only the selected category; media and feature toggles save separately.
    const errors = {};
    Object.entries(fieldValidators).forEach(([field, { validate, message }]) => {
      if (categoryFields.includes(field) && !validate(form[field] || '')) {
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
      const settings = categoryFields.map(field => ({ field, ...fieldMap[field] })).map(({ field, group, key }) => ({
        group, key, value: String(form[field]),
      }));
      await axios.post('/api/settings', { settings });
      setSavedForm(prev => ({ ...prev, ...Object.fromEntries(categoryFields.map(field => [field, form[field]])) }));
      router.reload({ only: ['app_settings', 'reference_modules', 'business'] });
      toast.success('Pengaturan ' + activeCategory.label.toLowerCase() + ' disimpan.');
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

  const inputCls = 'admin-control w-full min-w-0 px-3 py-2';
  const labelCls = 'block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1';

  const sections = [
    { category: 'store', title: 'Informasi Toko', icon: FiHome, fields: [
      { field: 'store_tagline', label: 'Tagline Toko', type: 'text', maxLength: 120, placeholder: 'POS & ORDER' },
      { field: 'store_name', label: 'Nama Toko', type: 'text', maxLength: 100, placeholder: 'Nama toko Anda' },
      { field: 'store_phone', label: 'Telepon', type: 'tel', maxLength: 20, placeholder: '081234567890', inputMode: 'tel' },
      { field: 'store_email', label: 'Email', type: 'email', maxLength: 100, placeholder: 'email@contoh.com' },
      { field: 'store_address', label: 'Alamat', type: 'text', span: true, maxLength: 500, placeholder: 'Jl. Contoh No. 1' },
    ]},

    { category: 'payment', title: 'Metode Pembayaran', icon: FiCreditCard, fields: [
      { field: 'payment_cash_enabled', label: 'Pembayaran tunai di kasir', type: 'toggle', span: true },
    ]},
    { category: 'payment', title: 'Pajak', icon: FiPercent, fields: [
      { field: 'tax_enabled', label: 'Aktifkan Pajak', type: 'toggle' },
      { field: 'tax_percentage', label: 'Persentase Pajak (%)', type: 'number', min: 0, max: 100, step: 0.1 },
    ]},
    { category: 'payment', title: 'Printer', icon: FiPrinter, fields: [
      { field: 'printer_paper_size', label: 'Ukuran Kertas', type: 'select', options: [
        { value: '80', label: '80mm (Standar Thermal Struk)' },
        { value: '58', label: '58mm (Mini Portable Thermal)' },
      ]},
      { field: 'printer_auto_print_receipt', label: 'Cetak Otomatis Struk', type: 'toggle' },
    ]},
    { category: 'catalog', title: 'Katalog & Tampilan', icon: FiSmartphone, fields: [
      { field: 'qr_order_enabled', label: 'Aktifkan Katalog QR', type: 'toggle' },
      { field: 'catalog_show_total_sold', label: 'Tampilkan Total Produk Terjual di Katalog', type: 'toggle' },
    ]},
    { category: 'store', title: 'Jam Operasional', icon: FiClock, fields: [
      { field: 'store_open_time', label: 'Jam Buka', type: 'time' },
      { field: 'store_close_time', label: 'Jam Tutup', type: 'time' },
    ]},
    { category: 'system', title: 'Sistem', icon: FiSettings, fields: [
      { field: 'system_deletion_enabled', label: 'Izinkan Penghapusan Data Admin', type: 'toggle', span: true, note: 'Berlaku untuk seluruh data admin, termasuk jenis bawaan dan custom. Saat aktif, jenis dan kategori dapat dihapus beserta seluruh isinya secara permanen. Nonaktifkan untuk mengunci penghapusan.' },
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

  const activeCategory = settingCategories.find(category => category.key === selectedCategory);
  const fieldsForCategory = category => [
    ...sections.filter(section => section.category === category).flatMap(section => section.fields.map(item => item.field)),
    ...(category === 'catalog' ? ['promo_banner_enabled'] : []),
  ];
  const categoryFields = fieldsForCategory(selectedCategory);
  const categoryDirty = categoryFields.some(field => form[field] !== savedForm[field]);

  return (
    <AuthenticatedLayout pageTitle={locale === 'en' ? 'Settings' : 'Pengaturan'}>
      <Head title={`${locale === 'en' ? 'Settings' : 'Pengaturan'}`}>
        <meta name="description" content="Pengaturan sistem toko, logo, printer struk, pajak, zona waktu, dan bahasa." />
      </Head>
      <div className="admin-settings max-w-6xl mx-auto space-y-4 pb-8">
        <div>
          <h2 className="font-heading text-xl font-semibold">Pengaturan toko</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Atur toko sesuai kebutuhan operasional Anda.</p>
        </div>
        <nav aria-label="Kategori pengaturan" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {settingCategories.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" aria-pressed={selectedCategory === key} disabled={loading || savingReferences || savingQrisEnabled}
              onClick={() => setSelectedCategory(key)}
              className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19231f] dark:focus-visible:outline-[#FFDD00] ${selectedCategory === key ? 'border-[#19231f] bg-[#19231f] text-white dark:border-[#FFDD00] dark:bg-[#FFDD00] dark:text-[#19231f]' : 'border-[#dedfd7] bg-white text-[#19231f] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`}>
              <Icon aria-hidden="true" size={17} /><span>{label}</span>
              {fieldsForCategory(key).some(field => form[field] !== savedForm[field]) && <span className="ml-auto text-xs" aria-label="Ada perubahan belum disimpan">●</span>}
            </button>
          ))}
        </nav>
        <p className="text-xs text-slate-600 dark:text-slate-300">{activeCategory.description}</p>
        <form id="category-settings" onSubmit={handleSubmit} className="space-y-6">
          {sections.filter(section => section.category === selectedCategory).map(({ title, icon: Icon, fields }) => (
            <div key={title} className="admin-surface admin-setting-section bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <div className="admin-section-header flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Icon className="text-primary dark:text-yellow-400" size={20} />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{title}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(({ field, label, type, options, span, note, maxLength, placeholder, inputMode, min, max, step }) => (
                  <div key={field} className={`min-w-0 ${span ? 'sm:col-span-2' : ''}`}>
                    <label htmlFor={`setting-${field}`} className={labelCls}>{label}</label>
                    {type === 'toggle' ? (
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <Toggle
                          label={label}
                          id={`setting-${field}`}
                          disabled={loading}
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
                        id={`setting-${field}`}
                        disabled={loading}
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
                      <input id={`setting-${field}`} disabled={loading} type="time" value={form[field] || ''} onChange={e => set(field, e.target.value)} className={fieldErrors[field] ? inputCls + ' !border-red-400 !ring-red-400' : inputCls} />
                    ) : (
                      <input
                        id={`setting-${field}`}
                        disabled={loading}
                        type={type}
                        aria-invalid={Boolean(fieldErrors[field])}
                        aria-describedby={fieldErrors[field] ? `error-${field}` : undefined}
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
                      <p id={`error-${field}`} role="alert" className="text-xs text-red-700 dark:text-red-300 font-semibold mt-1">{fieldErrors[field]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

        </form>
        <div hidden={selectedCategory !== 'store'} className="space-y-4">
        <div className="admin-surface admin-setting-section bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="admin-section-header flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FiHome className="text-primary dark:text-yellow-400" size={20} />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Logo Toko</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
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
                <ImagePicker label="logo toko" disabled={uploading} onSelect={file => {
                  if (validImage(file)) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
                }} />

                {(logoUrl || logoPreview) && (
                  <DeleteButton as={AdminButton}
                    type="button"
                    onClick={handleDeleteLogo}
                    disabled={uploading}
                    variant="danger"
                  >
                    <FiTrash2 size={14} />
                    <span>Hapus Logo</span>
                  </DeleteButton>
                )}
              </div>
              <p className="admin-help">{IMAGE_HELP}</p>
              {logoPreview && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <AdminButton onClick={handleUploadLogo} disabled={uploading} variant="primary">
                    {uploading ? 'Mengupload...' : 'Simpan Logo Baru'}
                  </AdminButton>
                  <AdminButton onClick={() => { setLogoFile(null); setLogoPreview(null); }} variant="secondary">
                    Batal
                  </AdminButton>
                </div>
              )}
            </div>
          </div>
        </div>

        </div>
        <div hidden={selectedCategory !== 'catalog'} className="space-y-4">
        <section className="admin-surface admin-setting-section space-y-4 border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6" aria-labelledby="reference-setting-title">
          <div className="admin-section-header flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
            <FiBookOpen aria-hidden="true" size={20} />
            <h3 id="reference-setting-title" className="flex-1 text-base font-semibold">Referensi &amp; Motor Saya</h3>
            <Toggle label="Aktifkan Referensi dan Motor Saya" value={form.references_enabled} onChange={handleToggleReferences} disabled={savingReferences || loading} />
          </div>
          <div className="space-y-2">
            <p role="status" className="text-sm font-semibold">{savingReferences ? 'Menyimpan status referensi…' : form.references_enabled === 'true' ? 'Aktif untuk pelanggan dan admin.' : 'Nonaktif. Data referensi tetap tersimpan.'}</p>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">Mengatur menu Motor Saya, Data Referensi di admin, dan informasi kecocokan motor pada produk. Perubahan toggle langsung tersimpan.</p>
            {referenceError && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{referenceError}</p>}
          </div>
        </section>
        {props.business?.public_url && <section className="admin-surface rounded-lg border border-[#dedfd7] bg-white p-4">
          <h3 className="text-sm font-semibold text-[#19231f] dark:text-slate-100">Link katalog usaha</h3>
          <a href={props.business.public_url} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-xs font-semibold text-[#19231f] underline dark:text-[#FFDD00]">{props.business.public_url}</a>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Bagikan link ini kepada pelanggan usaha Anda.</p>
        </section>}
        {/* PROMO BANNER SECTION */}
        <div className="admin-surface admin-setting-section bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FiUpload className="shrink-0 text-primary dark:text-yellow-400" size={20} />
            <h3 className="min-w-0 flex-1 font-extrabold text-base text-slate-900 dark:text-white">Banner Promo Self-Order</h3>
            <div className="ml-auto w-full sm:w-auto shrink-0 flex items-center justify-end gap-2">
              <Toggle
                label="Banner Promo Self-Order"
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Upload hingga 3 foto banner promo. Banner yang terisi berganti otomatis setiap 5 detik di katalog pelanggan.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400"><strong>Ukuran ideal: 600 × 1000 px (tegak, rasio 3:5).</strong> Banner mengikuti rasio asli gambar agar tampil utuh tanpa dipotong. Gunakan rasio yang sama untuk ketiga slot agar lebarnya konsisten saat berganti.</p>
          <p className="admin-help">{IMAGE_HELP}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(slot => {
              const b = banners[slot] || {};
              const preview = b.preview || b.url;
              const isUploading = bannerUploading[slot];
              return (
                <div key={slot} className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Slot {slot}</p>
                  {/* Preview */}
                  <div className="w-full max-w-[180px] aspect-[3/5] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                    {preview ? (
                      <img src={preview} alt={`Banner ${slot}`} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500">Belum ada banner<br />600 × 1000 px · 3:5</span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5">
                    <ImagePicker label={`banner slot ${slot}`} disabled={isUploading} onSelect={file => handleBannerFileSelect(slot, file)} />
                    {b.preview && (
                      <AdminButton
                        onClick={() => handleUploadBanner(slot)}
                        disabled={isUploading}
                        variant="primary"
                      >
                        {isUploading ? 'Upload...' : 'Simpan'}
                      </AdminButton>
                    )}
                    {b.preview && (
                      <AdminButton
                        onClick={() => setBanners(prev => ({ ...prev, [slot]: { ...prev[slot], file: null, preview: null } }))}
                        variant="secondary"
                      >
                        Batal
                      </AdminButton>
                    )}
                    {b.url && !b.preview && (
                      <DeleteButton as={AdminButton}
                        onClick={() => handleDeleteBanner(slot)}
                        disabled={isUploading}
                        variant="danger"
                      >
                        <FiTrash2 size={11} />
                        {isUploading ? 'Menghapus...' : 'Hapus'}
                      </DeleteButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
          )}
        </div>
        </div>
        <div hidden={selectedCategory !== 'payment'}>
        <div className="admin-surface admin-setting-section bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="admin-section-header flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FiUpload className="text-primary dark:text-yellow-400" size={20} />
            <h3 className="flex-1 font-extrabold text-base text-slate-900 dark:text-white">Pembayaran QRIS</h3>
            <Toggle label="Aktifkan pembayaran QRIS" value={form.payment_qris_enabled} onChange={handleToggleQris} disabled={savingQrisEnabled || uploadingQris || loading || (!qrisUrl && form.payment_qris_enabled !== 'true')} />
          </div>
          <div className="space-y-3">
            <p role="status" className="text-xs font-semibold text-[#19231f] dark:text-slate-100">
              {savingQrisEnabled ? 'Menyimpan status QRIS...' : !qrisUrl ? 'Belum ada gambar QRIS.' : form.payment_qris_enabled === 'true' ? 'Aktif untuk POS dan checkout pelanggan.' : 'Nonaktif. Aktifkan toggle untuk menerima pembayaran QRIS.'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Unggah gambar QRIS toko, lalu aktifkan pembayaran melalui toggle. Perubahan toggle langsung tersimpan; kasir tetap memeriksa dana masuk sebelum mengonfirmasi lunas.</p>
            {qrisConfig?.dynamic_available && <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><FiCheck aria-hidden="true" /> QRIS mendukung nominal otomatis · {qrisConfig.merchant.name} · {qrisConfig.merchant.city}</p>}
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-32 h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {qrisPreview || qrisUrl ? <img src={qrisPreview || qrisUrl} alt="QRIS toko" className="w-full h-full object-contain" /> : <span className="text-xs text-slate-400">Belum ada QRIS</span>}
            </div>
            <div className="space-y-2">
              <ImagePicker label="QRIS toko" disabled={uploadingQris || savingQrisEnabled || loading} onSelect={file => {
                if (validImage(file)) { setQrisFile(file); setQrisPreview(URL.createObjectURL(file)); }
              }} />
              <p className="admin-help">{IMAGE_HELP}</p>
              <div className="flex flex-wrap gap-2">
                {qrisFile && <AdminButton type="button" onClick={handleUploadQris} disabled={uploadingQris || savingQrisEnabled || loading} variant="primary">{uploadingQris ? 'Menyimpan...' : 'Simpan QRIS'}</AdminButton>}
                {qrisUrl && !qrisFile && !qrisConfig?.dynamic_available && <AdminButton type="button" onClick={handleActivateQris} disabled={uploadingQris || savingQrisEnabled || loading} variant="primary">{uploadingQris ? 'Membaca QRIS...' : 'Aktifkan nominal otomatis'}</AdminButton>}
                {qrisUrl && <DeleteButton type="button" onClick={() => setDeleteConfirm({ type: 'qris' })} disabled={uploadingQris || savingQrisEnabled || loading} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-bold disabled:opacity-50">Hapus QRIS</DeleteButton>}
              </div>
            </div>
          </div>
        </div>

        </div>
        <div hidden={selectedCategory !== 'system'}>
        {/* LOGIN IMAGE SECTION */}
        <div className="admin-surface admin-setting-section bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="admin-section-header flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FiUpload className="text-primary dark:text-yellow-400" size={20} />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Gambar Halaman Login</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gambar ini ditampilkan di sisi kiri halaman login. Rekomendasi resolusi minimal 1200×800px.</p>
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-48 h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {loginImagePreview || loginImageUrl ? (
                <img src={loginImagePreview || loginImageUrl} alt="Login background" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">Belum ada gambar</span>
              )}
            </div>
            <div className="space-y-2">
              <ImagePicker label="halaman login" disabled={uploadingLoginImage} onSelect={file => {
                if (validImage(file)) { setLoginImageFile(file); setLoginImagePreview(URL.createObjectURL(file)); }
              }} />
              <p className="admin-help">{IMAGE_HELP}</p>
              <div className="flex flex-wrap gap-2">
                {loginImageFile && (
                  <AdminButton type="button" onClick={handleUploadLoginImage} disabled={uploadingLoginImage} variant="primary">
                    {uploadingLoginImage ? 'Menyimpan...' : 'Simpan Gambar'}
                  </AdminButton>
                )}
                {loginImageUrl && (
                  <DeleteButton type="button" onClick={() => setDeleteConfirm({ type: 'login_image' })} disabled={uploadingLoginImage} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-bold disabled:opacity-50 hover:bg-red-50">
                    Hapus Gambar
                  </DeleteButton>
                )}
              </div>
            </div>
          </div>
        </div>

        </div>
        <div className="admin-surface sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <p role="status" className="text-xs text-slate-600 dark:text-slate-300">{categoryDirty ? 'Ada perubahan belum disimpan di kategori ini.' : 'Perubahan di kategori ini sudah tersimpan.'}</p>
          <AdminButton form="category-settings" type="submit" disabled={!categoryDirty || loading || savingQrisEnabled || uploadingQris || savingReferences} variant="primary">
            <FiSave size={16} aria-hidden="true" />{loading ? 'Menyimpan…' : 'Simpan perubahan'}
          </AdminButton>
        </div>

        <AdminDialog show={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} className="max-w-sm overflow-y-auto">
          <div className="p-6 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            <DialogTitle className="admin-dialog-title">Hapus {deleteConfirm?.type === 'logo' ? 'logo toko' : deleteConfirm?.type === 'qris' ? 'gambar QRIS toko' : deleteConfirm?.type === 'login_image' ? 'gambar background login' : 'banner promo'}?</DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gambar yang sedang dipakai akan dihapus.</p>
            <div className="flex justify-end gap-2">
              <AdminButton type="button" onClick={() => setDeleteConfirm(null)} variant="secondary">Batal</AdminButton>
              <DeleteButton as={AdminButton} type="button" onClick={executeDelete} variant="danger">Hapus</DeleteButton>
            </div>
          </div>
        </AdminDialog>



      </div>
    </AuthenticatedLayout>
  );
}
