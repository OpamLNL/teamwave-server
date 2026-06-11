const { getAuth } = require('firebase-admin/auth');
const { query } = require('../config/database');

exports.signIn = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required.' });
    }

    try {
        // Перевірка токена Firebase
        const decoded = await getAuth().verifyIdToken(token);

        const firebase_uid = decoded.uid;
        const email = decoded.email || null;
        const name = decoded.name || null;
        const avatar_url = decoded.picture || null;

        // Перевірка наявності користувача
        const [existing] = await query('SELECT * FROM users WHERE firebase_uid = ?', [firebase_uid]);

        let user;

        if (existing) {
            user = existing;
        } else {
            const result = await query(`
        INSERT INTO users (firebase_uid, email, name, avatar_url)
        VALUES (?, ?, ?, ?)
      `, [firebase_uid, email, name, avatar_url]);

            const [newUser] = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = newUser;
        }

        // Повернення користувача
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url
        });
    } catch (err) {
        console.error('Firebase signIn error:', err.message);
        res.status(401).json({ error: 'Invalid token' });
    }
};
