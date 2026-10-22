import { FiHelpCircle, FiX } from 'react-icons/fi';

export default function ShortcutModal({
    setIsShortcutModalOpen
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <FiHelpCircle className="w-4 h-4 text-blue-600 dark:text-yellow-400" strokeWidth={2.5} />
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Petunjuk Keyboard Shortcut POS</h3>
                    </div>
                    <button onClick={() => setIsShortcutModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                        <FiX className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-4 space-y-2 text-xs">
                    {[
                        { key: 'F2 atau /', desc: 'Fokus langsung ke pencarian produk' },
                        { key: 'F8 / Ctrl+Enter', desc: 'Buka modal proses pembayaran' },
                        { key: '1', desc: 'Pilih pembayaran tunai' },
                        { key: 'Alt + U', desc: 'Otomatis isi nominal Uang Pas' },
                        { key: 'Enter', desc: 'Konfirmasi bayar / Transaksi baru' },
                        { key: 'P', desc: 'Cetak struk pembayaran' },
                        { key: 'Esc', desc: 'Tutup modal / hapus teks pencarian' },
                        { key: 'F1', desc: 'Buka / tutup panduan shortcut ini' },
                    ].map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{s.desc}</span>
                            <kbd className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded font-mono font-bold shadow-2xs">
                                {s.key}
                            </kbd>
                        </div>
                    ))}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 text-center">
                    <button
                        onClick={() => setIsShortcutModalOpen(false)}
                        className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                        Mengerti (Esc)
                    </button>
                </div>
            </div>
        </div>
    );
}
