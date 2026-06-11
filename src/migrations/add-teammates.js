const { query } = require('../config/database');

async function ensureTeammatesSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS teammate_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            from_user_id INT NOT NULL,
            to_user_id INT NOT NULL,
            status ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_teammate_pair (from_user_id, to_user_id),
            FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_teammate_to_status (to_user_id, status),
            INDEX idx_teammate_from_status (from_user_id, status)
        )
    `);

    const columns = await query(
        `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'type'`,
        [process.env.DB_DATABASE]
    );

    const columnType = columns[0]?.COLUMN_TYPE || columns[0]?.column_type || '';
    if (columnType && !columnType.includes('team_invite')) {
        await query(`
            ALTER TABLE notifications
            MODIFY COLUMN type ENUM(
                'event_invite',
                'activity_started',
                'activity_ended',
                'score_update',
                'feedback_request',
                'team_invite',
                'system'
            ) NOT NULL
        `);
        console.log('✅ Added notifications.type team_invite');
    }
}

module.exports = { ensureTeammatesSchema };
