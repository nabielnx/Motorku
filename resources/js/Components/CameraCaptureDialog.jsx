import { useEffect, useRef, useState } from 'react';
import { FiCamera, FiX } from 'react-icons/fi';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import AdminButton from '@/Components/Admin/Button';
import { cameraErrorMessage, createCameraPhoto } from '@/Utils/cameraPhoto';

export default function CameraCaptureDialog({ onSelect, onClose, label, facingMode }) {
    const video = useRef(null);
    const mounted = useRef(false);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [capturing, setCapturing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let stream;
        mounted.current = true;
        async function start() {
            if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
                setError('Kamera memerlukan HTTPS dan browser yang mendukungnya. Kamu tetap bisa memilih gambar dari galeri/file.');
                return;
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
                });
                if (cancelled) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                video.current.srcObject = stream;
                await video.current.play();
            } catch (failure) {
                stream?.getTracks().forEach(track => track.stop());
                if (!cancelled) setError(cameraErrorMessage(failure));
            }
        }
        start();
        return () => {
            cancelled = true;
            mounted.current = false;
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [facingMode]);

    const capture = async () => {
        setCapturing(true);
        try {
            const file = await createCameraPhoto(video.current);
            if (mounted.current) {
                onSelect(file);
                onClose();
            }
        } catch (failure) {
            if (mounted.current) setError(failure.message);
        } finally {
            if (mounted.current) setCapturing(false);
        }
    };

    return (
        <AdminDialog onClose={onClose} className="max-w-lg p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <DialogTitle className="admin-dialog-title">Ambil foto {label}</DialogTitle>
                <button type="button" onClick={onClose} className="admin-icon-button shrink-0" aria-label="Tutup kamera">
                    <FiX size={20} />
                </button>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-slate-950">
                <video ref={video} autoPlay muted playsInline onLoadedData={() => setReady(true)}
                    className="block w-full max-h-[55svh] object-contain" aria-label={`Pratinjau kamera untuk ${label}`} />
                {!ready && !error && <p role="status" className="p-6 text-center text-sm text-white">Menyiapkan kamera… Izinkan akses kamera saat diminta.</p>}
            </div>
            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <p className="admin-help">Foto akan tampil di pratinjau. Tekan Simpan pada formulir untuk mengunggahnya.</p>
            <div className="flex flex-wrap justify-end gap-2">
                <AdminButton variant="secondary" onClick={onClose}>Batal</AdminButton>
                <AdminButton variant="primary" onClick={capture} disabled={!ready || capturing || Boolean(error)}>
                    <FiCamera size={16} /> {capturing ? 'Memproses…' : 'Jepret foto'}
                </AdminButton>
            </div>
        </AdminDialog>
    );
}
