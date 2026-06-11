const { query } = require('../config/database');

const getFavorite = async (userId, targetType, targetId) => {
    const rows = await query(`
        SELECT *
        FROM favorites
        WHERE user_id = ? AND target_type = ? AND target_id = ?
    `, [userId, targetType, targetId]);

    return rows[0];
};

const createFavorite = async (userId, targetType, targetId) => {
    await query(`
        INSERT IGNORE INTO favorites (user_id, target_type, target_id)
        VALUES (?, ?, ?)
    `, [userId, targetType, targetId]);

    return {
        user_id: userId,
        target_type: targetType,
        target_id: targetId
    };
};

const deleteFavorite = async (userId, targetType, targetId) => {
    await query(`
        DELETE FROM favorites
        WHERE user_id = ? AND target_type = ? AND target_id = ?
    `, [userId, targetType, targetId]);

    return {
        user_id: userId,
        target_type: targetType,
        target_id: targetId
    };
};

const getUserFavorites = async (userId) => {
    return await query(`
        SELECT *
        FROM favorites
        WHERE user_id = ?
        ORDER BY created_at DESC
    `, [userId]);
};

module.exports = {
    getFavorite,
    createFavorite,
    deleteFavorite,
    getUserFavorites
};