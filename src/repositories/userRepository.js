const { query } = require('../config/database');

const getAllUsers = async () => {
    return await query(`
        SELECT *
        FROM users
        ORDER BY created_at DESC
    `);
};

const getUserById = async (id) => {
    const rows = await query(`
        SELECT *
        FROM users
        WHERE id = ?
    `, [id]);

    return rows[0];
};

const getUserByFirebaseUid = async (firebaseUid) => {
    const rows = await query(`
        SELECT *
        FROM users
        WHERE firebase_uid = ?
    `, [firebaseUid]);

    return rows[0];
};

const getUserByEmail = async (email) => {
    const rows = await query(`
        SELECT *
        FROM users
        WHERE email = ?
    `, [email]);

    return rows[0];
};

const searchUsers = async (searchQuery) => {
    return await query(`
        SELECT *
        FROM users
        WHERE name LIKE ? OR email LIKE ?
        ORDER BY name ASC
    `, [`%${searchQuery}%`, `%${searchQuery}%`]);
};

const getUserEvents = async (userId) => {
    return query(`
        SELECT e.*,
               org.name AS organizer_name,
               host.name AS host_name,
               (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) AS participants_count
        FROM events e
        LEFT JOIN users org ON e.organizer_id = org.id
        LEFT JOIN users host ON e.host_id = host.id
        WHERE e.organizer_id = ?
           OR e.host_id = ?
           OR EXISTS (
               SELECT 1 FROM event_participants ep
               WHERE ep.event_id = e.id AND ep.user_id = ?
           )
        ORDER BY e.start_time DESC
    `, [userId, userId, userId]);
};

const getUserComments = async (userId) => {
    return await query(`
        SELECT *
        FROM comments
        WHERE user_id = ?
        ORDER BY created_at DESC
    `, [userId]);
};

const getReceivedComments = async (userId, limit = 50) => {
    return query(
        `SELECT
            c.id,
            c.content,
            c.target_type,
            c.target_id,
            c.status,
            c.created_at,
            c.user_id AS author_id,
            u.name AS author_name,
            u.avatar_url AS author_avatar,
            CASE
                WHEN c.target_type = 'event' THEN ev.title
                WHEN c.target_type = 'activity' THEN a.title
            END AS target_title
         FROM comments c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN events ev ON c.target_type = 'event' AND c.target_id = ev.id
         LEFT JOIN activities a ON c.target_type = 'activity' AND c.target_id = a.id
         WHERE c.status = 'active'
           AND c.user_id != ?
           AND (
               (c.target_type = 'event' AND ev.organizer_id = ?)
               OR (c.target_type = 'activity' AND EXISTS (
                   SELECT 1 FROM events e2 WHERE e2.id = a.event_id AND e2.organizer_id = ?
               ))
           )
         ORDER BY c.created_at DESC
         LIMIT ?`,
        [userId, userId, userId, limit]
    );
};

const getUserStats = async (userId) => {
    const organized = await query('SELECT COUNT(*) AS count FROM events WHERE organizer_id = ?', [userId]);
    const hosted = await query('SELECT COUNT(*) AS count FROM events WHERE host_id = ?', [userId]);
    const participated = await query(
        'SELECT COUNT(*) AS count FROM event_participants WHERE user_id = ? AND role_in_event = ?',
        [userId, 'participant']
    );
    const comments = await query('SELECT COUNT(*) AS count FROM comments WHERE user_id = ?', [userId]);
    const likes = await query('SELECT COUNT(*) AS count FROM likes WHERE user_id = ?', [userId]);
    const favorites = await query('SELECT COUNT(*) AS count FROM favorites WHERE user_id = ?', [userId]);

    return {
        events_organized_count: Number(organized[0].count ?? 0),
        events_hosted_count: Number(hosted[0].count ?? 0),
        events_participated_count: Number(participated[0].count ?? 0),
        comments_count: Number(comments[0].count ?? 0),
        likes_count: Number(likes[0].count ?? 0),
        favorites_count: Number(favorites[0].count ?? 0),
    };
};

const getPopularAuthors = async (limit = 3) => {
    return query(
        `SELECT
            u.id,
            u.name,
            u.avatar_url,
            u.role,
            (SELECT COUNT(*) FROM events e WHERE e.organizer_id = u.id) AS events_organized_count,
            (SELECT COUNT(*) FROM events e WHERE e.host_id = u.id) AS events_hosted_count,
            u.points
         FROM users u
         WHERE (u.is_blocked = FALSE OR u.is_blocked IS NULL)
           AND u.role IN ('host', 'organizer', 'admin')
         ORDER BY events_organized_count DESC, events_hosted_count DESC, u.points DESC
         LIMIT ?`,
        [limit]
    );
};

const createUser = async (data) => {
    const {
        firebase_uid,
        email,
        name,
        avatar_url,
        role
    } = data;

    const result = await query(`
        INSERT INTO users (firebase_uid, email, name, avatar_url, role, is_blocked)
        VALUES (?, ?, ?, ?, ?, FALSE)
    `, [
        firebase_uid,
        email || null,
        name || null,
        avatar_url || null,
        role || 'user'
    ]);

    return {
        id: result.insertId,
        firebase_uid,
        email,
        name,
        avatar_url,
        role: role || 'participant',
        is_blocked: false
    };
};

const updateUser = async (id, data) => {
    const {
        email,
        name,
        avatar_url,
        avatar_delete_url,
        show_mature_content,
    } = data;

    const fields = ['email = ?', 'name = ?', 'avatar_url = ?'];
    const values = [email || null, name || null, avatar_url || null];

    if (avatar_delete_url !== undefined) {
        fields.push('avatar_delete_url = ?');
        values.push(avatar_delete_url || null);
    }

    if (show_mature_content !== undefined) {
        fields.push('show_mature_content = ?', 'mature_confirmed_at = ?');
        values.push(Boolean(show_mature_content));
        values.push(show_mature_content ? new Date() : null);
    }

    values.push(id);

    await query(`
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = ?
    `, values);

    return {
        id,
        email,
        name,
        avatar_url,
        ...(show_mature_content !== undefined
            ? { show_mature_content: Boolean(show_mature_content) }
            : {}),
    };
};

const updateUserRole = async (id, role) => {
    await query(`
        UPDATE users
        SET role = ?
        WHERE id = ?
    `, [role, id]);

    return {
        id,
        role
    };
};

const updateUserBlockedStatus = async (id, isBlocked) => {
    await query(`
        UPDATE users
        SET is_blocked = ?
        WHERE id = ?
    `, [Boolean(isBlocked), id]);

    return {
        id,
        is_blocked: Boolean(isBlocked)
    };
};

const deleteUser = async (id) => {
    await query(`
        DELETE FROM users
        WHERE id = ?
    `, [id]);

    return { id };
};

module.exports = {
    getAllUsers,
    getUserById,
    getUserByFirebaseUid,
    getUserByEmail,
    searchUsers,
    getUserEvents,
    getUserComments,
    getReceivedComments,
    getUserStats,
    getPopularAuthors,
    createUser,
    updateUser,
    updateUserRole,
    updateUserBlockedStatus,
    deleteUser
};