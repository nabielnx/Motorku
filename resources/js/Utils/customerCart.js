export function reconcileCustomerCart(cart, products) {
    const catalog = new Map(products.map(product => [product.id, product]));
    let changed = false;
    let needsReview = false;
    const updated = [];

    for (const item of cart) {
        const product = catalog.get(item.id);
        if (!product) {
            changed = true;
            needsReview = true;
            continue;
        }
        const current = {
            name: product.name,
            price: Number(product.price),
            stock: Number(product.stock),
            image: product.image,
        };
        const itemChanged = Object.entries(current).some(([key, value]) => item[key] !== value);
        changed ||= itemChanged;
        needsReview ||= Number(item.price) !== current.price;
        updated.push(itemChanged ? { ...item, ...current } : item);
    }

    return { cart: changed ? updated : cart, needsReview };
}

export function customerCartTotals(cart, settings) {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const taxRate = settings['tax.enabled'] !== 'false' ? Number(settings['tax.percentage'] || 0) / 100 : 0;
    const tax = Math.round(subtotal * taxRate);
    return { subtotal, tax, total: subtotal + tax };
}

// A failed or cancelled refresh must never authorize checkout with saved prices.
export function loadCustomerCatalog(router) {
    return new Promise(resolve => {
        router.reload({
            only: ['initialProducts', 'initialCategories', 'settings'],
            async: true,
            onSuccess: page => resolve(page.component === 'Order/Menu' && Array.isArray(page.props.initialProducts) ? page.props : null),
            onError: () => resolve(null),
            onCancel: () => resolve(null),
            onFinish: () => resolve(null),
        });
    });
}
