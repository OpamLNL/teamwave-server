const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

function getSeedPath(jsonFile) {
    const pathFromSrc = path.join(__dirname, '../seed', jsonFile);
    const pathFromRoot = path.join(__dirname, '../../seed', jsonFile);

    if (fs.existsSync(pathFromSrc)) return pathFromSrc;
    if (fs.existsSync(pathFromRoot)) return pathFromRoot;

    throw new Error(`Не знайдено seed файл: ${jsonFile}`);
}

function seedExists(jsonFile) {
    const pathFromSrc = path.join(__dirname, '../seed', jsonFile);
    const pathFromRoot = path.join(__dirname, '../../seed', jsonFile);

    return fs.existsSync(pathFromSrc) || fs.existsSync(pathFromRoot);
}

async function dropTables() {
    console.log('🧨 Dropping tables...');

    await query('SET FOREIGN_KEY_CHECKS = 0');

    await query(`
        DROP TABLE IF EXISTS
            user_badges,
            badges,
            feedback,
            leaderboard_entries,
            submissions,
            activity_questions,
            typing_race_runs,
            event_team_members,
            event_teams,
            activities,
            event_participants,
            events,
            template_activities,
            event_templates,
            team_members,
            teams,
            companies,
            notifications,
            contact_messages,
            likes,
            favorites,
            comments,
            reports,
            chapters,
            work_images,
            post_tags,
            work_tags,
            posts,
            works,
            tags,
            fandom_catalog_tag_links,
            fandom_catalog_tags,
            fandoms,
            users
    `);

    await query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Tables dropped');
}

async function createTables() {
    console.log('📦 Creating TeamWave tables...');

    await query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            firebase_uid VARCHAR(128) UNIQUE,
            email VARCHAR(255),
            name VARCHAR(255) NOT NULL,
            avatar_url TEXT,
            role ENUM('participant', 'host', 'organizer', 'admin') DEFAULT 'participant',
            bio TEXT,
            company VARCHAR(255),
            position VARCHAR(255),
            timezone VARCHAR(64) DEFAULT 'Europe/Kyiv',
            interests JSON,
            points INT NOT NULL DEFAULT 0,
            level INT NOT NULL DEFAULT 1,
            is_blocked BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_users_role (role),
            INDEX idx_users_points (points DESC)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS companies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS teams (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            company_id INT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
            INDEX idx_teams_company (company_id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS team_members (
            team_id INT NOT NULL,
            user_id INT NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (team_id, user_id),
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS event_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100) NOT NULL,
            event_type ENUM(
                'icebreaker',
                'quiz',
                'game',
                'challenge',
                'collaborative',
                'creative',
                'wellness',
                'hybrid',
                'themed',
                'combined'
            ) NOT NULL DEFAULT 'combined',
            is_public BOOLEAN DEFAULT TRUE,
            icon VARCHAR(16) NULL DEFAULT NULL,
            cover_url TEXT NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS template_activities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            template_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            type ENUM(
                'poll',
                'quiz',
                'bingo',
                'scavenger',
                'this_or_that',
                'typing_race',
                'balloon_pop',
                'open_text',
                'photo_upload'
            ) NOT NULL,
            settings JSON,
            order_index INT NOT NULL DEFAULT 0,
            FOREIGN KEY (template_id) REFERENCES event_templates(id) ON DELETE CASCADE,
            INDEX idx_template_activities_template (template_id, order_index)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            start_time DATETIME NOT NULL,
            duration_minutes INT NOT NULL DEFAULT 60,
            status ENUM('draft', 'planned', 'active', 'finished') NOT NULL DEFAULT 'draft',
            type ENUM(
                'icebreaker',
                'quiz',
                'game',
                'challenge',
                'collaborative',
                'creative',
                'wellness',
                'hybrid',
                'themed',
                'combined'
            ) NOT NULL DEFAULT 'combined',
            organizer_id INT NOT NULL,
            host_id INT NOT NULL,
            max_participants INT NOT NULL DEFAULT 50,
            is_public BOOLEAN DEFAULT FALSE,
            template_id INT NULL,
            join_code VARCHAR(16) NOT NULL UNIQUE,
            icon VARCHAR(16) NULL DEFAULT NULL,
            cover_url TEXT NULL DEFAULT NULL,
            cover_delete_url TEXT NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE RESTRICT,
            FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE RESTRICT,
            FOREIGN KEY (template_id) REFERENCES event_templates(id) ON DELETE SET NULL,
            INDEX idx_events_status (status),
            INDEX idx_events_start (start_time),
            INDEX idx_events_join_code (join_code)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS event_participants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            user_id INT NOT NULL,
            team_id INT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            role_in_event ENUM('participant', 'host') NOT NULL DEFAULT 'participant',
            score INT NOT NULL DEFAULT 0,
            feedback TEXT NULL,
            UNIQUE KEY uniq_event_user (event_id, user_id),
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
            INDEX idx_event_participants_event (event_id),
            INDEX idx_event_participants_score (event_id, score DESC)
        )
    `);

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

    await query(`
        CREATE TABLE IF NOT EXISTS activities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            type ENUM(
                'poll',
                'quiz',
                'bingo',
                'scavenger',
                'this_or_that',
                'typing_race',
                'balloon_pop',
                'open_text',
                'photo_upload'
            ) NOT NULL,
            settings JSON,
            order_index INT NOT NULL DEFAULT 0,
            is_active BOOLEAN DEFAULT FALSE,
            started_at TIMESTAMP NULL DEFAULT NULL,
            ended_at TIMESTAMP NULL DEFAULT NULL,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            INDEX idx_activities_event (event_id, order_index)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS activity_questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            activity_id INT NOT NULL,
            question TEXT NOT NULL,
            options JSON,
            correct_answer VARCHAR(255) NULL,
            question_type ENUM('single', 'multiple', 'open') NOT NULL DEFAULT 'single',
            order_index INT NOT NULL DEFAULT 0,
            FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
            INDEX idx_activity_questions_activity (activity_id, order_index)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            activity_id INT NOT NULL,
            user_id INT NOT NULL,
            team_id INT NULL,
            content JSON NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            score INT NOT NULL DEFAULT 0,
            FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
            INDEX idx_submissions_activity (activity_id),
            INDEX idx_submissions_user (user_id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS leaderboard_entries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            user_id INT NOT NULL,
            team_id INT NULL,
            points INT NOT NULL DEFAULT 0,
            rank_position INT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_leaderboard_event_user (event_id, user_id),
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
            INDEX idx_leaderboard_event (event_id, points DESC),
            INDEX idx_leaderboard_event_team (event_id, team_id, points DESC)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            user_id INT NOT NULL,
            rating TINYINT NOT NULL,
            comment TEXT,
            nps_score TINYINT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_feedback_event_user (event_id, user_id),
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS badges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(64) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon VARCHAR(32) NOT NULL DEFAULT '🏅'
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS user_badges (
            user_id INT NOT NULL,
            badge_id INT NOT NULL,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, badge_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
        )
    `);

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

    await query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            actor_id INT NULL,
            type ENUM(
                'event_invite',
                'activity_started',
                'activity_ended',
                'score_update',
                'feedback_request',
                'team_invite',
                'system'
            ) NOT NULL,
            target_type ENUM('event', 'activity', 'team', 'user') NULL,
            target_id INT NULL,
            preview TEXT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_notifications_user (user_id, is_read, created_at)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            target_type ENUM('event', 'activity', 'submission') NOT NULL,
            target_id INT NOT NULL,
            content TEXT NOT NULL,
            status ENUM('active', 'hidden', 'blocked') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_comments_target (target_type, target_id, created_at)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS likes (
            user_id INT NOT NULL,
            target_type ENUM('event', 'activity', 'submission', 'comment') NOT NULL,
            target_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, target_type, target_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_likes_target (target_type, target_id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS favorites (
            user_id INT NOT NULL,
            target_type ENUM('event', 'template', 'activity') NOT NULL,
            target_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, target_type, target_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_favorites_target (target_type, target_id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ TeamWave tables created');
}

function serializeSeedValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
}

async function loadData(tableName, jsonFile) {
    const dataPath = getSeedPath(jsonFile);
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const items = JSON.parse(rawData);

    for (const item of items) {
        const keys = Object.keys(item);
        const values = Object.values(item).map(serializeSeedValue);
        const placeholders = keys.map(() => '?').join(', ');

        await query(
            `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
            values
        );
    }

    console.log(`✅ ${tableName}: ${items.length} records`);
}

