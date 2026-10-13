const normalizeApplication = value => value.toLowerCase().replace(/[\s()\-–—/]+/g, ' ').trim();

// Split only an application explicitly corroborated by the catalog description.
// Parentheses also contain essential sizes, volumes and variants.
export function getProductLabel(product) {
    const name = String(product.name ?? '').trim();
    const application = String(product.description ?? '').match(/(?:^|[.\n])\s*Peruntukan:\s*([^\n]+?)(?:\.\s*$|$)/i)?.[1]?.trim();
    const unchanged = { name, application: '' };
    if (!application || !name.endsWith(')')) return unchanged;

    let depth = 0;
    for (let index = name.length - 1; index >= 0; index--) {
        if (name[index] === ')') depth++;
        if (name[index] !== '(' || --depth !== 0) continue;
        const suffix = name.slice(index + 1, -1);
        const base = name.slice(0, index).trim();
        return base && normalizeApplication(suffix) === normalizeApplication(application)
            ? { name: base, application }
            : unchanged;
    }
    return unchanged;
}
