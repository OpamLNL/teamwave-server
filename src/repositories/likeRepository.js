const { query } = require('../config/database');

const getLike = async (userId, targetType, targetId) => {
    const rows = await query(`
        SELECT *
        FROM likes
        WHERE user_id = ? AND target_type = ? AND target_id = ?
    `, [userId, targetType, targetId]);

    return rows[0];
};

const createLike = async (userId, targetType, targetId) => {
    await query(`
        INSERT IGNORE INTO likes (user_id, target_type, target_id)
        VALUES (?, ?, ?)
    `, [userId, targetType, targetId]);

    return {
        user_id: userId,
        target_type: targetType,
        target_id: targetId
    };
};

const deleteLike = async (userId, targetType, targetId) => {
    await query(`
        DELETE FROM likes
        WHERE user_id = ? AND target_type = ? AND target_id = ?
    `, [userId, targetType, targetId]);

    return {
        user_id: userId,
        target_type: targetType,
        target_id: targetId
    };
};

const getLikesCount = async (targetType, targetId) => {
    const rows = await query(`
        SELECT COUNT(*) AS count
        FROM likes
        WHERE target_type = ? AND target_id = ?
    `, [targetType, targetId]);

    return rows[0].count;
};

const getUserLikes = async (userId) => {
    return await query(`
        SELECT *
        FROM likes
        WHERE user_id = ?
        ORDER BY created_at DESC
    `, [userId]);
};

module.exports = {
    getLike,
    createLike,
    deleteLike,
    getLikesCount,
    getUserLikes
};