const { query } = require('../config/database');
const { normalizeTypingRaceSettings } = require('../utils/typingRaceSettings');

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

async function ensureTeamJoinRequestsSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS event_team_join_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_team_id INT NOT NULL,
            user_id INT NOT NULL,
            slot_index INT NOT NULL,
            status ENUM('pending', 'accepted', 'declined', 'cancelled') NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            responded_at TIMESTAMP NULL DEFAULT NULL,
            FOREIGN KEY (event_team_id) REFERENCES event_teams(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_team_join_requests_team_status (event_team_id, status),
            INDEX idx_team_join_requests_user (user_id, status)
        )
    `);

    await ensureColumn('typing_race_runs', 'is_practice', 'BOOLEAN NOT NULL DEFAULT FALSE AFTER completion_time_ms');
    await backfillTypingRaceActivitySettings();
}

async function backfillTypingRaceActivitySettings() {
    const rows = await query(`SELECT id, settings FROM activities WHERE type = 'typing_race'`);
    for (const row of rows) {
        const raw = typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings;
        const normalized = normalizeTypingRaceSettings(raw);
        if (JSON.stringify(normalized) !== JSON.stringify(raw)) {
            await query('UPDATE activities SET settings = ? WHERE id = ?', [JSON.stringify(normalized), row.id]);
        }
    }
}

module.exports = { ensureTeamJoinRequestsSchema };
