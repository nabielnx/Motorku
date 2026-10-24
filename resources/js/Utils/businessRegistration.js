import { z } from 'zod';

export const businessRegistrationSchema = z.object({
    name: z.string().trim().min(1, 'Nama owner wajib diisi.').max(120),
    email: z.email('Alamat email tidak valid.').max(254),
    business_name: z.string().trim().min(1, 'Nama usaha wajib diisi.').max(100),
    business_slug: z.string().trim().min(3, 'Alamat toko minimal 3 karakter.').max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Gunakan huruf kecil, angka, dan tanda hubung.'),
    password: z.string().min(8, 'Password minimal 8 karakter.').max(128).regex(/[a-z]/, 'Tambahkan huruf kecil.').regex(/[A-Z]/, 'Tambahkan huruf besar.').regex(/[0-9]/, 'Tambahkan angka.').regex(/[^a-zA-Z0-9]/, 'Tambahkan simbol.'),
    password_confirmation: z.string(),
}).refine(data => data.password === data.password_confirmation, { path: ['password_confirmation'], message: 'Konfirmasi password tidak sama.' });

export function businessSlug(name) {
    return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/, '');
}
