const { query } = require('../config/database');

const createMessage = async ({ name, email, message }) => {
    const result = await query(
        `INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)`,
        [name, email, message]
    );

    return { id: result.insertId };
};

module.exports = {
    createMessage,
};
