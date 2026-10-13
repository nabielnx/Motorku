import test from 'node:test';
import assert from 'node:assert/strict';
import { createCameraPhoto, normalizeCameraFile, prefersNativeCamera, cameraErrorMessage } from '../../resources/js/Utils/cameraPhoto.js';

test('phones and iPadOS use native capture; desktops use a webcam dialog', () => {
    for (const userAgent of ['Android', 'iPhone', 'iPad', 'iPod']) {
        assert.equal(prefersNativeCamera({ userAgent, maxTouchPoints: 1 }), true);
    }
    assert.equal(prefersNativeCamera({ userAgent: 'Macintosh', maxTouchPoints: 5 }), true);
    assert.equal(prefersNativeCamera({ userAgent: 'Macintosh', maxTouchPoints: 0 }), false);
    assert.equal(prefersNativeCamera({ userAgent: 'Windows', maxTouchPoints: 10 }), false);
});

test('a high resolution camera frame becomes an uploadable JPEG without cropping', async t => {
    const qualities = [];
    const draw = [];
    const canvas = {
        getContext: () => ({ fillRect() {}, drawImage: (...args) => draw.push(args) }),
        toBlob: (callback, type, quality) => {
            qualities.push(quality);
            callback(new Blob([new Uint8Array(quality === 0.9 ? 5 * 1024 * 1024 : 1024)], { type }));
        },
    };
    const original = globalThis.document;
    globalThis.document = { createElement: () => canvas };
    t.after(() => { globalThis.document = original; });
    const source = { videoWidth: 4000, videoHeight: 3000 };
    const file = await createCameraPhoto(source);
    assert.equal(canvas.width, 2400);
    assert.equal(canvas.height, 1800);
    assert.deepEqual(draw[0], [source, 0, 0, 2400, 1800]);
    assert.deepEqual(qualities, [0.9, 0.8]);
    assert.equal(file.type, 'image/jpeg');
    assert.ok(file.size > 0 && file.size <= 4 * 1024 * 1024);
    assert.match(file.name, /^foto-\d+\.jpg$/);
});

test('an unreadable native photo releases its temporary URL and reports an actionable error', async t => {
    const originalImage = globalThis.Image;
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const revoked = [];
    URL.createObjectURL = () => 'blob:camera-test';
    URL.revokeObjectURL = url => revoked.push(url);
    globalThis.Image = class {
        set src(value) { queueMicrotask(() => this.onerror()); }
    };
    t.after(() => {
        globalThis.Image = originalImage;
        URL.createObjectURL = originalCreate;
        URL.revokeObjectURL = originalRevoke;
    });
    await assert.rejects(normalizeCameraFile(new Blob()), /JPEG, PNG, atau WebP/);
    assert.deepEqual(revoked, ['blob:camera-test']);
});

test('not-ready frames and camera permission/device failures have useful feedback', async () => {
    await assert.rejects(createCameraPhoto({ videoWidth: 0, videoHeight: 0 }), /belum siap/);
    assert.match(cameraErrorMessage({ name: 'NotAllowedError' }), /tidak diizinkan/);
    assert.match(cameraErrorMessage({ name: 'NotFoundError' }), /tidak ditemukan/);
    assert.match(cameraErrorMessage({ name: 'NotReadableError' }), /aplikasi lain/);
});
