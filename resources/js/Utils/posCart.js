import { getProductImage } from './productImage.js';

export const POS_CART_KEY = 'pos_cart';
export const MAX_POS_QTY = 200;
export const MAX_POS_ITEMS = 20;

export function formatPosProduct(product) {
    const category = product.category?.name || 'Sparepart';
    return {
        id: product.id,
        sku: product.sku || '',
        brand: product.brand || '',
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
