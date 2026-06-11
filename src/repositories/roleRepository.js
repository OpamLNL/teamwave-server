const { query } = require('../config/database');

const getAllRoles = async () => {
    const sql = `SELECT * FROM roles`;
    return await query(sql);
};

const getRoleByUserFirebaseUid = async (firebaseUid) => {


    const sql = `
        SELECT r.name
        FROM users u
                 JOIN user_roles ur ON u.id = ur.user_id
                 JOIN roles r ON ur.role_id = r.id
        WHERE u.firebase_uid = ?
            LIMIT 1
    `;

    const rows = await query(sql, [firebaseUid]);

    return rows.length ? rows[0].name : null;
};

module.exports = {
    getAllRoles,
    getRoleByUserFirebaseUid,

};
