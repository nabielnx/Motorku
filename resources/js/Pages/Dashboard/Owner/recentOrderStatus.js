export const recentOrderStatus = (order) => {
    if (order.order_status === 'cancelled') return { label: 'Dibatalkan', color: 'text-rose-700 dark:text-rose-400' };
    if (order.payment_status === 'paid') return { label: 'Lunas', color: 'text-primaryDark dark:text-blue-300' };
    if (order.payment_status === 'refunded') return { label: 'Dikembalikan', color: 'text-slate-600 dark:text-slate-400' };
    return { label: 'Belum lunas', color: 'text-amber-700 dark:text-amber-400' };
};
