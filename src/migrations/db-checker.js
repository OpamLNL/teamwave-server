const { query } = require('../config/database');
const init = require('./init-db');

const REQUIRED_TABLES = [
    'users',
    'companies',
    'teams',
    'team_members',
    'event_templates',
    'template_activities',
    'events',
    'event_participants',
    'activities',
    'activity_questions',
    'submissions',
    'comments',
    'likes',
    'favorites',
    'leaderboard_entries',
    'feedback',
    'badges',
    'user_badges',
    'notifications',
    'teammate_requests',
    'event_teams',
    'event_team_members',
    'typing_race_runs',
];

const LEGACY_TABLES = [
    'fandoms',
    'works',
    'posts',
    'tags',
    'user_follows',
];

async function checkAndInitDatabase() {
    try {
        const rows = await query(
            'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
            [process.env.DB_DATABASE]
        );

        const existing = rows.map((row) => row.TABLE_NAME || row.table_name);
        const missing = REQUIRED_TABLES.filter((table) => !existing.includes(table));
        const hasLegacySchema = LEGACY_TABLES.some((table) => existing.includes(table));

        if (missing.length > 0) {
            console.log(`🧱 Missing TeamWave tables: ${missing.join(', ')} — running init...`);
            await init({ drop: hasLegacySchema, seed: false });
        } else {
            console.log('✅ TeamWave schema is up to date.');
        }

        const { ensureTeammatesSchema } = require('./add-teammates');
        await ensureTeammatesSchema();

        const { ensureTypingRaceSchema } = require('./add-typing-race');
        await ensureTypingRaceSchema();

        const { ensureEventMediaSchema } = require('./add-event-media');
        await ensureEventMediaSchema();
    } catch (err) {
        console.error('❌ DB CHECK ERROR:', err);
        throw err;
    }
}

module.exports = { checkAndInitDatabase };
