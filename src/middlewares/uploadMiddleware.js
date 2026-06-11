const multer = require('multer');
const path = require('path');
const { getTempUploadDir } = require('../utils/uploadPaths');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            cb(null, getTempUploadDir());
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Дозволено завантажувати тільки зображення'), false);
    }
};

const uploadImages = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

module.exports = {
    uploadImages,
};
