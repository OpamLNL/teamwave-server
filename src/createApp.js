const path = require('path');
const fs = require('fs');
const express = require('express');

const handleRequest = require('./routes/endpointRouter');
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/healthRoutes');
const { setupSwagger } = require('./swagger');
const { checkAndInitDatabase } = require('./migrations/db-checker');
const { createCorsMiddleware, applyCorsHeaders } = require('./corsConfig');
const { createMediaUrlResponseMiddleware } = require('./utils/mediaUrl');

let dbInitPromise = null;

function ensureDatabaseReady() {
    if (!dbInitPromise) {
        dbInitPromise = checkAndInitDatabase().catch((err) => {
            dbInitPromise = null;
            throw err;
        });
    }
    return dbInitPromise;
}

function createApp() {
    const app = express();

    app.use(createCorsMiddleware());
    app.use(createMediaUrlResponseMiddleware());

    app.use(express.json());

    app.use(healthRoutes);
    setupSwagger(app);

    app.use(async (req, res, next) => {
        try {
            await ensureDatabaseReady();
            next();
        } catch (err) {
            next(err);
        }
    });

    const imagesPath = path.resolve(__dirname, '..', 'public', 'images');
    app.use('/images', express.static(imagesPath));

    const { getUploadsRoot, isServerlessUploads } = require('./utils/uploadPaths');
    const uploadsPath = getUploadsRoot();
    if (!isServerlessUploads() || fs.existsSync(uploadsPath)) {
        app.use('/uploads', express.static(uploadsPath));
    }

    app.use(handleRequest);
    app.use('/routes/auth', authRoutes);

    app.use((err, req, res, next) => {
        if (res.headersSent) return next(err);
        console.error(err);
        applyCorsHeaders(req, res);

        if (req.path.startsWith('/api/') || req.path.startsWith('/routes/')) {
            return res.status(err.status || 500).json({ error: err.message || 'Помилка сервера' });
        }

        if (err.status === 401) {
            return res.status(401).sendFile(path.join(__dirname, '..', 'public', '404.html'));
        }

        next(err);
    });

    app.use((req, res) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/routes/')) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
    });

    return app;
}

module.exports = { createApp, ensureDatabaseReady };
