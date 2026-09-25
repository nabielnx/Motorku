import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        <div className="min-h-screen flex bg-white font-sans overflow-hidden">
            
            {/* KIRI: Area Gambar Sparepart Workshop */}
            <div className="hidden lg:block lg:w-1/2 relative bg-gray-900 overflow-hidden h-screen">
                <img 
                    src="https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=1200&auto=format&fit=crop" 
                    alt="Motorku"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 p-16 text-white w-full">
                    <span className="px-3 py-1 bg-blue-600/80 rounded-full text-xs font-black uppercase tracking-wider text-blue-100 mb-3 inline-block">
                        Motorku System
                    </span>
                    <h2 className="text-4xl font-black mb-4 tracking-tight">Motorku.</h2>
                    <p className="text-gray-300 text-base max-w-md leading-relaxed font-light">
                        Sistem Manajemen POS & Katalog produk modern. Kelola kasir, stok sparepart, dan transaksi dalam satu platform terintegrasi.
                    </p>
                </div>
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