import { useEffect, useState } from 'react';
import { FiCopy, FiDownload, FiExternalLink } from 'react-icons/fi';
import { toast } from 'sonner';
import AdminButton from './Button';
import { renderStoreQr } from '@/Utils/storeLink';

export default function StoreLink({ business }) {
    const [qr, setQr] = useState(null);
    const [failed, setFailed] = useState(false);
    const url = business?.public_url;

    useEffect(() => {
        let active = true;
        setQr(null);
        setFailed(false);
        if (url) renderStoreQr(url).then(image => { if (active) setQr(image); }).catch(() => { if (active) setFailed(true); });
        return () => { active = false; };
    }, [url]);

    if (!url) return null;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link toko disalin.');
        } catch {
            toast.error('Link belum tersalin. Pilih dan salin alamat toko di bawah.');
        }
    };

    return <section className="admin-surface rounded-lg border border-[#dedfd7] bg-white p-4">
        <h3 className="text-sm font-semibold text-[#19231f] dark:text-slate-100">Link &amp; QR toko</h3>
        <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">Bagikan link atau QR ini agar pelanggan langsung masuk ke katalog toko Anda.</p>
        <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
            <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-lg border border-[#dedfd7] bg-white p-1">
                {qr ? <img src={qr} alt={`QR katalog ${business.name}`} width="152" height="152" /> : <p role="status" className="px-3 text-center text-xs text-slate-600">{failed ? 'QR belum dapat dibuat. Link toko tetap dapat digunakan.' : 'Menyiapkan QR…'}</p>}
            </div>
            <div className="min-w-0 flex-1">
                <a href={url} target="_blank" rel="noopener noreferrer" className="block break-all text-xs font-semibold text-[#19231f] underline dark:text-[#FFDD00]">{url}</a>
                <div className="mt-4 flex flex-wrap gap-2">
                    <AdminButton type="button" onClick={copy}><FiCopy aria-hidden="true" />Salin link</AdminButton>
                    <a className="admin-button admin-button-secondary" href={url} target="_blank" rel="noopener noreferrer"><FiExternalLink aria-hidden="true" />Buka toko</a>
                    {qr && <a className="admin-button admin-button-secondary" href={qr} download={`qr-toko-${business.slug}.png`}><FiDownload aria-hidden="true" />Unduh QR</a>}
                </div>
            </div>
        </div>
    </section>;
}
