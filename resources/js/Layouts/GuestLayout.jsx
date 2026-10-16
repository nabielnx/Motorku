import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FiArrowLeft, FiTool } from 'react-icons/fi';
import { getProductImage } from '@/Utils/productImage';
import '../../css/customer-storefront.css';

export default function Guest({ children, title = 'Selamat Datang Kembali', subtitle }) {
    const { login_image_url, logo_url, app_settings } = usePage().props;
    const [logoFailed, setLogoFailed] = useState(false);
    const [photoFailed, setPhotoFailed] = useState(false);
    const storeName = app_settings?.store_name || 'Motorku';

    return (
        <div className="auth-workspace">
            <aside className="auth-brand-panel" aria-label={storeName}>
                <Link href="/" className="auth-wordmark"><FiTool aria-hidden="true" />{storeName}</Link>
                <div className="auth-brand-image">
                    {login_image_url && !photoFailed ? (
                        <img src={login_image_url} alt={storeName} onError={() => setPhotoFailed(true)} />
                    ) : <FiTool className="auth-brand-symbol" aria-hidden="true" />}
                </div>
                <span className="auth-brand-caption">Portal Manajemen Toko</span>
            </aside>
            <main className="auth-main">
                <Link href="/" className="auth-back"><FiArrowLeft aria-hidden="true" />Kembali ke toko</Link>
                <div className="auth-form-panel">
                    <Link href="/" className="auth-logo" aria-label={storeName + ' — beranda'}>
                        {logo_url && !logoFailed ? (
                            <img src={getProductImage(logo_url)} alt={storeName} onError={() => setLogoFailed(true)} />
                        ) : <FiTool aria-hidden="true" />}
                    </Link>
                    <p className="auth-eyebrow">Akun toko</p>
                    <h1>{title}</h1>
                    <p className="auth-subtitle">{subtitle || <>Masuk ke Portal Manajemen <strong>{storeName}</strong></>}</p>
                    <div className="auth-form-content">{children}</div>
                    <p className="auth-help">Butuh bantuan teknis? Hubungi tim support Motorku</p>
                </div>
            </main>
        </div>
    );
}
