const fs = require('fs');

function getApiKey() {
    return process.env.IMGBB_API_KEY?.trim() || '';
}

function isConfigured() {
    return getApiKey().length > 0;
}

function isHostedImageUrl(url) {
    if (!url) return false;
    return url.startsWith('https://i.ibb.co/') || url.includes('imgbb.com');
}

function isLocalUploadPath(url) {
    if (!url) return false;
    return url.startsWith('/uploads/');
}

async function uploadImage(buffer, name) {
    if (!isConfigured()) {
        throw new Error('IMGBB_API_KEY не налаштовано на сервері');
    }

    if (!buffer?.length) {
        throw new Error('Порожній файл зображення');
    }

    const body = new URLSearchParams();
    body.set('key', getApiKey());
    body.set('image', buffer.toString('base64'));
    if (name?.trim()) {
        body.set('name', name.trim().slice(0, 64));
    }

    const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    const payload = await response.json();

    if (!response.ok || !payload.success || !payload.data?.url) {
        const message = payload.error?.message || `ImgBB HTTP ${response.status}`;
        throw new Error(`Не вдалося завантажити зображення: ${message}`);
    }

    return {
        url: payload.data.display_url || payload.data.url,
        deleteUrl: payload.data.delete_url || null,
    };
}

async function uploadImageFile(file, name) {
    const buffer = fs.readFileSync(file.path);
    const result = await uploadImage(buffer, name);

    try {
        fs.unlinkSync(file.path);
    } catch {
        // temp file may already be removed
    }

    return result;
}

async function deleteByUrl(deleteUrl) {
    if (!deleteUrl?.trim()) return;

    try {
        await fetch(deleteUrl.trim(), { method: 'GET' });
    } catch (err) {
        console.warn('ImgBB delete failed:', err.message);
    }
}

module.exports = {
    isConfigured,
    isHostedImageUrl,
    isLocalUploadPath,
    uploadImage,
    uploadImageFile,
    deleteByUrl,
};
