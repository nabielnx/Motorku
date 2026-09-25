import { usePage } from '@inertiajs/react';

export default function ApplicationLogo(props) {
    const pageProps = usePage().props;
    const logoUrl = pageProps?.logo_url || pageProps?.settings?.logo_url;

    return (
        <img 
            {...props}
            src={logoUrl ? (logoUrl.startsWith('/') || logoUrl.startsWith('http') ? logoUrl : '/storage/' + logoUrl) : '/storage/logo/KhjIclRcD4NNnH44nvMkhrGhEuhPyTpREqSfOTSQ.png'}
            alt="Logo Motorku"
            className={`aspect-[3/4] rounded-xl object-contain ${props.className || ''}`}
            onError={(e) => {
                e.target.src = 'https://ui-avatars.com/api/?name=Motorku&background=0284c7&color=fff&bold=true';
            }}
        />
    );
}