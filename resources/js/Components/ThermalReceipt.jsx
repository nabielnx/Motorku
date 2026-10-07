export default function ThermalReceipt({ order, settings = {}, fallbackCashier = 'Kasir' }) {
    if (!order) return null;
    const payment = order.payments?.find(payment => payment.status === 'paid');
    return (
        <div id="thermal-printable-receipt" className="hidden" style={{ '--receipt-width': settings?.paper_size === '58' ? '58mm' : '80mm' }}>
            <div className="text-center pb-2 border-b border-dashed border-black mb-2">
                <h2 className="font-bold text-sm uppercase tracking-wider">{settings?.store_name || 'MOTORKU'}</h2>
                <p className="text-[10px]">{settings?.store_name || 'Motorku'}</p>
                {settings?.store_address && <p className="text-[9px]">{settings.store_address}</p>}
                {settings?.store_phone && <p className="text-[9px]">Telp: {settings.store_phone}</p>}
            </div>

            <div className="py-1 border-b border-dashed border-black text-[10px] space-y-0.5 mb-2">
                <div className="flex justify-between">
                    <span>No. Struk:</span>
                    <span className="font-bold">{payment?.invoice_number || order.order_number}</span>
                </div>
                <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span>{order.created_at ? new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short', timeZone: settings?.timezone || 'Asia/Jakarta' }) : '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span className="font-bold">{order.customer_name || 'Walk-in Guest'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tipe Order:</span>
                    <span>Ambil di Toko</span>
                </div>
                <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{order.cashier?.name || fallbackCashier}</span>
                </div>
            </div>

            {/* ITEMS LIST */}
            <div className="py-1 border-b border-dashed border-black text-[10px] mb-2">
                <div className="flex justify-between font-bold border-b border-black pb-0.5 mb-1">
                    <span>Item</span>
                    <span>Total</span>
                </div>
                {order.items?.map((item, idx) => (
                    <div key={idx} className="mb-1">
                        <div className="flex justify-between font-bold">
                            <span>{item.product_name || item.name} x{item.quantity}</span>
                            <span>Rp {(Number(item.subtotal) || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="text-[9px] text-gray-600 pl-1">
                            @ Rp {(Number(item.unit_price) || 0).toLocaleString('id-ID')} {item.notes ? `(${item.notes})` : ''}
                        </div>
                    </div>
                ))}
            </div>

            {/* FINANCIAL TOTALS */}
            <div className="py-1 border-b border-dashed border-black text-[10px] space-y-0.5 mb-2">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {(Number(order.subtotal) || 0).toLocaleString('id-ID')}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                    <div className="flex justify-between">
                        <span>Diskon</span>
                        <span>- Rp {Number(order.discount_amount).toLocaleString('id-ID')}</span>
                    </div>
                )}
                {Number(order.tax_amount) > 0 && (
                    <div className="flex justify-between">
                        <span>Pajak</span>
                        <span>Rp {(Number(order.tax_amount) || 0).toLocaleString('id-ID')}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-[12px] pt-1 border-t border-black">
                    <span>TOTAL TAGIHAN</span>
                    <span>Rp {(Number(order.total) || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between pt-1">
                    <span>Status Bayar:</span>
                    <span className="font-bold uppercase">{order.order_status === 'cancelled' ? 'DIBATALKAN' : order.payment_status === 'refunded' ? 'DIRETUR' : order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}</span>
                </div>
                {payment && (
                    <>
                        <div className="flex justify-between">
                            <span>Metode Bayar:</span>
                            <span className="font-bold uppercase">{payment.payment_method}</span>
                        </div>
                        {payment.payment_method === 'cash' && payment.amount_received != null && (
                            <>
                                <div className="flex justify-between">
                                    <span>Uang Diterima:</span>
                                    <span>Rp {(Number(payment.amount_received) || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>Kembalian:</span>
                                    <span>Rp {(Number(payment.change_amount) || 0).toLocaleString('id-ID')}</span>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* FOOTER */}
            <div className="pt-2 text-center text-[9px] space-y-0.5">
                <p className="font-bold">*** TERIMA KASIH ***</p>
                <p>Terima kasih sudah berbelanja di Motorku</p>
                <p>Simpan Struk Ini Sebagai Bukti Pembayaran</p>
            </div>
        </div>
    );
}
