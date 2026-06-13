const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

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

    // На Vercel Aiven часто падає з "self-signed certificate" — за замовч. без перевірки CA
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

const sslConfig = buildSslConfig();
const poolConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: process.env.VERCEL ? 5 : 20,
    queueLimit: 0,
};

if (sslConfig) {
    poolConfig.ssl = sslConfig;
}

let pool = null;
let poolClosed = false;

function createPoolInstance() {
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

async function query(sql, params) {
    try {
        const [results] = await getPool().query(sql, params);
        return results;
    } catch (err) {
        if (err?.message === 'Pool is closed.') {
            createPoolInstance();
            const [results] = await getPool().query(sql, params);
            return results;
        }
        throw err;
    }
}

async function closePool() {
    if (!pool || poolClosed) return;
    poolClosed = true;
    const activePool = pool;
    pool = null;
    await activePool.end();
}

module.exports = {
    query,
    closePool,
};
