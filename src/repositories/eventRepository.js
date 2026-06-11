const { query } = require('../config/database');

const EVENT_SELECT = `
    SELECT
        e.*,
        org.name AS organizer_name,
        org.avatar_url AS organizer_avatar,
        host.name AS host_name,
        host.avatar_url AS host_avatar,
        (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) AS participants_count,
        (SELECT COUNT(*) FROM activities a WHERE a.event_id = e.id) AS activities_count
    FROM events e
    LEFT JOIN users org ON e.organizer_id = org.id
    LEFT JOIN users host ON e.host_id = host.id
`;

const listEvents = async ({ status, type, isPublic, organizerId, search, limit = 50, offset = 0 } = {}) => {
    const conditions = [];
    const params = [];

    if (status) {
        conditions.push('e.status = ?');
        params.push(status);
    }
    if (type) {
        conditions.push('e.type = ?');
        params.push(type);
    }
    if (isPublic === true || isPublic === 'true') {
        conditions.push('e.is_public = TRUE');
    }
    if (organizerId) {
        conditions.push('e.organizer_id = ?');
        params.push(organizerId);
    }
    if (search?.trim()) {
        conditions.push('(e.title LIKE ? OR e.description LIKE ? OR e.join_code LIKE ?)');
        const term = `%${search.trim()}%`;
        params.push(term, term, term);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return query(`
        ${EVENT_SELECT}
        ${where}
        ORDER BY e.start_time DESC
        LIMIT ? OFFSET ?
    `, [...params, Number(limit), Number(offset)]);
};

const getEventById = async (id) => {
    const rows = await query(`${EVENT_SELECT} WHERE e.id = ?`, [id]);
    return rows[0] || null;
};

const getEventByJoinCode = async (joinCode) => {
    const rows = await query(`${EVENT_SELECT} WHERE e.join_code = ?`, [String(joinCode).trim().toUpperCase()]);
    return rows[0] || null;
};

const createEvent = async (data) => {
    const result = await query(`
        INSERT INTO events (
            title, description, start_time, duration_minutes, status, type,
            organizer_id, host_id, max_participants, is_public, template_id, join_code, icon, cover_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        data.title,
        data.description || null,
        data.start_time,
        data.duration_minutes ?? 60,
        data.status ?? 'draft',
        data.type ?? 'combined',
        data.organizer_id,
        data.host_id,
        data.max_participants ?? 50,
        Boolean(data.is_public),
        data.template_id ?? null,
        data.join_code,
        data.icon ?? null,
        data.cover_url ?? null,
    ]);

    return getEventById(result.insertId);
};

const updateEvent = async (id, data) => {
    const fields = [];
    const params = [];

    const allowed = [
        'title', 'description', 'start_time', 'duration_minutes', 'status', 'type',
        'host_id', 'max_participants', 'is_public', 'template_id', 'join_code',
        'icon', 'cover_url', 'cover_delete_url',
    ];

    for (const key of allowed) {
        if (data[key] !== undefined) {
            fields.push(`${key} = ?`);
            params.push(key === 'is_public' ? Boolean(data[key]) : data[key]);
        }
    }

    if (!fields.length) {
        return getEventById(id);
    }

    params.push(id);
    await query(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, params);
    return getEventById(id);
};

const deleteEvent = async (id) => {
    await query('DELETE FROM events WHERE id = ?', [id]);
    return { id };
};

const getActivitiesByEventId = async (eventId) => {
    return query(`
        SELECT *
        FROM activities
        WHERE event_id = ?
        ORDER BY order_index ASC, id ASC
    `, [eventId]);
};

const getParticipantsByEventId = async (eventId) => {
    return query(`
        SELECT
            ep.*,
            u.name AS user_name,
            u.avatar_url AS user_avatar,
            t.name AS team_name
        FROM event_participants ep
        JOIN users u ON ep.user_id = u.id
        LEFT JOIN teams t ON ep.team_id = t.id
        WHERE ep.event_id = ?
        ORDER BY ep.score DESC, ep.joined_at ASC
    `, [eventId]);
};

const getParticipant = async (eventId, userId) => {
    const rows = await query(`
        SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?
    `, [eventId, userId]);
    return rows[0] || null;
};

const addParticipant = async ({ event_id, user_id, team_id = null, role_in_event = 'participant', score = 0 }) => {
    await query(`
        INSERT INTO event_participants (event_id, user_id, team_id, role_in_event, score)
        VALUES (?, ?, ?, ?, ?)
    `, [event_id, user_id, team_id, role_in_event, score]);
    return getParticipant(event_id, user_id);
};

const removeParticipant = async (eventId, userId) => {
    await query('DELETE FROM event_participants WHERE event_id = ? AND user_id = ?', [eventId, userId]);
    return { event_id: eventId, user_id: userId };
};

const getEventsForUser = async (userId) => {
    return query(`
        ${EVENT_SELECT}
        WHERE e.organizer_id = ?
           OR e.host_id = ?
           OR EXISTS (
               SELECT 1 FROM event_participants ep
               WHERE ep.event_id = e.id AND ep.user_id = ?
           )
        ORDER BY e.start_time DESC
    `, [userId, userId, userId]);
};

const joinCodeExists = async (joinCode, excludeId = null) => {
    const params = [joinCode];
    let sql = 'SELECT id FROM events WHERE join_code = ?';
    if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
    }
    const rows = await query(sql, params);
    return rows.length > 0;
};

const getTeamLeaderboardByEventId = async (eventId) => {
    const eventTeams = await query(
        `SELECT
            id AS team_id,
            name AS team_name,
            completion_time_ms
         FROM event_teams
         WHERE event_id = ?
           AND status = 'finished'
           AND completion_time_ms IS NOT NULL
         ORDER BY completion_time_ms ASC, id ASC`,
        [eventId]
    );

    if (eventTeams.length) {
        return eventTeams;
    }

    return query(
        `SELECT
            t.id AS team_id,
            t.name AS team_name,
            MIN(CAST(JSON_UNQUOTE(JSON_EXTRACT(s.content, '$.completion_time_ms')) AS UNSIGNED)) AS completion_time_ms,
            MIN(CAST(JSON_UNQUOTE(JSON_EXTRACT(s.content, '$.rank')) AS UNSIGNED)) AS rank_position
         FROM submissions s
         INNER JOIN activities a ON a.id = s.activity_id AND a.event_id = ? AND a.type = 'typing_race'
         INNER JOIN teams t ON t.id = s.team_id
         WHERE JSON_EXTRACT(s.content, '$.type') = 'typing_race_team_result'
         GROUP BY t.id, t.name
         ORDER BY completion_time_ms ASC`,
        [eventId]
    );
};

module.exports = {
    listEvents,
    getEventById,
    getEventByJoinCode,
    createEvent,
    updateEvent,
    deleteEvent,
    getActivitiesByEventId,
    getParticipantsByEventId,
    getParticipant,
    addParticipant,
    removeParticipant,
    getEventsForUser,
    joinCodeExists,
    getTeamLeaderboardByEventId,
};
