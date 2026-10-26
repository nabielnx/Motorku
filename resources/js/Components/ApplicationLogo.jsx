import { usePage } from '@inertiajs/react';

export default function ApplicationLogo(props) {
    const pageProps = usePage().props;
    const logoUrl = pageProps?.logo_url || pageProps?.settings?.logo_url;

    return (
        <img 
            {...props}
            src={logoUrl ? (logoUrl.startsWith('/') || logoUrl.startsWith('http') ? logoUrl : '/storage/' + logoUrl) : '/icons/tokom-v1-192.png'}
            alt="Logo TokoM"
            className={`aspect-[3/4] rounded-xl object-contain ${props.className || ''}`}
            onError={(e) => {
                if (e.currentTarget.getAttribute('src') !== '/icons/tokom-v1-192.png') {
                    e.currentTarget.src = '/icons/tokom-v1-192.png';
                }
            }}
        />
    );
}
