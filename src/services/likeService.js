const likeRepository = require('../repositories/likeRepository');
const { LIKE_TARGETS, createLikeEntity } = require('../models/likeModel');
const notificationService = require('./notificationService');

const validateTargetType = (targetType) => {
    if (!Object.values(LIKE_TARGETS).includes(targetType)) {
        throw new Error('Некоректний тип цілі для лайка');
    }
};

const toggleLike = async ({ user_id, target_type, target_id }, user) => {
    if (user?.is_blocked) {
        throw new Error('Користувач заблокований');
    }

    if (!user_id) {
        throw new Error('user_id обовʼязковий');
    }

    if (!target_id) {
        throw new Error('target_id обовʼязковий');
    }

    validateTargetType(target_type);

    const existing = await likeRepository.getLike(user_id, target_type, target_id);

    if (existing) {
        await likeRepository.deleteLike(user_id, target_type, target_id);

        const count = await likeRepository.getLikesCount(target_type, target_id);

        return {
            liked: false,
            count
        };
    }

    await likeRepository.createLike(user_id, target_type, target_id);

    const count = await likeRepository.getLikesCount(target_type, target_id);

    notificationService.notifyLike({ actor_id: user_id, target_type, target_id });

    return {
        liked: true,
        count
    };
};

const getLikesCount = async (targetType, targetId) => {
    validateTargetType(targetType);

    return {
        target_type: targetType,
        target_id: targetId,
        count: await likeRepository.getLikesCount(targetType, targetId)
    };
};

const getUserLikes = async (userId) => {
    const likes = await likeRepository.getUserLikes(userId);
    return likes.map(like => createLikeEntity(like));
};

module.exports = {
    toggleLike,
    getLikesCount,
    getUserLikes
};