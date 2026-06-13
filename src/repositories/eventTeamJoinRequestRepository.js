const { query } = require('../config/database');

const mapRequest = (row) => ({
    id: row.id,
    event_team_id: row.event_team_id,
    user_id: row.user_id,
    slot_index: row.slot_index,
    status: row.status,
    user_name: row.user_name ?? null,
    user_avatar: row.user_avatar ?? null,
    created_at: row.created_at,
    responded_at: row.responded_at,
});

const createRequest = async ({ event_team_id, user_id, slot_index }) => {
    const result = await query(`
        INSERT INTO event_team_join_requests (event_team_id, user_id, slot_index, status)
        VALUES (?, ?, ?, 'pending')
    `, [event_team_id, user_id, slot_index]);
    return getRequestById(result.insertId);
};

const getRequestById = async (id) => {
    const rows = await query(`
        SELECT r.*, u.name AS user_name, u.avatar_url AS user_avatar
        FROM event_team_join_requests r
        JOIN users u ON u.id = r.user_id
        WHERE r.id = ?
    `, [id]);
    return rows[0] ? mapRequest(rows[0]) : null;
};

const getRequestForTeam = async (teamId, requestId) => {
    const rows = await query(`
        SELECT r.*, u.name AS user_name, u.avatar_url AS user_avatar
        FROM event_team_join_requests r
        JOIN users u ON u.id = r.user_id
        WHERE r.id = ? AND r.event_team_id = ?
    `, [requestId, teamId]);
    return rows[0] ? mapRequest(rows[0]) : null;
};

const listPendingByTeam = async (teamId) => {
    const rows = await query(`
        SELECT r.*, u.name AS user_name, u.avatar_url AS user_avatar
        FROM event_team_join_requests r
        JOIN users u ON u.id = r.user_id
        WHERE r.event_team_id = ? AND r.status = 'pending'
        ORDER BY r.created_at ASC
    `, [teamId]);
    return rows.map(mapRequest);
};

const getPendingByUserForEvent = async (eventId, userId) => {
    const rows = await query(`
        SELECT r.*, u.name AS user_name, u.avatar_url AS user_avatar, et.event_id
        FROM event_team_join_requests r
        JOIN event_teams et ON et.id = r.event_team_id
        JOIN users u ON u.id = r.user_id
        WHERE et.event_id = ? AND r.user_id = ? AND r.status = 'pending'
        LIMIT 1
    `, [eventId, userId]);
    return rows[0] ? mapRequest(rows[0]) : null;
};

const getPendingByTeamAndSlot = async (teamId, slotIndex) => {
    const rows = await query(`
        SELECT r.*, u.name AS user_name, u.avatar_url AS user_avatar
        FROM event_team_join_requests r
        JOIN users u ON u.id = r.user_id
        WHERE r.event_team_id = ? AND r.slot_index = ? AND r.status = 'pending'
        LIMIT 1
    `, [teamId, slotIndex]);
    return rows[0] ? mapRequest(rows[0]) : null;
};

const updateRequestStatus = async (id, status) => {
    await query(`
        UPDATE event_team_join_requests
        SET status = ?, responded_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [status, id]);
    return getRequestById(id);
};

const cancelPendingForUserInEvent = async (eventId, userId, exceptTeamId = null) => {
    const params = [eventId, userId];
    let sql = `
        UPDATE event_team_join_requests r
        JOIN event_teams et ON et.id = r.event_team_id
        SET r.status = 'cancelled', r.responded_at = CURRENT_TIMESTAMP
        WHERE et.event_id = ? AND r.user_id = ? AND r.status = 'pending'
    `;
    if (exceptTeamId) {
        sql += ' AND r.event_team_id != ?';
        params.push(exceptTeamId);
    }
    await query(sql, params);
};

const cancelPendingForUserInTeam = async (teamId, userId) => {
    await query(`
        UPDATE event_team_join_requests
        SET status = 'cancelled', responded_at = CURRENT_TIMESTAMP
        WHERE event_team_id = ? AND user_id = ? AND status = 'pending'
    `, [teamId, userId]);
};

module.exports = {
    createRequest,
    getRequestById,
    getRequestForTeam,
    listPendingByTeam,
    getPendingByUserForEvent,
    getPendingByTeamAndSlot,
    updateRequestStatus,
    cancelPendingForUserInEvent,
    cancelPendingForUserInTeam,
};
