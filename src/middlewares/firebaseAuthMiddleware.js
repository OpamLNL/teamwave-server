const admin = require('../../firebase-admin');
const userRepository = require('../repositories/userRepository');
const { isDatabaseConnectionError } = require('../config/database');

const firebaseAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Токен не передано' });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        let user = await userRepository.getUserByFirebaseUid(decodedToken.uid);

        if (!user) {
            user = await userRepository.createUser({
                firebase_uid: decodedToken.uid,
                email: decodedToken.email || null,
                name: decodedToken.name || decodedToken.email || 'Новий користувач',
                avatar_url: decodedToken.picture || null,
                role: 'participant',
            });
        }

        req.user = {
            ...user,
            role: (user.role || 'participant').toLowerCase(),
        };

        next();
    } catch (error) {
        const isExpired = error?.code === 'auth/id-token-expired'
            || error?.errorInfo?.code === 'auth/id-token-expired';

        if (isDatabaseConnectionError(error)) {
            console.error('Firebase auth DB error:', error.code || error.message);
            return res.status(503).json({
                error: error.message || 'База даних тимчасово недоступна. Спробуйте через кілька секунд.',
                code: 'DB_UNAVAILABLE',
            });
        }

        if (!isExpired) {
            console.error('Firebase auth error:', error);
        }

        res.status(401).json({
            error: isExpired
                ? 'Сесія закінчилась. Увійдіть знову або оновіть сторінку.'
                : 'Недійсний або прострочений токен',
            code: isExpired ? 'TOKEN_EXPIRED' : 'AUTH_FAILED',
        });
    }
};

module.exports = firebaseAuthMiddleware;
module.exports.optionalFirebaseAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }
    return firebaseAuthMiddleware(req, res, next);
};
