const { query } = require('../config/database');

const createNotification = async ({ user_id, actor_id, type, target_type, target_id, preview }) => {
    const result = await query(
        `INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, preview)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, actor_id, type, target_type || null, target_id || null, preview || null]
    );

    return { id: result.insertId };
};

const getUserNotifications = async (userId, limit = 50) => {
    return query(
        `SELECT
            n.*,
            u.name AS actor_name,
            u.avatar_url AS actor_avatar
         FROM notifications n
         JOIN users u ON u.id = n.actor_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT ?`,
        [userId, limit]
    );
};

const getUnreadCount = async (userId) => {
    const rows = await query(
        `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
        [userId]
    );
    return Number(rows[0]?.count ?? 0);
};

const markAsRead = async (userId, notificationId) => {
    await query(
        `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
        [notificationId, userId]
    );
};

const markAllAsRead = async (userId) => {
    await query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
        [userId]
    );
};

module.exports = {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
