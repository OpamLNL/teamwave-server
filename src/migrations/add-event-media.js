const { query } = require('../config/database');
const { CATEGORY_ICONS, TEMPLATE_ICONS } = require('../utils/eventIcons');

const EVENT_COLUMNS = [
    { name: 'icon', sql: 'VARCHAR(16) NULL DEFAULT NULL AFTER join_code' },
    { name: 'cover_url', sql: 'TEXT NULL DEFAULT NULL AFTER icon' },
    { name: 'cover_delete_url', sql: 'TEXT NULL DEFAULT NULL AFTER cover_url' },
];

const TEMPLATE_COLUMNS = [
    { name: 'icon', sql: 'VARCHAR(16) NULL DEFAULT NULL AFTER is_public' },
    { name: 'cover_url', sql: 'TEXT NULL DEFAULT NULL AFTER icon' },
];

async function ensureColumn(table, column, definition) {
    const rows = await query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [process.env.DB_DATABASE, table, column]
    );
    if (!rows.length) {
        await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
}

async function backfillTemplateIcons() {
    for (const [id, icon] of Object.entries(TEMPLATE_ICONS)) {
        await query(
            'UPDATE event_templates SET icon = ? WHERE id = ? AND (icon IS NULL OR icon = \'\')',
            [icon, Number(id)]
        );
    }

    for (const [category, icon] of Object.entries(CATEGORY_ICONS)) {
        await query(
            'UPDATE event_templates SET icon = ? WHERE category = ? AND (icon IS NULL OR icon = \'\')',
            [icon, category]
        );
    }
}

async function backfillEventIcons() {
    for (const [type, icon] of Object.entries(CATEGORY_ICONS)) {
        await query(
            'UPDATE events SET icon = ? WHERE type = ? AND (icon IS NULL OR icon = \'\')',
            [icon, type]
        );
    }
}

async function ensureEventMediaSchema() {
    for (const col of EVENT_COLUMNS) {
        await ensureColumn('events', col.name, col.sql);
    }
    for (const col of TEMPLATE_COLUMNS) {
        await ensureColumn('event_templates', col.name, col.sql);
    }

    await backfillTemplateIcons();
    await backfillEventIcons();
}

module.exports = { ensureEventMediaSchema };
