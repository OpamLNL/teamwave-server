import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(__dirname, '../src/seed');

function writeSeed(name, data) {
    fs.writeFileSync(path.join(seedDir, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    console.log(`✓ ${name}: ${data.length} records`);
}

const users = [
    { id: 1, firebase_uid: 'tw-admin-001', email: 'admin@teamwave.demo', name: 'Олена Коваленко', avatar_url: 'https://i.pravatar.cc/150?img=1', role: 'admin', bio: 'Адміністратор платформи TeamWave.', company: 'TeamWave', position: 'Platform Admin', timezone: 'Europe/Kyiv', interests: ['facilitation', 'product', 'analytics'], points: 1200, level: 5 },
    { id: 2, firebase_uid: 'tw-org-001', email: 'organizer@teamwave.demo', name: 'Андрій Мельник', avatar_url: 'https://i.pravatar.cc/150?img=2', role: 'organizer', bio: 'Організую корпоративні тімбілдинги для IT-команд.', company: 'NovaTech', position: 'HR Business Partner', timezone: 'Europe/Kyiv', interests: ['team building', 'leadership', 'games'], points: 860, level: 4 },
    { id: 3, firebase_uid: 'tw-host-001', email: 'host@teamwave.demo', name: 'Марія Шевченко', avatar_url: 'https://i.pravatar.cc/150?img=3', role: 'host', bio: 'Ведуча інтерактивних заходів і квізів.', company: 'NovaTech', position: 'Event Host', timezone: 'Europe/Kyiv', interests: ['quizzes', 'icebreakers', 'public speaking'], points: 640, level: 3 },
    { id: 4, firebase_uid: 'tw-user-001', email: 'dmytro@teamwave.demo', name: 'Дмитро Бондар', avatar_url: 'https://i.pravatar.cc/150?img=4', role: 'participant', bio: 'Backend developer, люблю квізи та scavenger hunt.', company: 'NovaTech', position: 'Backend Developer', timezone: 'Europe/Kyiv', interests: ['coding', 'board games', 'coffee'], points: 420, level: 2 },
    { id: 5, firebase_uid: 'tw-user-002', email: 'kateryna@teamwave.demo', name: 'Катерина Лисенко', avatar_url: 'https://i.pravatar.cc/150?img=5', role: 'participant', bio: 'UX designer, ціную креативні активності.', company: 'NovaTech', position: 'UX Designer', timezone: 'Europe/Kyiv', interests: ['design', 'photography', 'travel'], points: 510, level: 3 },
    { id: 6, firebase_uid: 'tw-user-003', email: 'ivan@teamwave.demo', name: 'Іван Петренко', avatar_url: 'https://i.pravatar.cc/150?img=6', role: 'participant', bio: 'QA engineer, люблю командні змагання.', company: 'NovaTech', position: 'QA Engineer', timezone: 'Europe/Kyiv', interests: ['testing', 'football', 'music'], points: 380, level: 2 },
    { id: 7, firebase_uid: 'tw-user-004', email: 'sofia@teamwave.demo', name: 'Софія Гриценко', avatar_url: 'https://i.pravatar.cc/150?img=7', role: 'participant', bio: 'Project manager, фанатка icebreaker-активностей.', company: 'NovaTech', position: 'Project Manager', timezone: 'Europe/Kyiv', interests: ['planning', 'books', 'yoga'], points: 455, level: 2 },
    { id: 8, firebase_uid: 'tw-user-005', email: 'taras@teamwave.demo', name: 'Тарас Сидоренко', avatar_url: 'https://i.pravatar.cc/150?img=8', role: 'participant', bio: 'DevOps engineer, люблю швидкі ігри.', company: 'NovaTech', position: 'DevOps Engineer', timezone: 'Europe/Kyiv', interests: ['automation', 'hiking', 'chess'], points: 395, level: 2 },
    { id: 9, firebase_uid: 'tw-user-006', email: 'natalia@teamwave.demo', name: 'Наталія Біла', avatar_url: 'https://i.pravatar.cc/150?img=9', role: 'participant', bio: 'Frontend developer, люблю typing race.', company: 'CloudBridge', position: 'Frontend Developer', timezone: 'Europe/Kyiv', interests: ['react', 'running', 'podcasts'], points: 340, level: 2 },
    { id: 10, firebase_uid: 'tw-host-002', email: 'yuriy@teamwave.demo', name: 'Юрій Кравченко', avatar_url: 'https://i.pravatar.cc/150?img=10', role: 'host', bio: 'Фасилітатор wellness та creative форматів.', company: 'CloudBridge', position: 'Culture Lead', timezone: 'Europe/Kyiv', interests: ['wellness', 'art', 'facilitation'], points: 720, level: 4 },
    { id: 11, firebase_uid: 'tw-org-002', email: 'viktoria@teamwave.demo', name: 'Вікторія Мороз', avatar_url: 'https://i.pravatar.cc/150?img=11', role: 'organizer', bio: 'Організує заходи для distributed-команд.', company: 'DataPulse', position: 'People Ops Manager', timezone: 'Europe/Kyiv', interests: ['analytics', 'events', 'coaching'], points: 790, level: 4 },
    { id: 12, firebase_uid: 'tw-user-007', email: 'bogdan@teamwave.demo', name: 'Богдан Романюк', avatar_url: 'https://i.pravatar.cc/150?img=12', role: 'participant', bio: 'Data analyst, цінує quiz-формати.', company: 'DataPulse', position: 'Data Analyst', timezone: 'Europe/Kyiv', interests: ['sql', 'chess', 'cinema'], points: 410, level: 2 },
    { id: 13, firebase_uid: 'tw-user-008', email: 'yana@teamwave.demo', name: 'Яна Кузнецова', avatar_url: 'https://i.pravatar.cc/150?img=13', role: 'participant', bio: 'Marketing specialist, любить creative challenges.', company: 'DataPulse', position: 'Marketing Specialist', timezone: 'Europe/Kyiv', interests: ['branding', 'yoga', 'travel'], points: 365, level: 2 },
    { id: 14, firebase_uid: 'tw-user-009', email: 'maxim@teamwave.demo', name: 'Максим Гончар', avatar_url: 'https://i.pravatar.cc/150?img=14', role: 'participant', bio: 'Mobile developer, активний у scavenger hunt.', company: 'PixelForge', position: 'Mobile Developer', timezone: 'Europe/Kyiv', interests: ['flutter', 'cycling', 'coffee'], points: 430, level: 2 },
    { id: 15, firebase_uid: 'tw-user-010', email: 'lilia@teamwave.demo', name: 'Лілія Ткаченко', avatar_url: 'https://i.pravatar.cc/150?img=15', role: 'participant', bio: 'Support lead, любить bingo та poll.', company: 'PixelForge', position: 'Support Lead', timezone: 'Europe/Kyiv', interests: ['helpdesk', 'reading', 'baking'], points: 290, level: 1 },
];

const companyNames = [
    ['NovaTech', 'IT-компанія, яка проводить регулярні віддалені тімбілдинги для distributed-команд.'],
    ['TeamWave Demo Org', 'Демо-організація для тестування шаблонів і сценаріїв TeamWave.'],
    ['CloudBridge', 'Хмарні рішення та DevOps-консалтинг для enterprise-клієнтів.'],
    ['DataPulse', 'Аналітика та BI для продуктових команд.'],
    ['PixelForge', 'Студія мобільної та веб-розробки.'],
    ['GreenLogic', 'GreenTech стартап з фокусом на sustainability.'],
    ['FinEdge', 'Fintech-команда з distributed-офісами в Європі.'],
    ['MedSync', 'HealthTech платформа для клінік.'],
    ['EduSpark', 'EdTech продукт для корпоративного навчання.'],
    ['LogiTrack', 'Логістична SaaS-платформа.'],
    ['CyberShield', 'Кібербезпека та penetration testing.'],
    ['AgroSmart', 'AgriTech рішення для фермерських кооперативів.'],
    ['RetailWave', 'E-commerce та omnichannel retail.'],
    ['LegalFlow', 'LegalTech для юридичних відділів.'],
    ['TravelNest', 'TravelTech для корпоративних поїздок.'],
];

const companies = companyNames.map(([name, description], i) => ({ id: i + 1, name, description }));

const teamDefs = [
    [1, 'Nova Alpha', 'Команда розробки платформи.'],
    [1, 'Nova Beta', 'Команда продукту та дизайну.'],
    [1, 'Nova Gamma', 'Команда інфраструктури та DevOps.'],
    [2, 'Demo Squad A', 'Перша демо-команда для тестів.'],
    [2, 'Demo Squad B', 'Друга демо-команда для тестів.'],
    [3, 'Cloud Core', 'Backend та cloud engineering.'],
    [3, 'Cloud UX', 'Дизайн і frontend CloudBridge.'],
    [4, 'Data Insights', 'Аналітики та data engineers.'],
    [4, 'Data Growth', 'Маркетинг і growth DataPulse.'],
    [5, 'Pixel Mobile', 'iOS та Android розробка.'],
    [5, 'Pixel Web', 'Web та design система.'],
    [6, 'Green Labs', 'R&D GreenLogic.'],
    [7, 'Fin Payments', 'Платіжний стек FinEdge.'],
    [8, 'Med Platform', 'Core platform MedSync.'],
    [9, 'Edu Content', 'Контент і методологія EduSpark.'],
];

const teams = teamDefs.map(([company_id, name, description], i) => ({
    id: i + 1,
    name,
    company_id,
    description,
}));

const teamMembers = [
    { team_id: 1, user_id: 4 }, { team_id: 1, user_id: 6 }, { team_id: 1, user_id: 8 },
    { team_id: 2, user_id: 5 }, { team_id: 2, user_id: 7 }, { team_id: 2, user_id: 3 },
    { team_id: 3, user_id: 8 }, { team_id: 3, user_id: 14 },
    { team_id: 4, user_id: 1 }, { team_id: 4, user_id: 2 },
    { team_id: 5, user_id: 9 }, { team_id: 5, user_id: 10 },
    { team_id: 6, user_id: 9 }, { team_id: 6, user_id: 14 },
    { team_id: 7, user_id: 12 }, { team_id: 7, user_id: 13 },
    { team_id: 8, user_id: 11 }, { team_id: 8, user_id: 13 },
    { team_id: 9, user_id: 14 }, { team_id: 9, user_id: 15 },
    { team_id: 10, user_id: 6 }, { team_id: 11, user_id: 4 },
    { team_id: 12, user_id: 5 }, { team_id: 13, user_id: 7 },
];

const badgeDefs = [
    ['first_event', 'Перший захід', 'Участь у першому тімбілдинговому заході.', '🎯'],
    ['quiz_master', 'Майстер квізів', '100+ балів у квіз-активності.', '🧠'],
    ['team_player', 'Командний гравець', 'Активна участь у командному scavenger hunt.', '🤝'],
    ['host_star', 'Зірка ведучого', 'Проведено успішний захід з NPS 9+.', '⭐'],
    ['icebreaker_pro', 'Icebreaker Pro', '5+ icebreaker-активностей.', '❄️'],
    ['scavenger_hunter', 'Мисливець', '10+ фото у scavenger hunt.', '📸'],
    ['early_bird', 'Ранній пташка', 'Перший приєднався до заходу.', '🐦'],
    ['feedback_hero', 'Голос команди', 'Залишив детальний відгук.', '💬'],
    ['streak_3', 'Серія ×3', '3 заходи поспіль.', '🔥'],
    ['top_scorer', 'Лідер таблиці', 'Перше місце в лідерборді.', '🏆'],
    ['creative_mind', 'Креатив', 'Перемога у creative challenge.', '🎨'],
    ['wellness_warrior', 'Wellness', 'Участь у wellness-заході.', '🧘'],
    ['bingo_winner', 'Bingo!', 'Перший bingo у заході.', '🎱'],
    ['mentor', 'Наставник', 'Допоміг новачкам у onboarding.', '🎓'],
    ['veteran', 'Ветеран', '10+ завершених заходів.', '🎖️'],
];

const badges = badgeDefs.map(([code, name, description, icon], i) => ({ id: i + 1, code, name, description, icon }));

const userBadges = [
    { user_id: 4, badge_id: 1 }, { user_id: 5, badge_id: 1 }, { user_id: 6, badge_id: 1 },
    { user_id: 4, badge_id: 2 }, { user_id: 3, badge_id: 4 }, { user_id: 5, badge_id: 2 },
    { user_id: 7, badge_id: 5 }, { user_id: 8, badge_id: 3 }, { user_id: 9, badge_id: 7 },
    { user_id: 10, badge_id: 4 }, { user_id: 12, badge_id: 2 }, { user_id: 13, badge_id: 11 },
    { user_id: 14, badge_id: 6 }, { user_id: 15, badge_id: 8 }, { user_id: 6, badge_id: 10 },
];

const templateDefs = [
    ['Icebreaker Starter', '15-хвилинний розігрів для нових команд.', 'icebreaker', 'icebreaker'],
    ['Team Quiz Night', '45-хвилинний командний квіз.', 'quiz', 'quiz'],
    ['Virtual Scavenger Sprint', '60-хвилинний фото-скавенджер.', 'challenge', 'challenge'],
    ['Team Olympics Lite', 'Комбо: icebreaker → quiz → scavenger → poll.', 'combined', 'combined'],
    ['Wellness Check-in', 'Короткий wellness poll і дихальна вправа.', 'wellness', 'wellness'],
    ['Creative Collage', 'Спільна креативна активність.', 'creative', 'creative'],
    ['Onboarding Bingo', 'Bingo для нових співробітників.', 'game', 'game'],
    ['Leadership Dialogue', 'Open text для лідерів.', 'collaborative', 'collaborative'],
    ['Typing Race Sprint', 'Швидкісний typing race.', 'game', 'game'],
    ['Hybrid Town Hall', 'Poll + quiz для all-hands.', 'hybrid', 'hybrid'],
    ['Themed Halloween', 'Тематичний themed захід.', 'themed', 'themed'],
    ['Balloon Pop Fun', 'Balloon pop mini-game.', 'game', 'game'],
    ['Photo Story Hunt', 'Scavenger + open text.', 'challenge', 'challenge'],
    ['NPS Feedback Loop', 'Фінальний poll і NPS.', 'combined', 'combined'],
    ['Remote Picnic', 'Легкий combined для пікніку.', 'hybrid', 'hybrid'],
];

const eventTemplates = templateDefs.map(([name, description, category, event_type], i) => ({
    id: i + 1,
    name,
    description,
    category,
    event_type,
    is_public: true,
}));

const templateActivities = [
    { id: 1, template_id: 1, title: 'This or That', type: 'this_or_that', settings: { timer_seconds: 120 }, order_index: 1 },
    { id: 2, template_id: 1, title: 'Fun Facts Poll', type: 'poll', settings: { timer_seconds: 180 }, order_index: 2 },
    { id: 3, template_id: 2, title: 'Company Trivia Round 1', type: 'quiz', settings: { timer_seconds: 30, points_per_question: 10 }, order_index: 1 },
    { id: 4, template_id: 2, title: 'Pop Culture Round', type: 'quiz', settings: { timer_seconds: 30, points_per_question: 10 }, order_index: 2 },
    { id: 5, template_id: 3, title: 'Home Scavenger Hunt', type: 'scavenger', settings: { timer_seconds: 900, require_photo: true }, order_index: 1 },
    { id: 6, template_id: 4, title: 'Warm-up Poll', type: 'this_or_that', settings: { timer_seconds: 90 }, order_index: 1 },
    { id: 7, template_id: 4, title: 'Team Quiz', type: 'quiz', settings: { timer_seconds: 45 }, order_index: 2 },
    { id: 8, template_id: 4, title: 'Photo Challenge', type: 'scavenger', settings: { timer_seconds: 600 }, order_index: 3 },
    { id: 9, template_id: 4, title: 'Final Feedback Poll', type: 'poll', settings: { timer_seconds: 120 }, order_index: 4 },
    { id: 10, template_id: 5, title: 'Mood Check', type: 'poll', settings: { timer_seconds: 90 }, order_index: 1 },
    { id: 11, template_id: 6, title: 'Draw Your Mood', type: 'photo_upload', settings: { timer_seconds: 300 }, order_index: 1 },
    { id: 12, template_id: 7, title: 'Onboarding Bingo', type: 'bingo', settings: { timer_seconds: 600 }, order_index: 1 },
    { id: 13, template_id: 8, title: 'Leadership Prompt', type: 'open_text', settings: { timer_seconds: 240 }, order_index: 1 },
    { id: 14, template_id: 9, title: 'Typing Race', type: 'typing_race', settings: { timer_seconds: 120 }, order_index: 1 },
    { id: 15, template_id: 10, title: 'All-Hands Poll', type: 'poll', settings: { timer_seconds: 120 }, order_index: 1 },
    { id: 16, template_id: 11, title: 'Costume Vote', type: 'poll', settings: { timer_seconds: 90 }, order_index: 1 },
    { id: 17, template_id: 12, title: 'Balloon Pop', type: 'balloon_pop', settings: { timer_seconds: 180 }, order_index: 1 },
    { id: 18, template_id: 13, title: 'Story Photo Hunt', type: 'scavenger', settings: { timer_seconds: 720 }, order_index: 1 },
];

const eventDefs = [
    [1, 'NovaTech Team Olympics', 'Комбінований тімбілдинг: icebreaker, quiz, scavenger та poll.', '2026-06-15 14:00:00', 75, 'planned', 'combined', 2, 3, 30, false, 4, 'NOVA26'],
    [2, 'Friday Icebreaker Sprint', 'Короткий розігрів для нової підкоманди.', '2026-05-20 10:00:00', 30, 'finished', 'icebreaker', 2, 3, 20, true, 1, 'ICE520'],
    [3, 'Q1 All-Hands Quiz', 'Квартальний квіз для всієї компанії.', '2026-03-10 16:00:00', 60, 'finished', 'quiz', 2, 3, 50, true, 2, 'Q1QUIZ'],
    [4, 'Winter Wellness Hour', 'Wellness check-in та легкий poll.', '2026-01-22 11:00:00', 45, 'finished', 'wellness', 11, 10, 25, false, 5, 'WELL26'],
    [5, 'New Year Bingo Party', 'Святковий bingo для distributed-команди.', '2025-12-28 15:00:00', 40, 'finished', 'game', 2, 3, 35, true, 7, 'NYBING'],
    [6, 'Remote Onboarding Day', 'Знайомство новачків через bingo та poll.', '2025-11-15 10:00:00', 50, 'finished', 'game', 11, 10, 20, false, 7, 'ONBD25'],
    [7, 'Halloween Creative Challenge', 'Тематичний creative та costume vote.', '2025-10-31 18:00:00', 55, 'finished', 'themed', 11, 10, 30, true, 11, 'HAL25X'],
    [8, 'Summer Scavenger 2025', 'Літній photo scavenger для команд.', '2025-08-14 14:00:00', 70, 'finished', 'challenge', 2, 3, 40, true, 3, 'SUM825'],
    [9, 'Spring Kickoff 2025', 'Старт сезону: icebreaker + quiz.', '2025-04-02 13:00:00', 65, 'finished', 'hybrid', 2, 3, 45, true, 10, 'SPR425'],
    [10, 'Design Sprint Icebreaker', 'Швидкий icebreaker перед design sprint.', '2025-06-05 09:30:00', 25, 'finished', 'icebreaker', 2, 3, 15, false, 1, 'DSICE5'],
    [11, 'DevOps Quiz Marathon', 'Технічний квіз для інфра-команди.', '2025-09-18 17:00:00', 50, 'finished', 'quiz', 11, 10, 25, false, 2, 'DEVQ25'],
    [12, 'PM Collaboration Workshop', 'Collaborative open text для PM-ів.', '2026-07-08 12:00:00', 90, 'planned', 'collaborative', 11, 10, 20, false, 8, 'PMWORK'],
    [13, 'UX Research Games', 'This or That та poll для UX-команди.', '2026-08-20 15:00:00', 45, 'planned', 'icebreaker', 2, 3, 18, true, 1, 'UXGAME'],
    [14, 'Company Virtual Picnic', 'Легкий hybrid для всієї компанії.', '2026-09-12 13:00:00', 60, 'planned', 'hybrid', 2, 3, 100, true, 15, 'PICNIC'],
    [15, 'Leadership Retreat Online', 'Open text та poll для лідерів.', '2026-10-03 10:00:00', 120, 'planned', 'collaborative', 11, 10, 15, false, 8, 'LEADRT'],
    [16, 'QA Bug Hunt Fun', 'Чернетка quiz для QA-команди.', '2026-11-01 16:00:00', 40, 'draft', 'quiz', 2, 3, 20, false, 2, 'QABUG1'],
    [17, 'Live TeamWave Demo', 'Демо активного заходу в реальному часі.', '2026-06-09 14:00:00', 45, 'active', 'combined', 1, 3, 25, true, 4, 'LIVE09'],
    [18, 'Beta Client Pilot', 'Пілот для клієнта CloudBridge.', '2026-06-28 11:00:00', 60, 'planned', 'combined', 11, 10, 30, false, 4, 'BETAP1'],
];

const events = eventDefs.map(([id, title, description, start_time, duration_minutes, status, type, organizer_id, host_id, max_participants, is_public, template_id, join_code]) => ({
    id, title, description, start_time, duration_minutes, status, type, organizer_id, host_id, max_participants, is_public, template_id, join_code,
}));

const participantPool = [4, 5, 6, 7, 8, 9, 12, 13, 14, 15];
const teamForUser = { 4: 1, 5: 2, 6: 1, 7: 2, 8: 1, 9: 5, 12: 7, 13: 8, 14: 9, 15: 9 };

let epId = 1;
const eventParticipants = [];

for (const event of events) {
    eventParticipants.push({
        id: epId++,
        event_id: event.id,
        user_id: event.host_id,
        team_id: null,
        role_in_event: 'host',
        score: event.status === 'finished' ? 0 : 0,
    });

    const count = event.status === 'draft' ? 2 : event.status === 'planned' ? 4 : 6;
    for (let i = 0; i < count && i < participantPool.length; i++) {
        const userId = participantPool[i];
        eventParticipants.push({
            id: epId++,
            event_id: event.id,
            user_id: userId,
            team_id: teamForUser[userId] || null,
            role_in_event: 'participant',
            score: event.status === 'finished' ? 60 + i * 7 + (event.id % 5) : 0,
        });
    }
}

const activityDefs = [
    [1, 1, 'Warm-up: This or That', 'this_or_that', 1, false, null, null],
    [2, 1, 'Team Quiz', 'quiz', 2, false, null, null],
    [3, 1, 'Photo Scavenger Hunt', 'scavenger', 3, false, null, null],
    [4, 1, 'Final Mood Poll', 'poll', 4, false, null, null],
    [5, 2, 'Coffee or Tea?', 'this_or_that', 1, false, '2026-05-20 10:05:00', '2026-05-20 10:10:00'],
    [6, 2, 'Quick Fun Facts', 'poll', 2, false, '2026-05-20 10:10:00', '2026-05-20 10:20:00'],
    [7, 3, 'Company Trivia', 'quiz', 1, false, '2026-03-10 16:05:00', '2026-03-10 16:35:00'],
    [8, 3, 'Pop Culture Round', 'quiz', 2, false, '2026-03-10 16:35:00', '2026-03-10 17:00:00'],
    [9, 4, 'Mood Check-in', 'poll', 1, false, '2026-01-22 11:05:00', '2026-01-22 11:25:00'],
    [10, 5, 'Holiday Bingo', 'bingo', 1, false, '2025-12-28 15:10:00', '2025-12-28 15:40:00'],
    [11, 17, 'Live Warm-up', 'this_or_that', 1, true, '2026-06-09 14:05:00', null],
    [12, 17, 'Demo Quiz', 'quiz', 2, false, null, null],
    [13, 8, 'Beach Item Hunt', 'scavenger', 1, false, '2025-08-14 14:10:00', '2025-08-14 14:50:00'],
    [14, 8, 'Team Photo Challenge', 'photo_upload', 2, false, '2025-08-14 14:50:00', '2025-08-14 15:20:00'],
    [15, 11, 'DevOps Round 1', 'quiz', 1, false, '2025-09-18 17:05:00', '2025-09-18 17:30:00'],
    [16, 7, 'Costume Vote', 'poll', 1, false, '2025-10-31 18:10:00', '2025-10-31 18:25:00'],
    [17, 9, 'Spring Icebreaker', 'this_or_that', 1, false, '2025-04-02 13:05:00', '2025-04-02 13:20:00'],
    [18, 6, 'Welcome Bingo', 'bingo', 1, false, '2025-11-15 10:10:00', '2025-11-15 10:45:00'],
    [19, 10, 'Sprint Warm-up', 'poll', 1, false, '2025-06-05 09:35:00', '2025-06-05 09:50:00'],
    [20, 12, 'Collaboration Prompt', 'open_text', 1, false, null, null],
];

const activities = activityDefs.map(([id, event_id, title, type, order_index, is_active, started_at, ended_at]) => ({
    id,
    event_id,
    title,
    type,
    settings: { timer_seconds: type === 'quiz' ? 45 : 120 },
    order_index,
    is_active,
    started_at,
    ended_at,
}));

const questionDefs = [
    [1, 1, 'Кава чи чай?', ['Кава', 'Чай'], null, 'single', 1],
    [2, 1, 'Море чи гори?', ['Море', 'Гори'], null, 'single', 2],
    [3, 2, 'У якому році засновано NovaTech?', ['2018', '2020', '2022', '2024'], '2020', 'single', 1],
    [4, 2, 'Які цінності NovaTech?', ['Відкритість', 'Команда', 'Швидкість', 'Якість'], 'Відкритість,Команда,Якість', 'multiple', 2],
    [5, 3, 'Знайди щось червоне', ['photo_upload'], null, 'open', 1],
    [6, 3, 'Знайди улюблену книгу', ['photo_upload'], null, 'open', 2],
    [7, 4, 'Наскільки ти заряджений(-на)?', ['1', '2', '3', '4', '5'], null, 'single', 1],
    [8, 5, 'Кава чи чай?', ['Кава', 'Чай'], null, 'single', 1],
    [9, 6, 'Який icebreaker найкращий?', ['This or That', 'Fun Facts', 'Bingo', 'Інше'], null, 'single', 1],
    [10, 7, 'Скільки офісів у NovaTech?', ['1', '2', '3', '4+'], '3', 'single', 1],
    [11, 7, 'Головний продукт компанії?', ['CRM', 'TeamWave', 'ERP', 'Analytics'], 'TeamWave', 'single', 2],
    [12, 8, 'Хто написав «1984»?', ['Оруелл', 'Кафка', 'Бредбері', 'Хемінгуей'], 'Оруелл', 'single', 1],
    [13, 9, 'Як твоє самопочуття сьогодні?', ['1', '2', '3', '4', '5'], null, 'single', 1],
    [14, 10, 'Знайди святковий декор', ['photo_upload'], null, 'open', 1],
    [15, 11, 'Котики чи собаки?', ['Котики', 'Собаки'], null, 'single', 1],
    [16, 12, 'Столиця України?', ['Київ', 'Львів', 'Одеса', 'Харків'], 'Київ', 'single', 1],
    [17, 13, 'Знайди щось жовте', ['photo_upload'], null, 'open', 1],
    [18, 14, 'Найкраще team selfie', ['photo_upload'], null, 'open', 1],
    [19, 15, 'Що таке CI/CD?', ['Continuous Integration/Delivery', 'Code Inspect', 'Cloud Deploy', 'None'], 'Continuous Integration/Delivery', 'single', 1],
    [20, 16, 'Найкращий костюм?', ['Вампір', 'Відьма', 'Супергерой', 'Інше'], null, 'single', 1],
    [21, 17, 'Ранок чи вечір?', ['Ранок', 'Вечір'], null, 'single', 1],
    [22, 18, 'Знайди welcome-лист', ['photo_upload'], null, 'open', 1],
    [23, 19, 'Готовність до спринту?', ['1', '2', '3', '4', '5'], null, 'single', 1],
    [24, 20, 'Що покращити в комунікації?', null, null, 'open', 1],
];

const activityQuestions = questionDefs.map(([id, activity_id, question, options, correct_answer, question_type, order_index]) => ({
    id,
    activity_id,
    question,
    options,
    correct_answer,
    question_type,
    order_index,
}));

let subId = 1;
const submissions = [];
const finishedActivityIds = [5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19];

for (const activityId of finishedActivityIds) {
    for (let i = 0; i < 2; i++) {
        const userId = participantPool[i % participantPool.length];
        submissions.push({
            id: subId++,
            activity_id: activityId,
            user_id: userId,
            team_id: teamForUser[userId] || null,
            content: { choice: 'Відповідь', activity_id: activityId, question_id: activityId },
            score: 5 + (i * 3) + (activityId % 4),
        });
    }
}
while (submissions.length < 15) {
    const userId = participantPool[submissions.length % participantPool.length];
    submissions.push({
        id: subId++,
        activity_id: 7,
        user_id: userId,
        team_id: teamForUser[userId] || null,
        content: { choice: 'TeamWave', question_id: 11 },
        score: 10,
    });
}

const commentTexts = [
    ['event', 2, 'Класний формат для ранкового розігріву!'],
    ['activity', 5, 'This or That — найшвидший спосіб дізнатися про колег.'],
    ['submission', 1, 'Погоджуюсь — кава перемагає!'],
    ['event', 1, 'Чекаю на Team Olympics!'],
    ['event', 3, 'Q1 quiz був дуже змагальним.'],
    ['event', 8, 'Scavenger влітку — топ формат.'],
    ['activity', 7, 'Складні питання про компанію — супер.'],
    ['event', 17, 'Demo в реальному часі виглядає круто!'],
    ['activity', 11, 'Live warm-up зараз активний 🔥'],
    ['submission', 3, 'Fun Facts — мій фаворит.'],
    ['event', 5, 'Bingo на Новий рік — традиція.'],
    ['event', 7, 'Halloween костюми — найкраще.'],
    ['event', 2, 'Повністю згодна з попереднім коментарем!'],
    ['activity', 13, 'Фото з пляжем знайшов за 2 хв!'],
    ['event', 11, 'DevOps quiz — hardcore mode.'],
];

const comments = commentTexts.map(([target_type, target_id, content], i) => ({
    id: i + 1,
    user_id: participantPool[i % participantPool.length],
    target_type,
    target_id,
    content,
    status: 'active',
}));

const likeTargets = [
    ['event', 2], ['event', 3], ['event', 8], ['event', 17], ['event', 1],
    ['activity', 5], ['activity', 7], ['activity', 11], ['activity', 13],
    ['submission', 1], ['submission', 2], ['submission', 5],
    ['comment', 1], ['comment', 2], ['comment', 4],
];

const likes = likeTargets.map(([target_type, target_id], i) => ({
    user_id: participantPool[(i + 1) % participantPool.length],
    target_type,
    target_id,
}));

const favoriteTargets = [
    ['event', 1], ['event', 2], ['event', 3], ['event', 8], ['event', 14],
    ['template', 4], ['template', 1], ['template', 3], ['template', 7],
    ['activity', 2], ['activity', 7], ['activity', 11],
    ['event', 17], ['template', 15], ['activity', 5],
];

const favorites = favoriteTargets.map(([target_type, target_id], i) => ({
    user_id: participantPool[i % participantPool.length],
    target_type,
    target_id,
}));

const finishedEvents = events.filter((e) => e.status === 'finished');
let lbId = 1;
const leaderboardEntries = [];

for (const event of finishedEvents) {
    const topUsers = participantPool.slice(0, 5);
    topUsers.forEach((userId, index) => {
        leaderboardEntries.push({
            id: lbId++,
            event_id: event.id,
            user_id: userId,
            team_id: teamForUser[userId] || null,
            points: 95 - index * 8 + (event.id % 3),
            rank_position: index + 1,
        });
    });
}
const leaderboard_entries = leaderboardEntries.slice(0, Math.max(15, leaderboardEntries.length));

let fbId = 1;
const feedback = [];
for (const event of finishedEvents) {
    for (let i = 0; i < 3 && feedback.length < 18; i++) {
        const userId = participantPool[i];
        feedback.push({
            id: fbId++,
            event_id: event.id,
            user_id: userId,
            rating: 4 + (i % 2),
            comment: `Відгук про ${event.title}: формат ${i % 2 === 0 ? 'чудовий' : 'дуже зручний'}.`,
            nps_score: 8 + (i % 3),
        });
    }
}

const notificationTypes = ['event_invite', 'activity_started', 'activity_ended', 'score_update', 'feedback_request', 'system'];
const notifications = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    user_id: participantPool[i % participantPool.length],
    actor_id: i % 3 === 0 ? null : [2, 3, 10, 11][i % 4],
    type: notificationTypes[i % notificationTypes.length],
    target_type: ['event', 'activity', 'event', 'event', 'activity', 'team'][i % 6],
    target_id: (i % 10) + 1,
    preview: [
        'Вас запрошено на захід NovaTech Team Olympics',
        'Активність Live Warm-up розпочата',
        'Активність Quick Fun Facts завершена',
        'Ваш рахунок оновлено: +15 балів',
        'Залиште відгук про минулий захід',
        'Новий шаблон доступний у бібліотеці',
        'Захід Q1 All-Hands Quiz завершено',
        'Команда Nova Alpha піднялась у лідерборді',
        'Нагадування: Beta Client Pilot через 3 дні',
        'Системне оновлення TeamWave v0.2',
        'Запрошення на Company Virtual Picnic',
        'Activity Demo Quiz скоро стартує',
        'Ваш коментар отримав лайк',
        'Новий badge: Icebreaker Pro',
        'Feedback request: Winter Wellness Hour',
    ][i],
    is_read: i % 3 !== 0,
}));

