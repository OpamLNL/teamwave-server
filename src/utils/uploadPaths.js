const fs = require('fs');
const os = require('os');
const path = require('path');

function getUploadsRoot() {
    if (process.env.UPLOADS_DIR?.trim()) {
        return path.resolve(process.env.UPLOADS_DIR.trim());
    }

    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        return path.join(os.tmpdir(), 'teamwave-uploads');
    }

    return path.resolve(__dirname, '..', '..', 'uploads');
}

function ensureUploadDir(...segments) {
    const dir = path.join(getUploadsRoot(), ...segments.filter(Boolean));

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return dir;
}

function getTempUploadDir() {
    return ensureUploadDir('temp');
}

function isServerlessUploads() {
    return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

module.exports = {
    getUploadsRoot,
    ensureUploadDir,
    getTempUploadDir,
    isServerlessUploads,
};
