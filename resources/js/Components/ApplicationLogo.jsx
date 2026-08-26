import { usePage } from '@inertiajs/react';

export default function ApplicationLogo(props) {
    const pageProps = usePage().props;
    const logoUrl = pageProps?.logo_url || pageProps?.settings?.logo_url;

    return (
        <img 
            {...props}
            src={logoUrl ? '/storage/' + logoUrl : '/images/logo.png'} 
            alt="Logo Toko Sparepart" 
            className={`aspect-[3/4] rounded-xl object-contain ${props.className || ''}`}
            onError={(e) => {
                e.target.src = 'https://ui-avatars.com/api/?name=Toko+Sparepart&background=ea580c&color=fff&bold=true';
            }}
        />
    );
}