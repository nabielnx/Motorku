import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

export default function Guest({ children }) {
    const { login_image_url } = usePage().props;

    return (
        <div className="min-h-screen flex bg-white font-sans overflow-hidden">
            
            {/* KIRI: Area Gambar Login */}
            <div className="hidden lg:block lg:w-1/2 relative bg-gray-900 overflow-hidden h-screen">
                <img 
                    src={login_image_url || "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=1200&auto=format&fit=crop"} 
                    alt="Motorku"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>

            {/* KANAN: Area Form Login */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative z-10 bg-white h-screen">
                <div className="w-full max-w-md flex flex-col justify-center">
                    
                    <div className="flex flex-col items-center mb-8">
                        <Link href="/">
                            <ApplicationLogo className="w-36 h-[192px] mb-6" />
                        </Link>
                        <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">Selamat Datang Kembali</h2>
                        <p className="text-gray-500 text-sm text-center">Masuk ke Portal Manajemen <span className="font-bold text-blue-600">Motorku</span></p>
                    </div>
                    
                    {/* Area Input */}
                    <div className="w-full">
                        {children}
                    </div>
                    
                    <div className="mt-12 text-center text-xs text-gray-400">
                        Butuh bantuan teknis? Hubungi tim support Motorku
                    </div>
                    
                </div>
            </div>

        </div>
    );
}