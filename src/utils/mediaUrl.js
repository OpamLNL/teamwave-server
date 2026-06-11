const LOCALHOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

function getPublicBaseUrl() {
    if (process.env.API_PUBLIC_URL?.trim()) {
        return process.env.API_PUBLIC_URL.trim().replace(/\/+$/, '');
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL.replace(/\/+$/, '')}`;
    }
    return 'http://localhost:3000';
}

function resolvePublicMediaUrl(url) {
    if (url == null || typeof url !== 'string') return url;

    const trimmed = url.trim();
    if (!trimmed) return url;

    const base = getPublicBaseUrl();

    if (LOCALHOST_PATTERN.test(trimmed)) {
        const pathname = trimmed.replace(LOCALHOST_PATTERN, '');
        return `${base}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    if (trimmed.startsWith('/')) {
        return `${base}${trimmed}`;
    }

    return trimmed;
}

const MEDIA_FIELD_KEYS = new Set([
    'avatar_url',
    'author_avatar',
    'actor_avatar',
    'reporter_avatar',
    'image_path',
    'cover_image',
    'image_url',
]);

function rewriteMediaFields(value, key = '') {
    if (value instanceof Date) {
        return value;
    }

    if (typeof value === 'string' && MEDIA_FIELD_KEYS.has(key)) {
        return resolvePublicMediaUrl(value);
    }

    if (Array.isArray(value)) {
        return value.map((item) => rewriteMediaFields(item, key));
    }

    if (value && typeof value === 'object') {
        const next = {};
        for (const [childKey, childValue] of Object.entries(value)) {
            next[childKey] = rewriteMediaFields(childValue, childKey);
        }
        return next;
    }

    return value;
}

function createMediaUrlResponseMiddleware() {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = (body) => originalJson(rewriteMediaFields(body));
        next();
    };
}

module.exports = {
    getPublicBaseUrl,
    resolvePublicMediaUrl,
    rewriteMediaFields,
    createMediaUrlResponseMiddleware,
};
