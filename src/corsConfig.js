const cors = require('cors');

function normalizeOrigin(value) {
    if (!value || typeof value !== 'string') return '';
    return value.trim().replace(/\/+$/, '');
}

function parseAllowedOrigins() {
    const defaults = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://teamwave.vercel.app',
    ];

    const fromEnv = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((item) => normalizeOrigin(item))
        .filter(Boolean);

    if (process.env.VERCEL_URL) {
        fromEnv.push(normalizeOrigin(`https://${process.env.VERCEL_URL}`));
    }

    if (process.env.FRONTEND_URL) {
        fromEnv.push(normalizeOrigin(process.env.FRONTEND_URL));
    }

    return [...new Set([...defaults, ...fromEnv].filter(Boolean))];
}

function isOriginAllowed(origin, allowedOrigins) {
    const normalized = normalizeOrigin(origin);
    if (!normalized) return false;
    if (allowedOrigins.includes(normalized)) return true;
    if (/^https:\/\/teamwave[-a-z0-9]*\.vercel\.app$/i.test(normalized)) {
        return true;
    }
    return false;
}

function createCorsMiddleware() {
    const allowedOrigins = parseAllowedOrigins();

    return cors({
        origin(origin, callback) {
            if (!origin || isOriginAllowed(origin, allowedOrigins)) {
                callback(null, origin || true);
                return;
            }
            callback(null, false);
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
}

function applyCorsHeaders(req, res) {
    const allowedOrigins = parseAllowedOrigins();
    const origin = req.headers.origin;
    if (origin && isOriginAllowed(origin, allowedOrigins)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = {
    createCorsMiddleware,
    applyCorsHeaders,
    parseAllowedOrigins,
};
