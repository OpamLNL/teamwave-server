const { query } = require('../config/database');

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

async function ensureUserAvatarSchema() {
    await ensureColumn('users', 'avatar_delete_url', 'TEXT NULL DEFAULT NULL AFTER avatar_url');
}

module.exports = { ensureUserAvatarSchema };
