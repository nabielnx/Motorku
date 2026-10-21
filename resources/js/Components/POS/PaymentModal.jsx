import { FiCreditCard, FiX, FiDollarSign, FiSmartphone, FiCheck, FiPrinter, FiPlus } from 'react-icons/fi';
import MoneyInput from '@/Components/MoneyInput';

export default function PaymentModal({
    isSubmittingOrder,
    isOrderComplete,
    resetQrisFlow,
    setIsPaymentModalOpen,
    cart,
    customerName,
    formatRp,
    total,
    setPaymentMethod,
    paymentMethod,
    qrisImageLoading,
    qrisImageUrl,
    settings,
    cashShortfall,
    cashReceived,
    cashInputRef,
    setCashReceived,
    quickCashOptions,
    changeAmount,
    qrisReference,
    setQrisReference,
    qrisVerified,
    setQrisVerified,
    handleProcessOrder,
    lastCreatedOrder,
    paymentMethodLabel,
    handleNewOrder
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900 dark:bg-slate-950 p-0 sm:p-4 animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmittingOrder && !isOrderComplete) {
                    resetQrisFlow();
                    setIsPaymentModalOpen(false);
                }
            }}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[94dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto pb-[env(safe-area-inset-bottom)] sm:pb-0 animate-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                role="dialog"
                aria-modal="true"
            >
                {!isOrderComplete ? (
                    <>
                        {/* Header */}
                        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                                    <FiCreditCard className="w-4 h-4" strokeWidth={2.2} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Pembayaran Pesanan</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                        {cart.length} item · {customerName ? customerName : 'Pelanggan Langsung'}
                                    </p>
                                </div>
                            </div>
                            <button
                                disabled={isSubmittingOrder}
                                onClick={() => { resetQrisFlow(); setIsPaymentModalOpen(false); }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
                            >
                                <FiX className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Total Tagihan Hero */}
                        <div className="px-5 py-4 text-center border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Total Tagihan
                            </span>
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 font-mono">
                                {formatRp(total)}
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Payment Method Tabs */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Metode Pembayaran
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { resetQrisFlow(); setPaymentMethod('cash'); }}
                                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                            paymentMethod === 'cash'
                                                ? 'border-primary bg-primary text-white shadow-2xs'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <FiDollarSign className="w-4 h-4" />
                                        <span>Tunai (Cash)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { resetQrisFlow(); setPaymentMethod('qris_manual'); }}
                                        disabled={qrisImageLoading || !qrisImageUrl || settings['payment.qris_enabled'] === 'false'}
                                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                            paymentMethod === 'qris_manual'
                                                ? 'border-primary bg-primary text-white shadow-2xs'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        <FiSmartphone className="w-4 h-4" />
                                        <span>QRIS Manual</span>
                                    </button>
                                </div>
                                {!qrisImageLoading && (!qrisImageUrl || settings['payment.qris_enabled'] === 'false') && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">QRIS belum tersedia. Owner perlu mengunggah gambar QRIS di Pengaturan.</p>
                                )}
                            </div>

                            {/* Cash Section */}
                            {paymentMethod === 'cash' && (
                                <div className="space-y-3 pt-1">
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Uang Diterima
                                            </label>
                                            {cashShortfall > 0 && Number(cashReceived) > 0 && (
                                                <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400">
                                                    Kurang {formatRp(cashShortfall)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="relative flex items-center">
                                            <span className="absolute left-3.5 text-slate-400 dark:text-slate-500 font-bold text-base select-none pointer-events-none">
                                                Rp
                                            </span>
                                            <MoneyInput
                                                ref={cashInputRef}

                                                placeholder="0"
                                                value={cashReceived}
                                                onChange={(e) => setCashReceived(e.target.value)}
                                                className="w-full pl-11 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-lg font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-0 focus:border-primary outline-none font-mono transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            {cashReceived && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCashReceived('')}
                                                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition cursor-pointer"
                                                >
                                                    <FiX className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Cash Chips */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                                            <span>Pilihan Nominal Cepat</span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Alt+U = Uang Pas</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {quickCashOptions.map((amt, idx) => {
                                                const isExact = amt === total;
                                                const isSelected = Number(cashReceived) === amt;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setCashReceived(amt.toString())}
                                                        className={`py-2 px-1 rounded-lg text-xs font-bold border transition cursor-pointer text-center truncate ${
                                                            isSelected
                                                                ? 'bg-primary text-white border-primary shadow-2xs'
                                                                : isExact
                                                                    ? 'bg-accentYellow text-primaryDark border-accentYellow hover:bg-yellow-300'
                                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {isExact ? 'Uang Pas' : formatRp(amt).replace('Rp ', '')}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Live Change Amount Box */}
                                    {Number(cashReceived) > 0 && (
                                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-bold ${cashShortfall > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                                                    {cashShortfall > 0 ? 'Uang Masih Kurang' : 'Kembalian'}
                                                </span>
                                                <span className={`font-mono font-black text-lg ${cashShortfall > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {formatRp(cashShortfall > 0 ? cashShortfall : changeAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {paymentMethod === 'qris_manual' && (
                                <div className="space-y-3">
                                    <div className="flex justify-center rounded-xl bg-white p-3 border border-slate-200">
                                        <img src={qrisImageUrl} alt="QRIS toko untuk pembayaran" className="h-48 w-48 object-contain" />
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">Minta pelanggan scan QRIS dan isi nominal <strong>{formatRp(total)}</strong>.</p>
                                    <input
                                        type="text"
                                        maxLength={100}
                                        value={qrisReference}
                                        onChange={(event) => setQrisReference(event.target.value)}
                                        placeholder="No. referensi (opsional)"
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                    />
                                    <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                        <input type="checkbox" checked={qrisVerified} onChange={(event) => setQrisVerified(event.target.checked)} className="mt-0.5" />
                                        Saya sudah memastikan pembayaran masuk di aplikasi/rekening toko.
                                    </label>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                type="button"
                                onClick={handleProcessOrder}
                                disabled={
                                    isSubmittingOrder ||
                                    (paymentMethod === 'cash' && (!cashReceived || cashShortfall > 0)) ||
                                    (paymentMethod === 'qris_manual' && (!qrisImageUrl || !qrisVerified))
                                }
                                className="w-full py-3.5 px-4 bg-primary hover:bg-primaryDark disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
                            >
                                <FiCheck className="w-4 h-4" strokeWidth={2.5} />
                                <span>
                                    {paymentMethod === 'qris_manual'
                                        ? (isSubmittingOrder ? 'Memproses Transaksi...' : 'Konfirmasi Sudah Dibayar')
                                        : (isSubmittingOrder ? 'Memproses Transaksi...' : `Selesaikan Pembayaran (${formatRp(total)})`)}
                                </span>
                                <kbd className="ml-auto px-1.5 py-0.5 bg-primaryDark text-white rounded text-[10px] font-mono font-bold group-disabled:hidden">
                                    Enter
                                </kbd>
                            </button>
                        </div>
                    </>
                ) : (
                    /* ORDER COMPLETE SUCCESS SCREEN */
                    <div className="p-6 text-center space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto">
                            <FiCheck className="w-7 h-7" strokeWidth={2.5} />
                        </div>

                        <div>
                            <h3 className="font-black text-primaryDark dark:text-white text-lg tracking-tight">Transaksi Berhasil!</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                No. Invoice: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{lastCreatedOrder?.invoice_number}</span>
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Metode:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{paymentMethodLabel}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Total Tagihan:</span>
                                <span className="font-bold text-slate-900 dark:text-white font-mono">{formatRp(lastCreatedOrder?.total_amount || total)}</span>
                            </div>
                            {paymentMethod === 'cash' && lastCreatedOrder?.cash_received != null && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Uang Diterima:</span>
                                        <span className="font-bold text-slate-900 dark:text-white font-mono">{formatRp(lastCreatedOrder.cash_received)}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-sm">
                                        <span className="font-bold text-primaryDark dark:text-white">Kembalian:</span>
                                        <span className="font-black text-primaryDark dark:text-white font-mono">{formatRp(lastCreatedOrder.change_amount)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="flex-1 py-3 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <FiPrinter className="w-4 h-4" />
                                <span>Cetak Struk</span>
                                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded text-[9px] font-mono">P</kbd>
                            </button>
                            <button
                                type="button"
                                onClick={handleNewOrder}
                                className="flex-1 py-3 px-3 bg-primary hover:bg-primaryDark text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                                <FiPlus className="w-4 h-4" strokeWidth={2.5} />
                                <span>Transaksi Baru</span>
                                <kbd className="px-1.5 py-0.5 bg-blue-700 text-blue-100 rounded text-[9px] font-mono">Enter</kbd>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
