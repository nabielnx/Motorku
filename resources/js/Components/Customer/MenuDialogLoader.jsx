import { Component, lazy, Suspense, useEffect } from 'react';

const importDialogs = () => import('./MenuDialogs');
const LazyMenuDialogs = lazy(importDialogs);

export function prepareMenuDialogs() {
    void importDialogs().catch(() => {});
}

function DialogLoadStatus({ failed = false, onClose }) {
    useEffect(() => {
        const escape = event => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', escape);
        return () => document.removeEventListener('keydown', escape);
    }, [onClose]);

    return <section role={failed ? 'alert' : 'status'} aria-live={failed ? 'assertive' : 'polite'} className="fixed inset-x-3 bottom-4 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-lg border border-[#dedfd7] bg-white p-4 text-sm text-[#19231f] shadow-lg">
        <p className="min-w-0 flex-1">{failed ? 'Tampilan belum dapat dimuat. Muat ulang halaman untuk mencoba lagi. Keranjang tetap tersimpan di perangkat ini.' : 'Menyiapkan tampilan…'}</p>
        {failed && <button type="button" onClick={() => window.location.reload()} className="shrink-0 rounded-lg bg-[#FFDD00] px-3 py-2 text-xs font-semibold">Muat ulang</button>}
        <button type="button" onClick={onClose} className="shrink-0 rounded-lg border border-[#dedfd7] px-3 py-2 text-xs font-semibold">Batal</button>
    </section>;
}

class DialogLoadBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        return this.state.failed ? <DialogLoadStatus failed onClose={this.props.onClose} /> : this.props.children;
    }
}

export default function MenuDialogLoader(props) {
    if (!props.showCart && !props.selectedDetailProduct) return null;
    const close = () => { props.setShowCart(false); props.setSelectedDetailProduct(null); };

    return <DialogLoadBoundary onClose={close}>
        <Suspense fallback={<DialogLoadStatus onClose={close} />}>
            <LazyMenuDialogs {...props} />
        </Suspense>
    </DialogLoadBoundary>;
}
