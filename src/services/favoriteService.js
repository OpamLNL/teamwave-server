const favoriteRepository = require('../repositories/favoriteRepository');
const { FAVORITE_TARGETS, createFavoriteEntity } = require('../models/favoriteModel');
const eventRepository = require('../repositories/eventRepository');
const eventTemplateRepository = require('../repositories/eventTemplateRepository');
const { createEventEntity, createTemplateEntity } = require('../models/eventModel');

const validateTargetType = (targetType) => {
    if (!Object.values(FAVORITE_TARGETS).includes(targetType)) {
        throw new Error('Некоректний тип обраного');
    }
};

const toggleFavorite = async ({ user_id, target_type, target_id }, user) => {
    if (user?.is_blocked) {
        throw new Error('Користувач заблокований');
    }

    if (!user_id) throw new Error('user_id обовʼязковий');
    if (!target_id) throw new Error('target_id обовʼязковий');

    validateTargetType(target_type);

    const existing = await favoriteRepository.getFavorite(user_id, target_type, target_id);

    if (existing) {
        await favoriteRepository.deleteFavorite(user_id, target_type, target_id);
        return { favorite: false };
    }

    await favoriteRepository.createFavorite(user_id, target_type, target_id);
    return { favorite: true };
};

const getUserFavorites = async (userId) => {
    const favorites = await favoriteRepository.getUserFavorites(userId);
    return favorites.map(createFavoriteEntity);
};

const getUserFavoriteItems = async (userId) => {
    const favorites = await favoriteRepository.getUserFavorites(userId);
    const events = [];
    const templates = [];
    const activities = [];

    for (const fav of favorites) {
        if (fav.target_type === FAVORITE_TARGETS.EVENT) {
            try {
                const event = await eventRepository.getEventById(fav.target_id);
                if (event) events.push(createEventEntity(event));
            } catch {
                // захід видалено
            }
        } else if (fav.target_type === FAVORITE_TARGETS.TEMPLATE) {
            try {
                const template = await eventTemplateRepository.getTemplateById(fav.target_id);
                if (template) templates.push(createTemplateEntity(template));
            } catch {
                // шаблон видалено
            }
        } else if (fav.target_type === FAVORITE_TARGETS.ACTIVITY) {
            activities.push({
                target_type: fav.target_type,
                target_id: fav.target_id,
                created_at: fav.created_at,
            });
        }
    }

    return { events, templates, activities };
};

module.exports = {
    toggleFavorite,
    getUserFavorites,
    getUserFavoriteItems,
};
