const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const RETRYABLE_DB_CODES = new Set([
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'PROTOCOL_CONNECTION_LOST',
    'ER_CON_COUNT_ERROR',
]);

function normalizePem(value) {
    return formatInlinePem(
        String(value)
            .replace(/^["']|["']$/g, '')
            .replace(/\\n/g, '\n')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim()
    );
}

/** Перетворює PEM з env (одним рядком або з \\n) у коректний багаторядковий формат. */
function formatInlinePem(value) {
    const pemRegex = /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/g;
    const blocks = [];
    let match;

    while ((match = pemRegex.exec(value)) !== null) {
        const label = match[1];
        const body = match[2].replace(/\s+/g, '');
        if (!body) continue;

        const lines = body.match(/.{1,64}/g) || [];
        blocks.push(`-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`);
    }

    if (blocks.length === 0) {
        return value;
    }

    return `${blocks.join('\n')}\n`;
}

function readSslCa() {
    if (process.env.DB_SSL_CA_BASE64?.trim()) {
        return normalizePem(
            Buffer.from(process.env.DB_SSL_CA_BASE64.trim(), 'base64').toString('utf8')
        );
    }

    const raw = process.env.DB_SSL_CA?.trim();
    if (!raw) return null;

    if (raw.includes('-----BEGIN')) {
        return normalizePem(raw);
    }

    const projectRoot = path.resolve(__dirname, '..', '..');
    const certPath = path.isAbsolute(raw) ? raw : path.resolve(projectRoot, raw);
    if (!fs.existsSync(certPath)) {
        if (process.env.VERCEL) {
            console.warn(`[DB] DB_SSL_CA файл недоступний на Vercel: ${certPath}`);
            return null;
        }
        throw new Error(`DB_SSL_CA файл не знайдено: ${certPath}`);
    }

    return normalizePem(fs.readFileSync(certPath, 'utf8'));
}

function buildSslConfig() {
    if (process.env.DB_SSL === 'false') {
        return undefined;
    }

    const ca = readSslCa();
    const onVercel = Boolean(process.env.VERCEL);

    const rejectUnauthorized = onVercel
        ? process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
        : ca
            ? process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
            : false;

    if (!ca && !onVercel && process.env.DB_SSL !== 'require') {
        return undefined;
    }

    return {
        ...(ca ? { ca } : {}),
        rejectUnauthorized,
    };
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function enrichDatabaseError(err) {
    if (!err || err.isDatabaseError) return err;

    const enriched = err;
    enriched.isDatabaseError = true;

    if (err.code === 'ETIMEDOUT') {
        enriched.message = 'База даних недоступна (таймаут підключення). Перевірте інтернет, VPN або DB_HOST у .env';
    } else if (err.code === 'ECONNREFUSED') {
        enriched.message = 'База даних відхилила підключення. Перевірте DB_HOST, DB_PORT і чи запущений MySQL';
    } else if (err.code === 'ENOTFOUND') {
        enriched.message = 'Хост бази даних не знайдено. Перевірте DB_HOST у .env';
    } else if (err.message === 'Pool is closed.') {
        enriched.message = 'Зʼєднання з базою закрито. Перезапустіть teamwave-server';
    }

    return enriched;
}

function isDatabaseConnectionError(err) {
    return Boolean(
        err?.isDatabaseError
        || RETRYABLE_DB_CODES.has(err?.code)
        || err?.message === 'Pool is closed.'
    );
}

const sslConfig = buildSslConfig();
const poolConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: process.env.VERCEL ? 5 : 10,
    queueLimit: 0,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 15000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    maxIdle: 5,
    idleTimeout: 60000,
};

if (sslConfig) {
    poolConfig.ssl = sslConfig;
}

let pool = null;
let poolClosed = false;

function createPoolInstance() {
    if (pool && !poolClosed) {
        pool.end().catch(() => {});
    }
    pool = mysql.createPool(poolConfig);
    poolClosed = false;
    return pool;
}

function getPool() {
    if (!pool || poolClosed) {
        createPoolInstance();
    }
    return pool;
}

async function query(sql, params, attempt = 0) {
    try {
        const [results] = await getPool().query(sql, params);
        return results;
    } catch (err) {
        const retryable = err?.message === 'Pool is closed.' || RETRYABLE_DB_CODES.has(err?.code);
        if (retryable && attempt < 2) {
            createPoolInstance();
            await sleep(300 * (attempt + 1));
            return query(sql, params, attempt + 1);
        }
        throw enrichDatabaseError(err);
    }
}

async function pingDatabase() {
    await query('SELECT 1 AS ok');
    return true;
}

async function closePool() {
    if (!pool || poolClosed) return;
    poolClosed = true;
    const activePool = pool;
    pool = null;

    await Promise.race([
        activePool.end(),
        sleep(3000).then(() => {
            throw new Error('Pool close timeout');
        }),
    ]).catch(() => {});
}

module.exports = {
    query,
    pingDatabase,
    closePool,
    isDatabaseConnectionError,
};
