const { query } = require('../config/database');

async function ensureNotificationsSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            actor_id INT NOT NULL,
            type ENUM('like', 'comment', 'follow') NOT NULL,
            target_type ENUM('work', 'post', 'comment', 'user') NULL,
            target_id INT NULL,
            preview TEXT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_notifications_user (user_id, is_read, created_at)
        )
    `);
}

module.exports = { ensureNotificationsSchema };
