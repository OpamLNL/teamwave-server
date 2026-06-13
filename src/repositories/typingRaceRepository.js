const { query } = require('../config/database');

const getRun = async (activityId, eventTeamId) => {
    const rows = await query(
        'SELECT * FROM typing_race_runs WHERE activity_id = ? AND event_team_id = ?',
        [activityId, eventTeamId]
    );
    return rows[0] || null;
};

const getRunById = async (id) => {
    const rows = await query('SELECT * FROM typing_race_runs WHERE id = ?', [id]);
    return rows[0] || null;
};

const listRunsByActivity = async (activityId, { includePractice = false } = {}) => {
    const practiceFilter = includePractice ? '' : 'AND (tr.is_practice = 0 OR tr.is_practice IS NULL)';
    return query(`
        SELECT tr.*, et.name AS team_name, et.status AS team_status
        FROM typing_race_runs tr
        INNER JOIN event_teams et ON et.id = tr.event_team_id
        WHERE tr.activity_id = ? ${practiceFilter}
        ORDER BY tr.completion_time_ms ASC, tr.id ASC
    `, [activityId]);
};

const getPracticeRun = async (activityId, eventTeamId) => {
    const rows = await query(
        'SELECT * FROM typing_race_runs WHERE activity_id = ? AND event_team_id = ? AND is_practice = 1 LIMIT 1',
        [activityId, eventTeamId]
    );
    return rows[0] || null;
};

const createRun = async ({
    activity_id,
    event_team_id,
    started_at = null,
    is_practice = false,
    practice_mode = 'solo',
}) => {
    const result = await query(`
        INSERT INTO typing_race_runs (activity_id, event_team_id, started_at, is_practice, practice_mode)
        VALUES (?, ?, ?, ?, ?)
    `, [activity_id, event_team_id, started_at, is_practice ? 1 : 0, practice_mode]);
    return getRunById(result.insertId);
};

const resetPracticeRun = async (activityId, eventTeamId) => {
    await query(
        'DELETE FROM typing_race_runs WHERE activity_id = ? AND event_team_id = ? AND is_practice = 1',
        [activityId, eventTeamId]
    );
};

const deleteRunsForTeam = async (activityId, eventTeamId) => {
    await query(
        'DELETE FROM typing_race_runs WHERE activity_id = ? AND event_team_id = ?',
        [activityId, eventTeamId]
    );
};

const updateRun = async (id, data) => {
    const fields = [];
    const params = [];

    const allowed = [
        'current_segment_index',
        'segment_typed_chars',
        'started_at',
        'finished_at',
        'completion_time_ms',
    ];
    for (const key of allowed) {
        if (data[key] !== undefined) {
            fields.push(`${key} = ?`);
            params.push(data[key]);
        }
    }

    if (!fields.length) {
        return getRunById(id);
    }

    params.push(id);
    await query(`UPDATE typing_race_runs SET ${fields.join(', ')} WHERE id = ?`, params);
    return getRunById(id);
};

const createSubmission = async ({ activity_id, user_id, team_id = null, content, score = 0 }) => {
    const result = await query(`
        INSERT INTO submissions (activity_id, user_id, team_id, content, score)
        VALUES (?, ?, ?, ?, ?)
    `, [activity_id, user_id, team_id, JSON.stringify(content), score]);
    return { id: result.insertId };
};

const countRuns = async (activityId) => {
    const rows = await query(
        'SELECT COUNT(*) AS cnt FROM typing_race_runs WHERE activity_id = ? AND (is_practice = 0 OR is_practice IS NULL)',
        [activityId]
    );
    return Number(rows[0]?.cnt ?? 0);
};

const countFinishedRuns = async (activityId) => {
    const rows = await query(
        'SELECT COUNT(*) AS cnt FROM typing_race_runs WHERE activity_id = ? AND finished_at IS NOT NULL AND (is_practice = 0 OR is_practice IS NULL)',
        [activityId]
    );
    return Number(rows[0]?.cnt ?? 0);
};

module.exports = {
    getRun,
    getRunById,
    listRunsByActivity,
    getPracticeRun,
    createRun,
    resetPracticeRun,
    deleteRunsForTeam,
    updateRun,
    createSubmission,
    countFinishedRuns,
    countRuns,
};
