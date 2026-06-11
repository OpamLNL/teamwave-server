const { query } = require('../config/database');

const getTeamById = async (id) => {
    const rows = await query('SELECT * FROM event_teams WHERE id = ?', [id]);
    return rows[0] || null;
};

const getTeamForEvent = async (eventId, teamId) => {
    const rows = await query(
        'SELECT * FROM event_teams WHERE id = ? AND event_id = ?',
        [teamId, eventId]
    );
    return rows[0] || null;
};

const listTeamsByEventId = async (eventId) => {
    return query(`
        SELECT
            et.*,
            u.name AS captain_name,
            u.avatar_url AS captain_avatar,
            (SELECT COUNT(*) FROM event_team_members etm WHERE etm.event_team_id = et.id) AS members_count
        FROM event_teams et
        LEFT JOIN users u ON et.captain_user_id = u.id
        WHERE et.event_id = ?
        ORDER BY et.created_at ASC, et.id ASC
    `, [eventId]);
};

const getTeamMembers = async (eventTeamId) => {
    return query(`
        SELECT
            etm.*,
            u.name AS user_name,
            u.avatar_url AS user_avatar
        FROM event_team_members etm
        JOIN users u ON etm.user_id = u.id
        WHERE etm.event_team_id = ?
        ORDER BY etm.slot_index ASC
    `, [eventTeamId]);
};

const getMember = async (eventTeamId, userId) => {
    const rows = await query(
        'SELECT * FROM event_team_members WHERE event_team_id = ? AND user_id = ?',
        [eventTeamId, userId]
    );
    return rows[0] || null;
};

const getMemberBySlot = async (eventTeamId, slotIndex) => {
    const rows = await query(
        'SELECT * FROM event_team_members WHERE event_team_id = ? AND slot_index = ?',
        [eventTeamId, slotIndex]
    );
    return rows[0] || null;
};

const createTeam = async ({ event_id, name, captain_user_id }) => {
    const result = await query(`
        INSERT INTO event_teams (event_id, name, captain_user_id, status)
        VALUES (?, ?, ?, 'open')
    `, [event_id, name, captain_user_id ?? null]);
    return getTeamById(result.insertId);
};

const addMember = async ({ event_team_id, user_id, slot_index }) => {
    await query(`
        INSERT INTO event_team_members (event_team_id, user_id, slot_index)
        VALUES (?, ?, ?)
    `, [event_team_id, user_id, slot_index]);
    return getMember(event_team_id, user_id);
};

const removeMember = async (eventTeamId, userId) => {
    await query(
        'DELETE FROM event_team_members WHERE event_team_id = ? AND user_id = ?',
        [eventTeamId, userId]
    );
    return { event_team_id: eventTeamId, user_id: userId };
};

const updateTeam = async (id, data) => {
    const fields = [];
    const params = [];

    const allowed = ['name', 'captain_user_id', 'status', 'started_at', 'finished_at', 'completion_time_ms'];
    for (const key of allowed) {
        if (data[key] !== undefined) {
            fields.push(`${key} = ?`);
            params.push(data[key]);
        }
    }

    if (!fields.length) {
        return getTeamById(id);
    }

    params.push(id);
    await query(`UPDATE event_teams SET ${fields.join(', ')} WHERE id = ?`, params);
    return getTeamById(id);
};

const countMembers = async (eventTeamId) => {
    const rows = await query(
        'SELECT COUNT(*) AS cnt FROM event_team_members WHERE event_team_id = ?',
        [eventTeamId]
    );
    return Number(rows[0]?.cnt ?? 0);
};

const getUserTeamInEvent = async (eventId, userId) => {
    const rows = await query(`
        SELECT et.*, etm.slot_index
        FROM event_teams et
        INNER JOIN event_team_members etm ON etm.event_team_id = et.id
        WHERE et.event_id = ? AND etm.user_id = ?
        LIMIT 1
    `, [eventId, userId]);
    return rows[0] || null;
};

const getFinishedTeamsLeaderboard = async (eventId) => {
    return query(`
        SELECT
            id AS team_id,
            name AS team_name,
            completion_time_ms
        FROM event_teams
        WHERE event_id = ?
          AND status = 'finished'
          AND completion_time_ms IS NOT NULL
        ORDER BY completion_time_ms ASC, id ASC
    `, [eventId]);
};

module.exports = {
    getTeamById,
    getTeamForEvent,
    listTeamsByEventId,
    getTeamMembers,
    getMember,
    getMemberBySlot,
    createTeam,
    addMember,
    removeMember,
    updateTeam,
    countMembers,
    getUserTeamInEvent,
    getFinishedTeamsLeaderboard,
};
