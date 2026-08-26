export function getProductImage(path, categoryName = '') {
    if (path) {
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return path.startsWith('/') ? path : '/storage/' + path;
    }
    
    const defaultImages = {
        'Ban & Velg': 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=400&auto=format&fit=crop&q=80',
        'Oli & Pelumas': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&auto=format&fit=crop&q=80',
        'Rem & Kaki-kaki': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&auto=format&fit=crop&q=80',
        'Aki & Kelistrikan': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400&auto=format&fit=crop&q=80',
        'Filter & Konsumsi': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop&q=80',
        'Aksesoris': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&auto=format&fit=crop&q=80',
    };

    return defaultImages[categoryName] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop&q=80';
}
