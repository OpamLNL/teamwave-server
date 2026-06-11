const { query } = require('../config/database');

async function ensureFollowsSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS user_follows (
            follower_id INT NOT NULL,
            following_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (follower_id, following_id),
            FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    const columns = await query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'feed_last_seen_at'`,
        [process.env.DB_DATABASE]
    );

    if (columns.length === 0) {
        await query(`
            ALTER TABLE users
            ADD COLUMN feed_last_seen_at TIMESTAMP NULL DEFAULT NULL
        `);
        console.log('✅ Added users.feed_last_seen_at');
    }
}

module.exports = { ensureFollowsSchema };
