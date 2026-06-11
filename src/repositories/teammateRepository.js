const { query } = require('../config/database');

const getRequestBetween = async (fromUserId, toUserId) => {
    const rows = await query(
        `SELECT * FROM teammate_requests
         WHERE from_user_id = ? AND to_user_id = ?`,
        [fromUserId, toUserId]
    );
    return rows[0] || null;
};

const createRequest = async (fromUserId, toUserId) => {
    const result = await query(
        `INSERT INTO teammate_requests (from_user_id, to_user_id, status)
         VALUES (?, ?, 'pending')`,
        [fromUserId, toUserId]
    );
    return { id: result.insertId, from_user_id: fromUserId, to_user_id: toUserId, status: 'pending' };
};

const updateRequestStatus = async (requestId, status) => {
    await query(
        `UPDATE teammate_requests SET status = ? WHERE id = ?`,
        [status, requestId]
    );
};

const deleteRequest = async (requestId) => {
    await query(`DELETE FROM teammate_requests WHERE id = ?`, [requestId]);
};

const deleteConnectionBetween = async (userA, userB) => {
    await query(
        `DELETE FROM teammate_requests
         WHERE status = 'accepted'
           AND (
               (from_user_id = ? AND to_user_id = ?)
               OR (from_user_id = ? AND to_user_id = ?)
           )`,
        [userA, userB, userB, userA]
    );
};

const getTeammates = async (userId) => {
    return query(
        `SELECT
            u.id,
            u.name,
            u.avatar_url,
            u.role,
            u.company,
            u.position,
            u.points,
            u.level,
            tr.created_at AS connected_at
         FROM teammate_requests tr
         JOIN users u ON u.id = IF(tr.from_user_id = ?, tr.to_user_id, tr.from_user_id)
         WHERE tr.status = 'accepted'
           AND (tr.from_user_id = ? OR tr.to_user_id = ?)
         ORDER BY tr.updated_at DESC`,
        [userId, userId, userId]
    );
};

const getPendingIncoming = async (userId) => {
    return query(
        `SELECT
            tr.id,
            tr.from_user_id,
            tr.to_user_id,
            tr.status,
            tr.created_at,
            u.name AS from_user_name,
            u.avatar_url AS from_user_avatar
         FROM teammate_requests tr
         JOIN users u ON u.id = tr.from_user_id
         WHERE tr.to_user_id = ? AND tr.status = 'pending'
         ORDER BY tr.created_at DESC`,
        [userId]
    );
};

const countTeammates = async (userId) => {
    const rows = await query(
        `SELECT COUNT(*) AS count
         FROM teammate_requests
         WHERE status = 'accepted'
           AND (from_user_id = ? OR to_user_id = ?)`,
        [userId, userId]
    );
    return Number(rows[0]?.count ?? 0);
};

module.exports = {
    getRequestBetween,
    createRequest,
    updateRequestStatus,
    deleteRequest,
    deleteConnectionBetween,
    getTeammates,
    getPendingIncoming,
    countTeammates,
};
