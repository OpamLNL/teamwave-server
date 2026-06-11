const fs = require('fs');
const path = require('path');
const imgbbService = require('./imgbbService');
const { ensureUploadDir, getUploadsRoot } = require('../utils/uploadPaths');

const getWorkImagesFolder = (workId) => ensureUploadDir('works', String(workId), 'images');

const getUserFolder = (userId) => ensureUploadDir('users', String(userId));

const getWorkChaptersFolder = (workId) => ensureUploadDir('works', String(workId), 'chapters');

const getFandomCoversFolder = () => ensureUploadDir('fandoms');

const getPublicPath = (absolutePath) => {
    const root = path.resolve(__dirname, '..', '..');
    const uploadsRoot = getUploadsRoot();

    if (absolutePath.startsWith(uploadsRoot)) {
        return absolutePath
            .replace(uploadsRoot, '/uploads')
            .replace(/\\/g, '/');
    }

    return absolutePath
        .replace(root, '')
        .replace(/\\/g, '/');
};

const saveWorkImage = async (workId, file) => {
    if (imgbbService.isConfigured()) {
        return await imgbbService.uploadImageFile(file, `work-${workId}`);
    }

    const imagesDir = getWorkImagesFolder(workId);
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(imagesDir, fileName);

    fs.renameSync(file.path, filePath);

    return {
        url: getPublicPath(filePath),
        deleteUrl: null,
    };
};

const saveUserAvatar = async (userId, file) => {
    if (imgbbService.isConfigured()) {
        return await imgbbService.uploadImageFile(file, `avatar-${userId}`);
    }

    const userDir = getUserFolder(userId);
    const ext = path.extname(file.originalname) || '.jpg';
    const fileName = `avatar-${Date.now()}${ext}`;
    const filePath = path.join(userDir, fileName);

    if (fs.existsSync(userDir)) {
        for (const entry of fs.readdirSync(userDir)) {
            if (entry.startsWith('avatar')) {
                fs.unlinkSync(path.join(userDir, entry));
            }
        }
    }

    fs.renameSync(file.path, filePath);

    return {
        url: getPublicPath(filePath),
        deleteUrl: null,
    };
};

const saveFandomCover = async (fandomId, file) => {
    if (imgbbService.isConfigured()) {
        return await imgbbService.uploadImageFile(file, `fandom-${fandomId}`);
    }

    const fandomDir = getFandomCoversFolder();
    const ext = path.extname(file.originalname) || '.jpg';
    const fileName = `${fandomId}${ext}`;
    const filePath = path.join(fandomDir, fileName);

    fs.renameSync(file.path, filePath);

    return {
        url: getPublicPath(filePath),
        deleteUrl: null,
    };
};

const saveWorkChapter = async (workId, title, content, orderIndex) => {
    const chaptersDir = getWorkChaptersFolder(workId);
    const fileName = `${orderIndex || Date.now()}.md`;
    const filePath = path.join(chaptersDir, fileName);

    fs.writeFileSync(filePath, content, 'utf8');

    return {
        title,
        content_path: getPublicPath(filePath),
        order_index: orderIndex || 0,
    };
};

module.exports = {
    saveWorkImage,
    saveUserAvatar,
    saveFandomCover,
    saveWorkChapter,
};
