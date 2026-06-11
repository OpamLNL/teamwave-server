const { query } = require('../config/database');

async function ensureTypingRaceSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS event_teams (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            captain_user_id INT NULL,
            status ENUM('open', 'ready', 'racing', 'finished') NOT NULL DEFAULT 'open',
            started_at TIMESTAMP NULL DEFAULT NULL,
            finished_at TIMESTAMP NULL DEFAULT NULL,
            completion_time_ms INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_event_team_name (event_id, name),
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (captain_user_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_event_teams_event (event_id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS event_team_members (
            event_team_id INT NOT NULL,
            user_id INT NOT NULL,
            slot_index INT NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (event_team_id, user_id),
            UNIQUE KEY uniq_event_team_slot (event_team_id, slot_index),
            FOREIGN KEY (event_team_id) REFERENCES event_teams(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS typing_race_runs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            activity_id INT NOT NULL,
            event_team_id INT NOT NULL,
            current_segment_index INT NOT NULL DEFAULT 0,
            segment_typed_chars INT NOT NULL DEFAULT 0,
            started_at TIMESTAMP NULL DEFAULT NULL,
            finished_at TIMESTAMP NULL DEFAULT NULL,
            completion_time_ms INT NULL,
            UNIQUE KEY uniq_typing_run (activity_id, event_team_id),
            FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
            FOREIGN KEY (event_team_id) REFERENCES event_teams(id) ON DELETE CASCADE
        )
    `);

    const cols = await query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'typing_race_runs' AND COLUMN_NAME = 'segment_typed_chars'`,
        [process.env.DB_DATABASE]
    );
    if (!cols.length) {
        await query(`
            ALTER TABLE typing_race_runs
            ADD COLUMN segment_typed_chars INT NOT NULL DEFAULT 0 AFTER current_segment_index
        `);
    }
}

module.exports = { ensureTypingRaceSchema };
