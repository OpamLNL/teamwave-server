const express = require('express');
const router = express.Router();
const admin = require('../../firebase-admin');
const { query } = require('../config/database');

router.post('/firebase', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.replace('Bearer ', '');

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decoded;
        const profileName = req.body?.name || name || email || 'Новий користувач';
        const profileEmail = req.body?.email || email || null;
        const profileAvatar = req.body?.avatar_url || picture || null;

        let users = await query('SELECT * FROM users WHERE firebase_uid = ?', [uid]);

        let userId;
        let dbUser;

        if (!users || users.length === 0) {
            try {
                const result = await query(
                    'INSERT INTO users (firebase_uid, email, name, avatar_url, role) VALUES (?, ?, ?, ?, ?)',
                    [uid, profileEmail, profileName, profileAvatar, 'user']
                );
                userId = result.insertId;
                const rows = await query('SELECT * FROM users WHERE id = ?', [userId]);
                dbUser = rows[0];
            } catch (insertError) {
                if (insertError.code !== 'ER_DUP_ENTRY') {
                    throw insertError;
                }
                users = await query('SELECT * FROM users WHERE firebase_uid = ?', [uid]);
                dbUser = users[0];
                userId = dbUser.id;
            }
        } else {
            dbUser = users[0];
            userId = dbUser.id;
        }

        const role = (dbUser.role || 'user').toLowerCase();

        res.status(200).json({
            success: true,
            id: userId,
            firebaseUid: uid,
            role,
            name: dbUser.name || name || '',
            email: dbUser.email || email || '',
            avatar_url: dbUser.avatar_url || picture || '',
        });
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: 'Невірний токен Firebase' });
    }
});

module.exports = router;
