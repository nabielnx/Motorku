import React from 'react';

export default function CatalogFeedControl({ feed }) {
    return (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 px-3 py-2 text-xs">
            {feed.error ? <><span role="alert" className="text-red-600">{feed.error}</span><button type="button" onClick={feed.retry} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800">Coba lagi</button></> : null}
            {feed.loading ? <span role="status" className="text-slate-600">Memuat produk...</span> : feed.hasMore ? <button type="button" onClick={feed.loadMore} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-100">Muat produk berikutnya</button> : null}
        </div>
    );
}
