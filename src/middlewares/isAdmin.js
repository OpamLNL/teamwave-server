console.log('✅ isAdmin middleware завантажено');


module.exports = (req, res, next) => {

    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Доступ заборонено. Потрібна роль ADMIN.' });
};
