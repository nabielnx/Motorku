export function catalogPageProducts(previous, incoming, append, bounded) {
    if (bounded || !append) return incoming;
    return [...new Map([...previous, ...incoming].map(product => [product.id, product])).values()];
}
