const express = require('express');
const packageJson = require('../../package.json');

const router = express.Router();

const APP_NAME = 'TeamWave API';
const APP_VERSION = packageJson.version || '1.0.0';

function buildWelcomePayload(req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost';
    const baseUrl = `${protocol}://${host}`;

    return {
        name: APP_NAME,
        message: 'Вітаємо! Сервер Фандомії працює.',
        version: APP_VERSION,
        status: 'ok',
        timestamp: new Date().toISOString(),
        docs: `${baseUrl}/api/docs`,
        health: `${baseUrl}/api/health`,
        api: `${baseUrl}/api`,
    };
}

router.get('/', (req, res) => {
    res.json(buildWelcomePayload(req));
});

router.get('/api', (req, res) => {
    res.json(buildWelcomePayload(req));
});

router.get('/api/health', async (req, res) => {
    const payload = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
        uptime_seconds: Math.floor(process.uptime()),
        environment: process.env.VERCEL ? 'vercel' : process.env.NODE_ENV || 'development',
    };

    try {
        const { query } = require('../config/database');
        await query('SELECT 1 AS ok');
        payload.database = 'connected';
    } catch (err) {
        payload.status = 'degraded';
        payload.database = 'disconnected';
        payload.database_error = err.message;
    }

    try {
        const { getFirebaseConfigStatus } = require('../../firebase-admin');
        payload.firebase = getFirebaseConfigStatus();
        if (!payload.firebase.configured && payload.status === 'ok') {
            payload.status = 'degraded';
        }
    } catch (err) {
        payload.firebase = { configured: false, error: err.message };
    }

    try {
        const imgbbService = require('../services/imgbbService');
        payload.imgbb = {
            configured: imgbbService.isConfigured(),
            hint: imgbbService.isConfigured()
                ? null
                : 'Додай IMGBB_API_KEY для збереження зображень на Vercel',
        };
    } catch (err) {
        payload.imgbb = { configured: false, error: err.message };
    }

    res.status(payload.status === 'ok' ? 200 : 503).json(payload);
});

module.exports = router;
