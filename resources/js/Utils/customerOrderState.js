export const rupiah = value => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
export function orderDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? (value || '—') : date.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export const isActiveOrder = order => !['cancelled', 'completed'].includes(order.order_status);
export function customerOrderState(order, now = Date.now()) {
    const cancelled = order.order_status === 'cancelled';
    const refunded = order.payment_status === 'refunded';
    const partialRefund = Number(order.refunded_amount || 0) > 0 && !refunded;
    const paid = order.payment_status === 'paid' || refunded || partialRefund;
    const review = Boolean(order.payment_review_requested_at) && !paid && !cancelled;
    const deadlinePassed = !review && !paid && order.expires_at && new Date(order.expires_at).getTime() <= now;
    const expired = !paid && ((cancelled && order.cancel_reason === 'expired') || (!cancelled && deadlinePassed));
    const payment = refunded ? 'Dana dikembalikan' : partialRefund ? 'Refund sebagian' : paid ? 'Lunas' : review ? 'Menunggu verifikasi' : cancelled ? 'Tidak dibayar' : 'Belum dibayar';
    let title, description;
    if (cancelled || expired) {
        title = expired ? 'Pesanan kedaluwarsa' : 'Pesanan dibatalkan';
        description = expired ? 'Batas pembayaran berakhir. Buat pesanan baru untuk melanjutkan.' : 'Pesanan ini tidak diproses. Anda dapat kembali berbelanja.';
    } else if (review) {
        title = 'Pembayaran sedang diperiksa';
        description = 'Laporan diterima. Kasir akan memeriksa dana yang masuk. Tidak perlu membayar ulang.';
    } else if (!paid) {
        title = 'Selesaikan pembayaran';
        description = order.payment_preference === 'qris' ? 'Bayar melalui QRIS, lalu kirim konfirmasi pembayaran.' : 'Tunjukkan nomor pesanan dan bayar saat datang ke toko.';
    } else {
        [title, description] = ({
            pending: ['Pembayaran diterima', 'Pembayaran sudah lunas. Toko akan menyiapkan pesanan Anda.'],
            preparing: ['Pesanan sedang disiapkan', 'Pembayaran sudah diterima. Tunggu hingga pesanan siap diambil.'],
            ready: ['Pesanan siap diambil', 'Datang ke toko dan tunjukkan nomor pesanan kepada kasir.'],
            completed: ['Pesanan selesai', 'Terima kasih sudah berbelanja. Rincian transaksi tersimpan di bawah.'],
        })[order.order_status] || ['Status pesanan', 'Perbarui status untuk melihat informasi terbaru.'];
    }
    if (order.payment_review_note && !paid && !cancelled && !expired && !review) {
        title = 'Pembayaran perlu diperiksa';
        description = order.payment_review_note;
    }
    if (refunded) {
        title = 'Dana dikembalikan';
        description = 'Pengembalian dana sudah dicatat oleh toko. Rinciannya tersedia di bawah.';
    }
    const fresh = order.connection === 'fresh';
    return {
        title, description, payment, paid, review, expired, cancelled, refunded, partialRefund,
        tone: cancelled || expired ? 'muted' : review ? 'attention' : paid ? 'ink' : 'attention',
        fulfillment: ({ pending: 'Diterima', preparing: 'Disiapkan', ready: 'Siap diambil', completed: 'Selesai', cancelled: expired ? 'Kedaluwarsa' : 'Dibatalkan' })[order.order_status] || 'Belum diketahui',
        canCancel: fresh && !paid && !review && !expired && order.order_status === 'pending',
        canPay: fresh && !paid && !review && !expired && order.order_status === 'pending',
    };
}
