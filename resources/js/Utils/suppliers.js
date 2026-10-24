import { z } from 'zod';

export const supplierLinkSchema = z.object({
    label: z.string().trim().min(1, 'Nama platform wajib diisi.').max(60, 'Nama platform maksimal 60 karakter.'),
    url: z.string().trim().max(2048, 'Link maksimal 2048 karakter.').pipe(z.url({ protocol: /^https?$/, error: 'Masukkan link lengkap dengan https:// atau http://.' })),
});

export const supplierSchema = z.object({
    name: z.string().trim().min(1, 'Nama supplier wajib diisi.').max(150, 'Nama supplier maksimal 150 karakter.'),
    contact_person: z.string().trim().max(150, 'Nama kontak maksimal 150 karakter.'),
    phone: z.string().trim().max(30, 'Nomor telepon maksimal 30 karakter.').refine(value => !value || /^\+?[0-9][0-9 ()-]{2,29}$/.test(value), 'Masukkan nomor telepon yang valid, misalnya +62 812-3456-7890.'),
    email: z.string().trim().max(254, 'Email maksimal 254 karakter.').refine(value => !value || z.email().safeParse(value).success, 'Format email tidak valid.'),
    address: z.string().trim().max(1000, 'Alamat maksimal 1000 karakter.'),
    notes: z.string().trim().max(2000, 'Catatan maksimal 2000 karakter.'),
    links: z.array(supplierLinkSchema).max(10, 'Maksimal 10 link per supplier.').default([]),
});

export function safeSupplierLinks(links) {
    if (!Array.isArray(links)) return [];
    return links.flatMap(link => {
        const parsed = supplierLinkSchema.safeParse(link);
        return parsed.success ? [parsed.data] : [];
    });
}

export function supplierFormValues(supplier) {
    return {
        ...Object.fromEntries(['name', 'contact_person', 'phone', 'email', 'address', 'notes'].map(key => [key, supplier?.[key] ?? ''])),
        links: Array.isArray(supplier?.links) ? supplier.links.map(link => ({ label: link?.label ?? '', url: link?.url ?? '' })) : [],
    };
}
