const { getAuth } = require('firebase-admin/auth');
const roleRepository = require('../repositories/roleRepository');

exports.authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
        // Розшифровка токена
        const decoded = await getAuth().verifyIdToken(token);

        // Отримання ролі з БД за firebase_uid

        const role = await roleRepository.getRoleByUserFirebaseUid(decoded.uid);

        if (!role) {
            return res.status(403).json({ error: 'Роль не знайдена для цього користувача' });
        }



        // Записуємо все у req.user
        req.user = {
            ...decoded,
            role
        };


        next();
    } catch (err) {
        console.error('Помилка автентифікації:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
};
