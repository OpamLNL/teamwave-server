const DEFAULT_PRODUCTION_API = 'https://teamwave-server.vercel.app';

/**
 * Базовий URL API без суфікса /api (для supertest: GET /api, /api/health, …).
 * Перевизначення: API_BASE_URL або PRODUCTION_API_URL (з або без /api на кінці).
 */
function getProductionBaseUrl() {
    const raw = (
        process.env.API_BASE_URL
        || process.env.PRODUCTION_API_URL
        || DEFAULT_PRODUCTION_API
    ).trim();

    return raw.replace(/\/$/, '').replace(/\/api$/i, '');
}

module.exports = { getProductionBaseUrl, DEFAULT_PRODUCTION_API };
