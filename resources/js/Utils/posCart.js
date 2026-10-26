import { getProductImage } from './productImage.js';

export const POS_CART_KEY = 'pos_cart';
export const MAX_POS_QTY = 200;
export const MAX_POS_ITEMS = 20;

export function formatPosProduct(product) {
    const category = product.category?.name || 'Produk';
    return {
        id: product.id,
        sku: product.sku || '',
        brand: product.brand || '',
        barcode: product.barcode || '',
        unit: product.unit || '',
        category_parent: product.category?.parent?.name || product.category_parent || '',
        rack_location: product.rack_location || '',
        name: product.name,
        description: product.description || '',
        price: Number(product.price),
        category,
        categoryId: product.category_id,
        stock: Number(product.stock ?? 0),
        is_available: product.is_available,
        image: getProductImage(product.image_path, category),
        motorcycles: product.motorcycles || [],
    };
}

export function readPosCart(storage) {
    try {
        const cart = JSON.parse(storage.getItem(POS_CART_KEY) || '[]');
        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

export function reconcilePosCart(cart, products, checkedIds = null) {
    const catalog = new Map(products.map(formatPosProduct).map(product => [product.id, product]));
    const requested = checkedIds ? new Set(checkedIds) : null;
    let changed = false;
    let needsReview = false;
    const updated = cart.flatMap(item => {
        const product = catalog.get(item.id);
        if (!product && requested && !requested.has(item.id)) return [item];
        if (!product || product.is_available === false) {
            changed = true;
            needsReview = true;
            return [];
        }
        const differs = ['price', 'stock', 'name', 'image'].some(key => item[key] !== product[key]);
        changed ||= differs;
        needsReview ||= Number(item.price) !== product.price || item.qty > product.stock;
        return [differs ? { ...item, ...product } : item];
    });
    return { cart: changed ? updated : cart, needsReview };
}

export function addToPosCart(cart, item) {
    if (!item?.id || item.is_available === false) throw new Error('Produk tidak aktif di POS.');
    if (!Number.isFinite(item.price) || item.price < 0) throw new Error('Harga produk tidak valid.');
    if (!Number.isFinite(item.stock) || item.stock <= 0) throw new Error(`${item.name} sudah habis (Stok: 0).`);

    const current = cart.find(product => product.id === item.id);
    const quantity = Number(current?.qty || 0);
    if (quantity + 1 > item.stock) throw new Error(`Stok ${item.name} tidak mencukupi (Tersedia: ${item.stock} unit, di keranjang: ${quantity}).`);
    if (quantity >= MAX_POS_QTY) throw new Error(`Maksimal ${MAX_POS_QTY} unit per item.`);
    if (!current && cart.length >= MAX_POS_ITEMS) throw new Error(`Maksimal ${MAX_POS_ITEMS} jenis item per pesanan.`);

    return current
        ? cart.map(product => product.id === item.id ? { ...product, ...item, qty: quantity + 1 } : product)
        : [...cart, { ...item, qty: 1, notes: '' }];
}
