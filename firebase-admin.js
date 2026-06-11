const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const DEFAULT_WEB_KEY = './secrets/teamwave-web-service-account.json';

function normalizePrivateKey(value) {
    if (!value) return null;

    let key = String(value).trim();

    if (
        (key.startsWith('"') && key.endsWith('"'))
        || (key.startsWith("'") && key.endsWith("'"))
    ) {
        key = key.slice(1, -1);
    }

    key = key.replace(/\\n/g, '\n');

    if (key.includes('-----BEGIN PRIVATE KEY-----') && !key.includes('\n')) {
        key = key
            .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
            .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----\n');
    }

    return key;
}

function readPrivateKeyFromEnv() {
    if (process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim()) {
        return normalizePrivateKey(
            Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64.trim(), 'base64').toString('utf8')
        );
    }

    return normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
}

function getMissingFirebaseEnvVars() {
    const missing = [];

    if (!process.env.FIREBASE_PROJECT_ID?.trim()) {
        missing.push('FIREBASE_PROJECT_ID');
    }

    if (!process.env.FIREBASE_CLIENT_EMAIL?.trim()) {
        missing.push('FIREBASE_CLIENT_EMAIL');
    }

    const privateKey = readPrivateKeyFromEnv();
    if (!privateKey?.includes('BEGIN PRIVATE KEY')) {
        missing.push('FIREBASE_PRIVATE_KEY (або FIREBASE_PRIVATE_KEY_BASE64)');
    }

    return missing;
}

function getFirebaseConfigStatus() {
    const missing = getMissingFirebaseEnvVars();
    const hasFile = Boolean(credentialFromFile(false));
    const hasJson = Boolean(process.env.GOOGLE_CREDENTIALS?.trim());

    return {
        configured: missing.length === 0 || hasFile || hasJson,
        source: missing.length === 0
            ? 'env'
            : hasFile
                ? 'file'
                : hasJson
                    ? 'google_credentials'
                    : 'none',
        missing_env: missing,
        hint: missing.length > 0
            ? 'Vercel → Settings → Environment Variables → Production + Preview + Development'
            : null,
    };
}

function credentialFromSplitEnv() {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = readPrivateKeyFromEnv();

    if (!clientEmail || !privateKey) {
        return null;
    }

    const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID?.trim(),
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID?.trim() || undefined,
        private_key: privateKey,
        client_email: clientEmail,
        client_id: process.env.FIREBASE_CLIENT_ID?.trim() || undefined,
        auth_uri: process.env.FIREBASE_AUTH_URI?.trim() || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: process.env.FIREBASE_TOKEN_URI?.trim() || 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url:
            process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL?.trim()
            || 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL?.trim() || undefined,
    };

    Object.keys(serviceAccount).forEach((key) => {
        if (serviceAccount[key] === undefined) delete serviceAccount[key];
    });

    return {
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
    };
}

function credentialFromJsonEnv() {
    if (!process.env.GOOGLE_CREDENTIALS?.trim()) {
        return null;
    }

    const raw = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    raw.private_key = normalizePrivateKey(raw.private_key);

    return {
        credential: admin.credential.cert(raw),
        projectId: raw.project_id,
    };
}

function credentialFromFile(buildCredential = true) {
    let keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!keyPath) {
        keyPath = path.resolve(__dirname, DEFAULT_WEB_KEY);
    } else {
        keyPath = path.resolve(__dirname, keyPath);
    }

    if (!fs.existsSync(keyPath)) {
        return null;
    }

    if (!buildCredential) {
        return { projectId: process.env.FIREBASE_PROJECT_ID || 'teamwave-web' };
    }

    const serviceAccount = require(keyPath);
    return {
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
    };
}

function resolveFirebaseCredential() {
    const fromSplit = credentialFromSplitEnv();
    if (fromSplit) return fromSplit;

    const fromJson = credentialFromJsonEnv();
    if (fromJson) return fromJson;

    const fromFile = credentialFromFile(true);
    if (fromFile?.credential) return fromFile;

    const missing = getMissingFirebaseEnvVars();
    throw new Error(
        'Firebase Admin не налаштовано.\n'
        + `Відсутні змінні: ${missing.join(', ') || 'невідомо'}\n`
        + 'Vercel → Project → Settings → Environment Variables:\n'
        + '  FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY\n'
        + 'Або FIREBASE_PRIVATE_KEY_BASE64 (base64 від private_key — без проблем з \\n)\n'
        + 'Увімкни для Production, Preview і Development, потім Redeploy.'
    );
}

function ensureInitialized() {
    if (admin.apps.length) return admin;

    const { credential, projectId } = resolveFirebaseCredential();
    admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID || projectId || 'teamwave-web',
    });

    return admin;
}

function getAuth() {
    return ensureInitialized().auth();
}

const firebaseAdmin = new Proxy(admin, {
    get(target, prop) {
        if (prop === 'auth') {
            return () => getAuth();
        }

        if (prop === 'ensureInitialized') {
            return ensureInitialized;
        }

        if (prop === 'getAuth') {
            return getAuth;
        }

        if (prop === 'getFirebaseConfigStatus') {
            return getFirebaseConfigStatus;
        }

        const value = target[prop];
        return typeof value === 'function' ? value.bind(target) : value;
    },
});

module.exports = firebaseAdmin;
module.exports.ensureInitialized = ensureInitialized;
module.exports.getAuth = getAuth;
module.exports.getFirebaseConfigStatus = getFirebaseConfigStatus;
