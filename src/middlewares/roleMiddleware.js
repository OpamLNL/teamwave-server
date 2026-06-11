const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Не авторизований' });
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Тільки для адміністратора' });
    }
    next();
};

const isModeratorOrAdmin = (req, res, next) => {
    if (!['admin', 'organizer', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Недостатньо прав' });
    }
    next();
};

const isOwnerOrModeratorOrAdmin = (getOwnerId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Не авторизований' });
            }

            if (['admin', 'moderator', 'organizer'].includes(req.user.role)) {
                return next();
            }

            const ownerId = await getOwnerId(req);

            if (Number(ownerId) !== Number(req.user.id)) {
                return res.status(403).json({ error: 'Немає доступу' });
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

const isOwner = (getOwnerId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Не авторизований' });
            }

            const ownerId = await getOwnerId(req);

            if (Number(ownerId) !== Number(req.user.id)) {
                return res.status(403).json({ error: 'Немає доступу' });
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isModeratorOrAdmin,
    isOwnerOrModeratorOrAdmin,
    isOwner
};