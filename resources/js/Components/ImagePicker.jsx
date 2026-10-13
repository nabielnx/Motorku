import { useEffect, useRef, useState } from 'react';
import { FiCamera, FiUpload } from 'react-icons/fi';
import AdminButton from '@/Components/Admin/Button';
import CameraCaptureDialog from '@/Components/CameraCaptureDialog';
import { IMAGE_ACCEPT } from '@/Utils/imageUpload';
import { normalizeCameraFile, prefersNativeCamera } from '@/Utils/cameraPhoto';

export default function ImagePicker({ onSelect, label = 'gambar', facingMode = 'environment', disabled = false, className = '' }) {
    const gallery = useRef(null);
    const camera = useRef(null);
    const mounted = useRef(false);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const selectFile = event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) { setError(''); onSelect(file); }
    };
    const selectCameraFile = async event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setError('');
        setPreparing(true);
        try {
            const photo = await normalizeCameraFile(file);
            if (mounted.current) onSelect(photo);
        } catch (failure) {
            if (mounted.current) setError(failure.message);
        } finally {
            if (mounted.current) setPreparing(false);
        }
    };
    const openCamera = () => {
        setError('');
        if (prefersNativeCamera()) camera.current.click();
        else setCameraOpen(true);
    };

    return (
        <div className={`min-w-0 ${className}`}>
            <div className="flex flex-wrap items-center gap-2">
                <AdminButton variant="secondary" disabled={disabled || preparing} onClick={() => gallery.current.click()} aria-label={`Pilih galeri/file untuk ${label}`}>
                    <FiUpload size={14} /> Galeri/file
                </AdminButton>
                <AdminButton variant="secondary" disabled={disabled || preparing} onClick={openCamera} aria-label={`Ambil foto ${label}`}>
                    <FiCamera size={14} /> Ambil foto
                </AdminButton>
            </div>
            <input ref={gallery} type="file" accept={IMAGE_ACCEPT} onChange={selectFile} disabled={disabled || preparing} hidden aria-label={`File ${label}`} />
            <input ref={camera} type="file" accept="image/*" capture={facingMode} onChange={selectCameraFile} disabled={disabled || preparing} hidden aria-label={`Foto kamera ${label}`} />
            {preparing && <p role="status" className="admin-help mt-2">Memproses foto…</p>}
            {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
            {cameraOpen && <CameraCaptureDialog label={label} facingMode={facingMode} onSelect={onSelect} onClose={() => setCameraOpen(false)} />}
        </div>
    );
}
