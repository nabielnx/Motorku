import { getProductImage } from '@/Utils/productImage';
import { ProductPhoto } from '@/Components/Customer/Storefront';

export default function ProductThumbnail({ path, name = '', category = '', size = 'w-8 h-8' }) {
    return (
        <div className={`${size} rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center`}>
            <ProductPhoto
                src={getProductImage(path)}
                name={name}
                category={category}
                className="w-full h-full"
                compact
            />
        </div>
    );
}
