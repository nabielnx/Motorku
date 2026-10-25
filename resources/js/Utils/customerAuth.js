import { z } from 'zod';

const password = z.string().min(8, 'Password minimal 8 karakter.').max(128)
    .regex(/[a-z]/, 'Tambahkan huruf kecil.').regex(/[A-Z]/, 'Tambahkan huruf besar.')
    .regex(/[0-9]/, 'Tambahkan angka.').regex(/[^a-zA-Z0-9]/, 'Tambahkan simbol.');
const email = z.string().trim().email('Isi email yang valid.');
const confirm = data => data.password === data.password_confirmation;
const confirmationError = { path: ['password_confirmation'], message: 'Konfirmasi password belum sama.' };

export const customerAuthSchemas = {
    login: z.object({ email, password: z.string().min(1, 'Isi password Anda.') }),
    register: z.object({ name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(120), email, password, password_confirmation: z.string() }).refine(confirm, confirmationError),
    forgot: z.object({ email }),
    reset: z.object({ email, password, password_confirmation: z.string() }).refine(confirm, confirmationError),
};