async function seedDatabase() {
    console.log('🌱 Seeding TeamWave database...');

    await loadData('users', 'users.json');
    await loadData('companies', 'companies.json');
    await loadData('teams', 'teams.json');
    await loadData('team_members', 'team_members.json');
    await loadData('badges', 'badges.json');
    await loadData('user_badges', 'user_badges.json');
    await loadData('event_templates', 'event_templates.json');
    await loadData('template_activities', 'template_activities.json');
    await loadData('events', 'events.json');
    await loadData('event_participants', 'event_participants.json');
    await loadData('activities', 'activities.json');
    await loadData('activity_questions', 'activity_questions.json');
    await loadData('submissions', 'submissions.json');
    await loadData('comments', 'comments.json');
    await loadData('likes', 'likes.json');
    await loadData('favorites', 'favorites.json');
    await loadData('leaderboard_entries', 'leaderboard_entries.json');
    await loadData('feedback', 'feedback.json');
    await loadData('contact_messages', 'contact_messages.json');

    if (seedExists('notifications.json')) {
        await loadData('notifications', 'notifications.json');
    }

    console.log('✅ TeamWave database seeded');
}

async function init(options = { drop: true, seed: true }) {
    try {
        if (options.drop) {
            await dropTables();
        }

        await createTables();

        if (options.seed) {
            await seedDatabase();
        }

        console.log('🚀 TeamWave database initialized successfully');

        if (require.main === module) {
            process.exit(0);
        }
    } catch (err) {
        console.error('❌ Error during database initialization:', err);

        if (require.main === module) {
            process.exit(1);
        }

        throw err;
    }
}

module.exports = init;

if (require.main === module) {
    init({ drop: true, seed: true });
}
