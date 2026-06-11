const { query } = require('../config/database');

const listTemplates = async ({ category, eventType, isPublic } = {}) => {
    const conditions = [];
    const params = [];

    if (category) {
        conditions.push('et.category = ?');
        params.push(category);
    }
    if (eventType) {
        conditions.push('et.event_type = ?');
        params.push(eventType);
    }
    if (isPublic === true || isPublic === 'true') {
        conditions.push('et.is_public = TRUE');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return query(`
        SELECT
            et.*,
            (SELECT COUNT(*) FROM template_activities ta WHERE ta.template_id = et.id) AS activities_count
        FROM event_templates et
        ${where}
        ORDER BY et.name ASC
    `, params);
};

const getTemplateById = async (id) => {
    const rows = await query(`
        SELECT
            et.*,
            (SELECT COUNT(*) FROM template_activities ta WHERE ta.template_id = et.id) AS activities_count
        FROM event_templates et
        WHERE et.id = ?
    `, [id]);
    return rows[0] || null;
};

const getTemplateActivities = async (templateId) => {
    return query(`
        SELECT *
        FROM template_activities
        WHERE template_id = ?
        ORDER BY order_index ASC, id ASC
    `, [templateId]);
};

module.exports = {
    listTemplates,
    getTemplateById,
    getTemplateActivities,
};
