const { query } = require('../config/database');

const getStats = async () => {
    const users = await query('SELECT COUNT(*) AS count FROM users');
    const events = await query('SELECT COUNT(*) AS count FROM events');
    const templates = await query('SELECT COUNT(*) AS count FROM event_templates');
    const participants = await query('SELECT COUNT(*) AS count FROM event_participants');
    const comments = await query('SELECT COUNT(*) AS count FROM comments');
    const activeEvents = await query(`SELECT COUNT(*) AS count FROM events WHERE status = 'active'`);
    const plannedEvents = await query(`SELECT COUNT(*) AS count FROM events WHERE status = 'planned'`);

    return {
        users_count: users[0].count,
        events_count: events[0].count,
        templates_count: templates[0].count,
        participants_count: participants[0].count,
        comments_count: comments[0].count,
        active_events_count: activeEvents[0].count,
        planned_events_count: plannedEvents[0].count,
    };
};

const getUsers = async () => {
    return query(`
        SELECT id, firebase_uid, email, name, avatar_url, role, is_blocked, created_at
        FROM users
        ORDER BY created_at DESC
    `);
};

const searchUsers = async (searchQuery) => {
    return query(`
        SELECT id, firebase_uid, email, name, avatar_url, role, is_blocked, created_at
        FROM users
        WHERE name LIKE ? OR email LIKE ?
        ORDER BY created_at DESC
    `, [`%${searchQuery}%`, `%${searchQuery}%`]);
};

const updateUserRole = async (id, role) => {
    await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return { id, role };
};

const updateUserBlockedStatus = async (id, isBlocked) => {
    await query('UPDATE users SET is_blocked = ? WHERE id = ?', [Boolean(isBlocked), id]);
    return { id, is_blocked: Boolean(isBlocked) };
};

const deleteUser = async (id) => {
    await query('DELETE FROM users WHERE id = ?', [id]);
    return { id };
};

const updateCommentStatus = async (id, status) => {
    await query('UPDATE comments SET status = ? WHERE id = ?', [status, id]);
    return { id, status };
};

const deleteComment = async (id) => {
    await query('DELETE FROM comments WHERE id = ?', [id]);
    return { id };
};

const getAdminEvents = async () => {
    return query(`
        SELECT
            e.*,
            org.name AS organizer_name,
            host.name AS host_name,
            (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) AS participants_count
        FROM events e
        LEFT JOIN users org ON e.organizer_id = org.id
        LEFT JOIN users host ON e.host_id = host.id
        ORDER BY e.start_time DESC
    `);
};

const updateEventStatus = async (id, status) => {
    await query('UPDATE events SET status = ? WHERE id = ?', [status, id]);
    return { id, status };
};

const deleteEvent = async (id) => {
    await query('DELETE FROM events WHERE id = ?', [id]);
    return { id };
};

const getAdminComments = async () => {
    return query(`
        SELECT c.*, u.name AS author_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
    `);
};

module.exports = {
    getStats,
    getUsers,
    searchUsers,
    updateUserRole,
    updateUserBlockedStatus,
    deleteUser,
    updateCommentStatus,
    deleteComment,
    getAdminEvents,
    updateEventStatus,
    deleteEvent,
    getAdminComments,
};
