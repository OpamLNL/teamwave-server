const { query } = require('../config/database');

const getActivityById = async (id) => {
    const rows = await query('SELECT * FROM activities WHERE id = ?', [id]);
    return rows[0] || null;
};

const getActivityForEvent = async (eventId, activityId) => {
    const rows = await query(
        'SELECT * FROM activities WHERE id = ? AND event_id = ?',
        [activityId, eventId]
    );
    return rows[0] || null;
};

const createActivity = async (data) => {
    const result = await query(`
        INSERT INTO activities (event_id, title, type, settings, order_index, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        data.event_id,
        data.title,
        data.type,
        JSON.stringify(data.settings ?? {}),
        data.order_index ?? 0,
        Boolean(data.is_active),
    ]);
    return getActivityById(result.insertId);
};

const updateActivity = async (id, data) => {
    const fields = [];
    const params = [];

    if (data.title !== undefined) {
        fields.push('title = ?');
        params.push(data.title);
    }
    if (data.settings !== undefined) {
        fields.push('settings = ?');
        params.push(JSON.stringify(data.settings));
    }
    if (data.is_active !== undefined) {
        fields.push('is_active = ?');
        params.push(Boolean(data.is_active));
    }
    if (data.started_at !== undefined) {
        fields.push('started_at = ?');
        params.push(data.started_at);
    }
    if (data.ended_at !== undefined) {
        fields.push('ended_at = ?');
        params.push(data.ended_at);
    }

    if (!fields.length) {
        return getActivityById(id);
    }

    params.push(id);
    await query(`UPDATE activities SET ${fields.join(', ')} WHERE id = ?`, params);
    return getActivityById(id);
};

module.exports = {
    getActivityById,
    getActivityForEvent,
    createActivity,
    updateActivity,
};
