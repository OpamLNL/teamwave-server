import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(__dirname, '../src/seed');
const presets = JSON.parse(
    fs.readFileSync(path.join(seedDir, 'data/typingRacePresets.json'), 'utf8')
);

function readJson(name) {
    return JSON.parse(fs.readFileSync(path.join(seedDir, name), 'utf8'));
}

function writeJson(name, data) {
    fs.writeFileSync(path.join(seedDir, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    console.log(`✓ ${name}`);
}

const relayFour = { timer_seconds: 300, ...presets.relayFour };
const relayThree = { timer_seconds: 240, ...presets.relayThree };
const sprintSolo = { timer_seconds: 90, ...presets.sprintSolo };

// --- templates ---
const templates = readJson('event_templates.json');
templates.find((t) => t.id === 9).name = 'Typing Sprint (solo)';
templates.find((t) => t.id === 9).description =
    'Індивідуальний швидкісний набір тексту — розігрів перед командним relay.';

if (!templates.find((t) => t.id === 16)) {
    templates.push({
        id: 16,
        name: 'Командний Typing Relay',
        description:
            'Команди змагаються: кожен гравець друкує слова свого кольору по черзі. Рейтинг команд за часом.',
        category: 'game',
        event_type: 'game',
        is_public: true,
    });
}

if (!templates.find((t) => t.id === 17)) {
    templates.push({
        id: 17,
        name: 'Typing Cup (3×3)',
        description: 'Короткий командний relay на 3 гравців — формат кубка між named-командами.',
        category: 'game',
        event_type: 'game',
        is_public: true,
    });
}
writeJson('event_templates.json', templates);

// --- template activities ---
const templateActivities = readJson('template_activities.json');
const ta14 = templateActivities.find((a) => a.id === 14);
if (ta14) {
    ta14.title = 'Solo Sprint';
    ta14.settings = sprintSolo;
}

if (!templateActivities.find((a) => a.id === 17)) {
    templateActivities.push({
        id: 17,
        template_id: 16,
        title: 'Командний relay (4 гравці)',
        type: 'typing_race',
        settings: relayFour,
        order_index: 1,
    });
}

if (!templateActivities.find((a) => a.id === 18)) {
    templateActivities.push({
        id: 18,
        template_id: 17,
        title: 'Typing Cup Relay (3 гравці)',
        type: 'typing_race',
        settings: relayThree,
        order_index: 1,
    });
}
writeJson('template_activities.json', templateActivities);

// --- events ---
const events = readJson('events.json');
if (!events.find((e) => e.id === 19)) {
    events.push({
        id: 19,
        title: 'NovaTech Typing Cup 2026',
        description:
            'Корпоративний кубок з командного typing relay. 4 команди, 4 гравці в кожній — хто швидше набере текст.',
        start_time: '2026-04-12 15:00:00',
        duration_minutes: 50,
        status: 'finished',
        type: 'game',
        organizer_id: 2,
        host_id: 3,
        max_participants: 16,
        is_public: true,
        template_id: 16,
        join_code: 'TYPE26',
    });
}

if (!events.find((e) => e.id === 20)) {
    events.push({
        id: 20,
        title: 'Demo Keyboard Relay',
        description: 'Демо-захід формату Typing Cup між трьома командами по 3 гравці.',
        start_time: '2026-03-05 11:00:00',
        duration_minutes: 40,
        status: 'finished',
        type: 'game',
        organizer_id: 2,
        host_id: 3,
        max_participants: 12,
        is_public: true,
        template_id: 17,
        join_code: 'KEYBD3',
    });
}
writeJson('events.json', events);

// --- activities ---
const activities = readJson('activities.json');
if (!activities.find((a) => a.id === 21)) {
    activities.push({
        id: 21,
        event_id: 19,
        title: 'Фінал: командний relay',
        type: 'typing_race',
        settings: relayFour,
        order_index: 1,
        is_active: false,
        started_at: '2026-04-12 15:10:00',
        ended_at: '2026-04-12 15:45:00',
    });
}

if (!activities.find((a) => a.id === 22)) {
    activities.push({
        id: 22,
        event_id: 20,
        title: 'Typing Cup — фінал',
        type: 'typing_race',
        settings: relayThree,
        order_index: 1,
        is_active: false,
        started_at: '2026-03-05 11:05:00',
        ended_at: '2026-03-05 11:35:00',
    });
}
writeJson('activities.json', activities);

// --- participants ---
const participants = readJson('event_participants.json');
let nextParticipantId = Math.max(...participants.map((p) => p.id), 0) + 1;

const event19Teams = [
    { team_id: 1, users: [4, 5, 6] },
    { team_id: 2, users: [7, 8, 9] },
    { team_id: 3, users: [12, 13, 14] },
    { team_id: 6, users: [15, 10, 11] },
];

const event20Teams = [
    { team_id: 4, users: [4, 5, 6] },
    { team_id: 5, users: [7, 8, 9] },
    { team_id: 7, users: [12, 13, 14] },
];

function ensureParticipants(eventId, teamDefs) {
    teamDefs.forEach(({ team_id, users }) => {
        users.forEach((user_id) => {
            const exists = participants.some(
                (p) => p.event_id === eventId && p.user_id === user_id && p.team_id === team_id
            );
            if (exists) return;
            participants.push({
                id: nextParticipantId++,
                event_id: eventId,
                user_id,
                team_id,
                role_in_event: 'participant',
                score: 0,
            });
        });
    });
}

if (!participants.some((p) => p.event_id === 19)) {
    ensureParticipants(19, event19Teams);
}
if (!participants.some((p) => p.event_id === 20)) {
    ensureParticipants(20, event20Teams);
}
writeJson('event_participants.json', participants);

// --- team result submissions ---
const submissions = readJson('submissions.json');
let nextSubmissionId = Math.max(...submissions.map((s) => s.id), 0) + 1;

const teamResults19 = [
    { team_id: 1, team_name: 'Nova Alpha', completion_time_ms: 154500, rank: 1 },
    { team_id: 2, team_name: 'Nova Beta', completion_time_ms: 161200, rank: 2 },
    { team_id: 6, team_name: 'Cloud Core', completion_time_ms: 168000, rank: 3 },
    { team_id: 3, team_name: 'Nova Gamma', completion_time_ms: 175800, rank: 4 },
];

const teamResults20 = [
    { team_id: 4, team_name: 'Demo Squad A', completion_time_ms: 132400, rank: 1 },
    { team_id: 7, team_name: 'Cloud UX', completion_time_ms: 139100, rank: 2 },
    { team_id: 5, team_name: 'Demo Squad B', completion_time_ms: 145600, rank: 3 },
];

function ensureTeamSubmission(activityId, captainUserId, result) {
    const exists = submissions.some(
        (s) => s.activity_id === activityId && s.team_id === result.team_id
            && s.content?.type === 'typing_race_team_result'
    );
    if (exists) return;

    submissions.push({
        id: nextSubmissionId++,
        activity_id: activityId,
        user_id: captainUserId,
        team_id: result.team_id,
        content: {
            type: 'typing_race_team_result',
            team_name: result.team_name,
            completion_time_ms: result.completion_time_ms,
            rank: result.rank,
            mode: 'team_relay',
        },
        score: Math.max(0, 200000 - result.completion_time_ms),
    });
}

if (!submissions.some((s) => s.activity_id === 21)) {
    teamResults19.forEach((r, i) => {
        ensureTeamSubmission(21, event19Teams[i].users[0], r);
    });
}

if (!submissions.some((s) => s.activity_id === 22)) {
    teamResults20.forEach((r, i) => {
        ensureTeamSubmission(22, event20Teams[i].users[0], r);
    });
}
writeJson('submissions.json', submissions);

console.log('\nTyping race seeds оновлено. Запусти: npm run db:reset');