const contactMessages = [
    { id: 1, name: 'Олег Василенко', email: 'o.vasylenko@example.com', subject: 'Демо для компанії', message: 'Цікавить пілот TeamWave для 80 осіб.' },
    { id: 2, name: 'Ірина Сокол', email: 'iryna.s@startup.io', subject: 'Інтеграція з Slack', message: 'Чи плануєте інтеграцію зі Slack для сповіщень?' },
    { id: 3, name: 'Петро Млин', email: 'petro@agency.ua', subject: 'Кастомні шаблони', message: 'Можна замовити розробку кастомного сценарію?' },
    { id: 4, name: 'Анна Коваль', email: 'anna.k@corp.com', subject: 'Ціни', message: 'Надішліть прайс для enterprise.' },
    { id: 5, name: 'Сергій Данилюк', email: 'sergiy.d@gmail.com', subject: 'Проблема з входом', message: 'Не можу увійти через Google на staging.' },
    { id: 6, name: 'Марта Левко', email: 'marta@hrtech.ua', subject: 'Партнерство', message: 'Пропонуємо співпрацю з HR-платформою.' },
    { id: 7, name: 'Владислав Черненко', email: 'vlad@cowork.space', subject: 'Coworking event', message: 'Хочемо провести тімбілдинг для резидентів.' },
    { id: 8, name: 'Оксана Руденко', email: 'oksana.r@edu.ua', subject: 'Для університету', message: 'Чи підходить платформа для студентських груп?' },
    { id: 9, name: 'Денис Поліщук', email: 'denys@devshop.com', subject: 'API документація', message: 'Де знайти Swagger для events API?' },
    { id: 10, name: 'Галина Мельник', email: 'halyna@ngo.org', subject: 'Некомерційний тариф', message: 'Чи є знижки для NGO?' },
    { id: 11, name: 'Роман Зінченко', email: 'roman.z@fintech.io', subject: 'SSO', message: 'Підтримка SAML/SSO у roadmap?' },
    { id: 12, name: 'Тетяна Бойко', email: 'tanya@design.studio', subject: 'White-label', message: 'Цікавить white-label для нашого бренду.' },
    { id: 13, name: 'Артем Савчук', email: 'artem@games.dev', subject: 'Mini-games', message: 'Коли будуть typing race та balloon pop?' },
    { id: 14, name: 'Юлія Герасименко', email: 'yulia@growth.co', subject: 'Аналітика', message: 'Які метрики доступні організатору після заходу?' },
    { id: 15, name: 'Костянтин Орлов', email: 'kostya@logistics.ua', subject: 'Українська локалізація', message: 'Дякуємо за український інтерфейс!' },
];

writeSeed('users.json', users);
writeSeed('companies.json', companies);
writeSeed('teams.json', teams);
writeSeed('team_members.json', teamMembers);
writeSeed('badges.json', badges);
writeSeed('user_badges.json', userBadges);
writeSeed('event_templates.json', eventTemplates);
writeSeed('template_activities.json', templateActivities);
writeSeed('events.json', events);
writeSeed('event_participants.json', eventParticipants);
writeSeed('activities.json', activities);
writeSeed('activity_questions.json', activityQuestions);
writeSeed('submissions.json', submissions);
writeSeed('comments.json', comments);
writeSeed('likes.json', likes);
writeSeed('favorites.json', favorites);
writeSeed('leaderboard_entries.json', leaderboard_entries);
writeSeed('feedback.json', feedback);
writeSeed('notifications.json', notifications);
writeSeed('contact_messages.json', contactMessages);

console.log('\nDone. Run: npm run db:reset');
