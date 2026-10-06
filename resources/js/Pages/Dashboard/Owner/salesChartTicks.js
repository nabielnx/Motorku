export function salesChartTicks(length, maxTicks) {
    const count = Math.min(length, maxTicks);
    if (count < 2) return new Set(count === 1 ? [0] : []);

    return new Set(Array.from({ length: count }, (_, index) => (
        Math.round(index * (length - 1) / (count - 1))
    )));
}
