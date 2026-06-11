const { query } = require('../config/database');

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

async function ensureEventMediaSchema() {
    for (const col of EVENT_COLUMNS) {
        await ensureColumn('events', col.name, col.sql);
    }
    for (const col of TEMPLATE_COLUMNS) {
        await ensureColumn('event_templates', col.name, col.sql);
    }
}

module.exports = { ensureEventMediaSchema };
