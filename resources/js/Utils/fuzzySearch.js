/**
 * Smart Fuzzy & Space-Tolerant Search Utility
 *
 * Provides:
 * 1. Alphanumeric normalization (e.g. "mpx2" matches "MPX 2", "vbelt" matches "V-Belt")
 * 2. Typo tolerance via Levenshtein distance (e.g. "castol" matches "Castrol")
 * 3. Multi-token search (tokens can appear in any order)
 * 4. Relevance scoring & ranking (exact matches appear at the top)
 */

export function normalizeText(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function levenshteinDistance(s1, s2) {
    if (s1 === s2) return 0;
    if (!s1.length) return s2.length;
    if (!s2.length) return s1.length;

    const row = [];
    for (let i = 0; i <= s2.length; i++) row[i] = i;

    for (let i = 1; i <= s1.length; i++) {
        let prev = i;
        for (let j = 1; j <= s2.length; j++) {
            let val;
            if (s1[i - 1] === s2[j - 1]) {
                val = row[j - 1];
            } else {
                val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
            }
            row[j - 1] = prev;
            prev = val;
        }
        row[s2.length] = prev;
    }
    return row[s2.length];
}

/**
 * Evaluates how well an item matches a search query.
 * Returns { match: boolean, score: number }
 */
export function matchItem(item, rawQuery, options = {}) {
    const query = (rawQuery || '').trim().toLowerCase();
    if (!query) return { match: true, score: 0 };

    const normQuery = normalizeText(query);
    const words = query.split(/\s+/).filter(Boolean);

    // Build target text fields
    const name = (item.name || '').toLowerCase();
    const cat = (item.category || item.category_name || (item.category?.name) || '').toLowerCase();
    const sku = (item.sku || '').toLowerCase();
    const brand = (item.brand || '').toLowerCase();
    const rack = (item.rack_location || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();

    // Fitment / motorcycles if available
    let fitment = '';
    if (Array.isArray(item.motorcycles) && item.motorcycles.length > 0) {
        fitment = item.motorcycles.map(m => `${m.brand || ''} ${m.model || ''}`).join(' ').toLowerCase();
    } else if (item.brand || item.model) {
        fitment = `${item.brand || ''} ${item.model || ''}`.toLowerCase();
    }

    const fullTarget = `${name} ${cat} ${sku} ${brand} ${desc} ${fitment} ${rack}`.trim();
    const normName = normalizeText(name);
    const normSku = normalizeText(sku);
    const normTarget = normalizeText(fullTarget);

    // 1. Direct contains (exact substring)
    if (fullTarget.includes(query)) {
        if (name === query) return { match: true, score: 100 };
        if (name.startsWith(query)) return { match: true, score: 90 };
        if (name.includes(query)) return { match: true, score: 85 };
        return { match: true, score: 75 };
    }

    // 2. Alphanumeric normalized match (handles "mpx2" in "MPX 2", "vbelt" in "V-Belt", "10w40" in "10W-40")
    if (normQuery.length >= 2) {
        if (normName === normQuery) return { match: true, score: 95 };
        if (normName.startsWith(normQuery)) return { match: true, score: 85 };
        if (normName.includes(normQuery)) return { match: true, score: 75 };
        if (normSku.includes(normQuery)) return { match: true, score: 75 };
        if (normTarget.includes(normQuery)) return { match: true, score: 65 };
    }

    // 3. Multi-token match (all words must match either exact, normalized, or typo-tolerant)
    const targetWords = fullTarget.split(/[^a-z0-9]+/).filter(Boolean);
    let allTokensMatch = true;
    let accumulatedScore = 0;

    for (const w of words) {
        const normW = normalizeText(w);

        // Exact substring token
        if (fullTarget.includes(w)) {
            accumulatedScore += 25;
            continue;
        }

        // Normalized token substring
        if (normW.length >= 2 && normTarget.includes(normW)) {
            accumulatedScore += 20;
            continue;
        }

        // Fuzzy typo tolerance against individual target words
        let wordMatched = false;
        if (normW.length >= 4) {
            for (const tw of targetWords) {
                // Reject if word length discrepancy is too large
                if (Math.abs(normW.length - tw.length) > 2) continue;

                const dist = levenshteinDistance(normW, tw);
                const maxLen = Math.max(normW.length, tw.length);
                const similarity = 1 - (dist / maxLen);

                // Threshold: >= 75% similarity (e.g. "castol" -> "castrol" = 86%, "fedral" -> "federal" = 86%)
                if (similarity >= 0.75) {
                    wordMatched = true;
                    accumulatedScore += Math.round(similarity * 18);
                    break;
                }
            }
        }

        if (!wordMatched) {
            allTokensMatch = false;
            break;
        }
    }

    if (allTokensMatch && words.length > 0) {
        return { match: true, score: Math.max(35, accumulatedScore) };
    }

    return { match: false, score: 0 };
}

/**
 * Filter and sort an array of products/items by relevance.
 *
 * @param {Array} items - Array of items to filter
 * @param {string} query - The search query
 * @param {Object} [options] - Additional options or additional filter predicate
 * @returns {Array} - Filtered and sorted items
 */
export function fuzzyFilterProducts(items, query, options = {}) {
    if (!Array.isArray(items)) return [];
    const trimmed = (query || '').trim();

    // If query is empty, allow custom filterPredicate if supplied
    if (!trimmed) {
        if (typeof options.filterPredicate === 'function') {
            return items.filter(options.filterPredicate);
        }
        return items;
    }

    const scored = [];
    const customPredicate = typeof options.filterPredicate === 'function' ? options.filterPredicate : null;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (customPredicate && !customPredicate(item)) {
            continue;
        }

        const res = matchItem(item, trimmed, options);
        if (res.match) {
            scored.push({ item, score: res.score, originalIndex: i });
        }
    }

    // Sort by score descending; if tied, keep original order
    scored.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.originalIndex - b.originalIndex;
    });

    return scored.map(entry => entry.item);
}
