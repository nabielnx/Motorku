import vocabulary from '../../data/catalog-search.json' with { type: 'json' };

const stopwords = new Set(vocabulary.stopwords);
const documents = new WeakMap();
const fold = value => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
export const normalizeText = value => fold(value).replace(/[^\p{L}\p{N}]/gu, '');
const unitRules = Object.values(vocabulary.units).map(([scale, base, ...names]) => ({
    scale, base, pattern: new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:${names.join('|')})(?![\\p{L}\\p{N}])`, 'gu'),
}));

function words(value) {
    let text = fold(value).replace(/(\d+)\s*w\s*-\s*(\d+)/g, '$1w$2');
    text = text.replace(/(\d+)\s+(\d+)\/(\d+)/g, (all, whole, numerator, denominator) =>
        +denominator <= 16 && +numerator < +denominator ? String(+whole + +numerator / +denominator) : all);
    for (const { scale, base, pattern } of unitRules) {
        text = text.replace(pattern, (_, number) => `${Number((Number(number.replace(',', '.')) * scale).toFixed(6))}${base}`);
    }
    text = text.replace(/(\d+)[.,](\d+)/g, '$1p$2').replace(/(\d+)\/(\d+)/g, '$1r$2');
    return text.match(/[\p{L}\p{N}]+/gu) || [];
}

function forms(word) {
    const result = [word];
    if (word.endsWith('nya') && word.length >= 6) result.push(word.slice(0, -3));
    if (word.endsWith('s') && word.length >= 4 && !/(ss|is|us)$/.test(word)) result.push(word.slice(0, -1));
    return result;
}

const rules = Object.entries(vocabulary.aliases).flatMap(([canonical, aliases]) =>
    aliases.map(alias => ({ alias: words(alias), canonical: words(canonical) })))
    .sort((a, b) => b.alias.length - a.alias.length);
// A known product type must not become a different product through prefix/typo matching.
const concepts = new Set(Object.entries(vocabulary.aliases).flatMap(([key, aliases]) => [key, ...aliases]).flatMap(words));

function canonicalize(tokens) {
    if (!tokens.length) return [];
    let result = [...tokens];
    let available = new Set(result.flatMap(forms));
    for (const rule of rules) {
        if (!available.has(rule.alias[0])) continue;
        const remaining = [...result];
        let matches = true;
        for (const token of rule.alias) {
            const index = remaining.findIndex(word => forms(word).includes(token));
            if (index < 0) { matches = false; break; }
            remaining.splice(index, 1);
        }
        if (matches) {
            result = [...remaining, ...rule.canonical];
            available = new Set(result.flatMap(forms));
        }
    }
    return [...new Set(result)];
}

export function levenshteinDistance(a, b) {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let diagonal = row[0]; row[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const previous = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
            diagonal = previous;
        }
    }
    return row[b.length];
}

function typoMatches(a, b) {
    if (!/^[a-z]+$/.test(a + b) || a.length < 4 || a.length > 48 || b.length > 48) return false;
    const limit = a.length >= 8 ? 2 : 1;
    if (Math.abs(a.length - b.length) > limit) return false;
    if (a.length === b.length) {
        const differences = [...a].map((char, i) => char === b[i] ? -1 : i).filter(i => i >= 0);
        if (differences.length === 2 && differences[1] === differences[0] + 1 && a[differences[0]] === b[differences[1]] && a[differences[1]] === b[differences[0]]) return true;
    }
    return levenshteinDistance(a, b) <= limit;
}

function prepareQuery(value) {
    const raw = String(value ?? '').trim();
    const codeWords = new Set([...fold(raw).matchAll(/\b([a-z]+)\s*[-/]\s*\d+\b/g)].map(match => match[1]));
    const tokens = words(raw).filter(token => !stopwords.has(token) || codeWords.has(token));
    return { raw, tokens: canonicalize(tokens), valid: [...raw].length <= 160 && tokens.length <= 24 };
}

function documentFor(item) {
    const category = typeof item.category === 'string' ? item.category : item.category?.name;
    const fields = [
        [item.name, 100], [item.sku, 110], [item.barcode, 110], [item.brand, 90],
        [category || item.category_name, 70], [item.category?.parent?.name || item.category_parent, 65],
        [item.description, 35], [item.notes, 35], [item.rack_location, 35],
        [item.model, 90], [item.unit, 40], [item.engine_type, 60],
        [item.engine_cc, 60], [item.year_start, 50], [item.year_end, 50],
        [item.motorcycles?.map(m => `${m.brand || ''} ${m.model || ''} ${m.engine_type || ''}`).join(' '), 60],
    ];
    const signature = fields.map(([text]) => String(text ?? '')).join('\u0000');
    const cached = documents.get(item);
    if (cached?.signature === signature) return cached;
    const tokens = new Map();
    const add = (token, score) => tokens.set(token, Math.max(tokens.get(token) || 0, score));
    const codes = new Map();
    for (const [text, weight] of fields) {
        if (!text) continue;
        const raw = words(text);
        for (const token of raw) {
            for (const form of forms(token)) add(form, form === token ? weight : weight * 0.9);
            const parts = token.match(/\d+(?:[pr]\d+)?|[^\d]+/gu) || [];
            for (const part of parts) add(part, weight * 0.9);
        }
        for (const token of canonicalize(raw)) add(token, weight * 0.8);
        // Join complete adjacent words, retaining boundaries around codes and quantities.
        // MPX 2 (0.8 L) can match MPX2; CR7HSAX must not match CR7HSA.
        for (let start = 0; start < raw.length; start++) {
            for (let length = 1; length <= 4 && start + length <= raw.length; length++) {
                const code = raw.slice(start, start + length).join('');
                if (/\d/.test(code)) codes.set(code, Math.max(codes.get(code) || 0, weight * 0.85));
            }
        }
    }
    if (item.motorcycles?.length || item.model) add('motor', 50);
    if (tokens.has('aki')) add('baterai', 55);
    const doc = { signature, tokens, codes, name: fold(item.name), sku: normalizeText(item.sku) };
    documents.set(item, doc);
    return doc;
}

function scoreItem(item, query) {
    if (!query.raw) return { match: true, score: 0 };
    if (!query.valid || !query.tokens.length) return { match: false, score: 0 };
    const doc = documentFor(item);
    if (doc.sku && doc.sku === normalizeText(query.raw)) return { match: true, score: 1060 };
    let sum = 0;
    for (const token of query.tokens) {
        let score = doc.tokens.get(token) || Math.max(0, ...forms(token).map(form => (doc.tokens.get(form) || 0) * 0.9));
        if (!score) for (const [word, weight] of doc.tokens) {
            if (concepts.has(token) && concepts.has(word)) continue;
            if (typoMatches(token, word)) score = Math.max(score, weight * 0.45);
            else if (!concepts.has(token) && !/\d/.test(token) && token.length >= 3 && word.startsWith(token)) score = Math.max(score, weight * 0.75);
        }
        if (!score && /\d/.test(token)) score = doc.codes.get(token) || 0;
        if (!score) return { match: false, score: 0 };
        sum += score;
    }
    let score = sum / query.tokens.length;
    const raw = fold(query.raw);
    if (doc.name === raw) score += 1000;
    else if (doc.sku && doc.sku === normalizeText(query.raw)) score += 950;
    else if (doc.name.includes(raw)) score += 300;
    return { match: true, score };
}

export function matchItem(item, rawQuery) {
    return scoreItem(item, prepareQuery(rawQuery));
}

export function fuzzyFilterProducts(items, rawQuery, options = {}) {
    if (!Array.isArray(items)) return [];
    const query = prepareQuery(rawQuery);
    const filtered = options.filterPredicate ? items.filter(options.filterPredicate) : items;
    if (!query.raw) return filtered;
    return filtered.map((item, index) => ({ item, index, ...scoreItem(item, query) }))
        .filter(result => result.match)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map(result => result.item);
}
