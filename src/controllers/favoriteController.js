const favoriteService = require('../services/favoriteService');

const toggleFavorite = async (req, res) => {
    const result = await favoriteService.toggleFavorite(
        {
            user_id: req.user.id,
            target_type: req.body.target_type,
            target_id: req.body.target_id
        },
        req.user
    );

    res.json(result);
};

const getUserFavorites = async (req, res) => {
    const favorites = await favoriteService.getUserFavorites(req.user.id);
    res.json(favorites);
};

const getUserFavoritesById = async (req, res) => {
    if (Number(req.params.userId) !== Number(req.user.id)) {
        return res.status(403).json({ error: 'Немає доступу' });
    }
    const favorites = await favoriteService.getUserFavorites(req.params.userId);
    res.json(favorites);
};

const getUserFavoriteItems = async (req, res) => {
    const items = await favoriteService.getUserFavoriteItems(req.user.id);
    res.json(items);
};

module.exports = {
    toggleFavorite,
    getUserFavorites,
    getUserFavoritesById,
    getUserFavoriteItems,
};
