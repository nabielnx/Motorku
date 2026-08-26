export const translations = {
  id: {
    // Navigation Sections
    section_utama: 'UTAMA',
    section_manajemen: 'MANAJEMEN',
    section_laporan: 'LAPORAN',
    section_administrasi: 'ADMINISTRASI',

    // Navigation Items
    dashboard: 'Dashboard',
    pos_kasir: 'POS Kasir',
    daftar_pesanan: 'Pesanan',
    menu_produk: 'Produk',
    manajemen_meja: 'Manajemen Meja',
    stok_inventaris: 'Stok Inventaris',
    laporan_keuangan: 'Laporan Keuangan',
    kelola_staf: 'Kelola Staf',
    pengaturan: 'Pengaturan',

    // User Profile / Header
    my_profile: 'Profil Saya',
    logout: 'Keluar',
    settings: 'Settings',

    // Common Buttons & Actions
    add: 'Tambah',
    edit: 'Edit',
    delete: 'Hapus',
    save: 'Simpan',
    cancel: 'Batal',
    search: 'Cari...',
    filter: 'Filter',
    print: 'Cetak',
    close: 'Tutup',
    actions: 'Aksi',
    status: 'Status',
    total: 'Total',
    date: 'Tanggal',

    // Pagination
    previous: 'Sebelumnya',
    next: 'Selanjutnya',
    showing: 'Menampilkan',
    of: 'dari',
    items: 'item',
  },
  en: {
    // Navigation Sections
    section_utama: 'MAIN',
    section_manajemen: 'MANAGEMENT',
    section_laporan: 'REPORTS',
    section_administrasi: 'ADMINISTRATION',

    // Navigation Items
    dashboard: 'Dashboard',
    pos_kasir: 'POS Cashier',
    daftar_pesanan: 'Orders',
    menu_produk: 'Products',
    manajemen_meja: 'Table Management',
    stok_inventaris: 'Inventory Stock',
    laporan_keuangan: 'Financial Reports',
    kelola_staf: 'Staff Management',
    pengaturan: 'Settings',

    // User Profile / Header
    my_profile: 'My Profile',
    logout: 'Logout',
    settings: 'Settings',

    // Common Buttons & Actions
    add: 'Add New',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search...',
    filter: 'Filter',
    print: 'Print',
    close: 'Close',
    actions: 'Actions',
    status: 'Status',
    total: 'Total',
    date: 'Date',

    // Pagination
    previous: 'Previous',
    next: 'Next',
    showing: 'Showing',
    of: 'of',
    items: 'items',
  }
};

export const getTranslation = (locale, key, fallback = key) => {
  const currentLocale = locale === 'en' ? 'en' : 'id';
  return translations[currentLocale]?.[key] || translations['id']?.[key] || fallback;
};
