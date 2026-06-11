const { query } = require('../config/database');

async function tableExists(table) {
    const rows = await query(
        `SELECT TABLE_NAME FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [process.env.DB_DATABASE, table]
    );
    return rows.length > 0;
}

async function ensureContactMessagesSchema() {
    if (await tableExists('contact_messages')) {
        return;
    }

    await query(`
        CREATE TABLE contact_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status ENUM('new', 'read') NOT NULL DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ Created contact_messages table');
}

module.exports = { ensureContactMessagesSchema };
