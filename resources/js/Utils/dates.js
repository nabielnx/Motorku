export function storeDate(date = new Date(), timeZone = 'Asia/Jakarta') {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
        .formatToParts(date).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}

export function reportPeriods(today) {
    // Date-only arithmetic in UTC prevents browser offsets from moving calendar boundaries.
    const date = new Date(`${today}T12:00:00Z`);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const fmt = value => value.toISOString().slice(0, 10);
    const week = new Date(date);
    week.setUTCDate(week.getUTCDate() - 6);
    return [
        { label: 'Hari Ini', start: today, end: today },
        { label: '7 Hari Terakhir', start: fmt(week), end: today },
        { label: 'Bulan Ini', start: `${today.slice(0, 7)}-01`, end: today },
        { label: 'Bulan Lalu', start: fmt(new Date(Date.UTC(year, month - 1, 1))), end: fmt(new Date(Date.UTC(year, month, 0))) },
    ];
}
