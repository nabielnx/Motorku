export function getProductImage(path, categoryName = '') {
    if (path) {
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return path.startsWith('/') ? path : '/storage/' + path;
    }
    
    return null;
}
