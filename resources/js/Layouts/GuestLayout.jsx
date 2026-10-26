import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FiArrowLeft, FiTool } from 'react-icons/fi';
import { getProductImage } from '@/Utils/productImage';
import '../../css/customer-storefront.css';
import { storefrontUrl } from '@/Utils/storefrontContext';

export default function Guest({ children, title = 'Selamat Datang Kembali', subtitle }) {
    const page = usePage();
    const platform = page.component === 'Auth/Register' || (page.component === 'Auth/Login' && !page.props.shop_slug);
    const homeUrl = storefrontUrl('/', page.props.shop_slug);
    const { app_settings } = page.props;
    const login_image_url = platform ? null : page.props.login_image_url;
    const logo_url = platform ? null : page.props.logo_url;
    const [logoFailed, setLogoFailed] = useState(false);
    const [photoFailed, setPhotoFailed] = useState(false);
    const storeName = platform ? 'TokoM' : app_settings?.store_name || 'TokoM';

    return (
        <div className="auth-workspace">
            <aside className="auth-brand-panel" aria-label={storeName}>
                <Link href={homeUrl} className="auth-wordmark"><FiTool aria-hidden="true" />{storeName}</Link>
                <div className="auth-brand-image">
                    {login_image_url && !photoFailed ? (
                        <img src={login_image_url} alt={storeName} onError={() => setPhotoFailed(true)} />
                    ) : <FiTool className="auth-brand-symbol" aria-hidden="true" />}
                </div>
                <span className="auth-brand-caption">Portal Manajemen Toko</span>
            </aside>
            <main className="auth-main">
                <Link href={homeUrl} className="auth-back"><FiArrowLeft aria-hidden="true" />Kembali ke toko</Link>
                <div className="auth-form-panel">
                    <Link href={homeUrl} className="auth-logo" aria-label={storeName + ' — beranda'}>
                        {logo_url && !logoFailed ? (
                            <img src={getProductImage(logo_url)} alt={storeName} onError={() => setLogoFailed(true)} />
                        ) : <FiTool aria-hidden="true" />}
                    </Link>
                    <p className="auth-eyebrow">Akun toko</p>
                    <h1>{title}</h1>
                    <p className="auth-subtitle">{subtitle || <>Masuk ke Portal Manajemen <strong>{storeName}</strong></>}</p>
                    <div className="auth-form-content">{children}</div>
                    <p className="auth-help">Butuh bantuan teknis? Hubungi tim support TokoM</p>
                </div>
            </main>
        </div>
    );
}
