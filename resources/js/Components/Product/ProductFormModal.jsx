import { FiX, FiChevronDown } from 'react-icons/fi';
import MoneyInput from '@/Components/MoneyInput';
import { IMAGE_ACCEPT, validImage, IMAGE_HELP } from '@/Utils/imageUpload';

export default function ProductFormModal({
    editingItem,
    setIsProductModalOpen,
    handleSaveProduct,
    productFormData,
    setProductFormData,
    categories,
    isLoading
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-2 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[calc(100svh-1rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden border border-slate-300 dark:border-slate-800 animate-in fade-in zoom-in duration-150 text-slate-900 dark:text-white">
                <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {editingItem ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </h3>
                    <button
                        type="button"
                        onClick={() => setIsProductModalOpen(false)}
                        aria-label="Tutup formulir produk"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSaveProduct} className="min-h-0 flex flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:p-6 space-y-3 sm:space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Produk</label>
                            <input
                                type="text"
                                required
                                value={productFormData.name}
                                onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                                placeholder="Contoh: Ban Luar Federal 70/90-14"
                                className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                            <div className="relative">
                                <select
                                    value={productFormData.category_id}
                                    onChange={(e) => setProductFormData({...productFormData, category_id: e.target.value})}
                                    className="w-full appearance-none pl-3.5 pr-9 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition cursor-pointer"
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map(c => (
                                        <optgroup key={c.id} label={c.name}>
                                            <option value={c.id}>{c.name}</option>
                                            {c.children && c.children.map(child => (
                                                <option key={child.id} value={child.id}>{child.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={15} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SKU</label>
                                <input
                                    type="text"
                                    value={productFormData.sku}
                                    onChange={(e) => setProductFormData({...productFormData, sku: e.target.value})}
                                    placeholder="PRD-001"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status penjualan</label>
                                <div className="relative">
                                    <select
                                        value={productFormData.status}
                                        onChange={(e) => setProductFormData({...productFormData, status: e.target.value})}
                                        className="w-full appearance-none pl-3 pr-8 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition cursor-pointer"
                                    >
                                        <option value="Active">Aktif dijual</option>
                                        <option value="Inactive">Nonaktif</option>
                                    </select>
                                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" size={15} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Merek (opsional)</label>
                                <input type="text" value={productFormData.brand} onChange={(e) => setProductFormData({...productFormData, brand: e.target.value})} placeholder="Contoh: IRC" className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lokasi Rak (opsional)</label>
                                <input type="text" value={productFormData.rack_location} onChange={(e) => setProductFormData({...productFormData, rack_location: e.target.value})} placeholder="Contoh: B2" className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Spesifikasi</label>
                            <input
                                type="text"
                                value={productFormData.subtitle}
                                onChange={(e) => setProductFormData({...productFormData, subtitle: e.target.value})}
                                placeholder="Contoh: Ban luar tubeless matic ring 14 berkualitas tinggi"
                                className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga modal (Rp)</label>
                                <MoneyInput
                                    value={productFormData.cost_price}
                                    onChange={(e) => setProductFormData({...productFormData, cost_price: e.target.value})}
                                    placeholder="Opsional"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga jual (Rp)</label>
                                <MoneyInput
                                    required
                                    value={productFormData.price}
                                    onChange={(e) => setProductFormData({...productFormData, price: e.target.value})}
                                    placeholder="20000"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                                />
                            </div>

                        </div>

                        {/* Stock & Minimum Stock Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    {editingItem ? 'Stok saat ini (pcs)' : 'Stok awal (pcs)'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={productFormData.stock}
                                    onChange={(e) => setProductFormData({...productFormData, stock: e.target.value})}
                                    disabled={!!editingItem}
                                    placeholder="0"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Min. stok (pcs)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={productFormData.minimum_stock}
                                    onChange={(e) => setProductFormData({...productFormData, minimum_stock: e.target.value})}
                                    placeholder="3"
                                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                                />
                            </div>
                        </div>
                        {editingItem && <p className="text-[10px] text-slate-500 dark:text-slate-400">Ubah stok lewat tombol Stok agar riwayat tercatat.</p>}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Gambar Produk</label>
                            <label className="flex items-center gap-3 p-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-slate-400 transition-colors bg-slate-50 dark:bg-slate-800">
                                <input
                                    type="file"
                                    accept={IMAGE_ACCEPT}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (validImage(file)) {
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
                                    <img src={productFormData.imagePreview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shadow-2xs" />
                                ) : productFormData.image ? (
                                    <img src={productFormData.image} alt="current" className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shadow-2xs" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-bold border border-slate-300 dark:border-slate-700">Foto</div>
                                )}
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    <span className="font-bold text-primary dark:text-blue-300">Upload foto</span>
                                    <br />{IMAGE_HELP}
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 sm:px-6">
                        <button
                            type="button"
                            onClick={() => setIsProductModalOpen(false)}
                            className="min-h-10 flex-1 px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="min-h-10 flex-1 px-3.5 py-2 bg-accentYellow hover:bg-yellow-300 text-primaryDark text-xs font-bold rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                            {isLoading ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Produk'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
