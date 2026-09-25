export function getVisibleCategoryIds(categories, parentId, childId) {
    if (!parentId) return null;
    if (childId) return new Set([childId]);

    return new Set([
        parentId,
        ...categories.filter(category => category.parent_id === parentId).map(category => category.id),
    ]);
}
