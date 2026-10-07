export function mergeOrderUpdates(current, updates) {
    return current.map(order => {
        const update = updates.find(item => item?.order_id === order.order_id);
        if (!update) return order;
        if (['completed', 'cancelled'].includes(order.order_status) && update.order_status !== order.order_status) return order;
        return { ...order, ...update };
    });
}
