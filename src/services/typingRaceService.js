const eventRepository = require('../repositories/eventRepository');
const eventTeamRepository = require('../repositories/eventTeamRepository');
const activityRepository = require('../repositories/activityRepository');
const typingRaceRepository = require('../repositories/typingRaceRepository');
const { canManageEvent } = require('./eventService');
const { createActivityEntity } = require('../models/eventModel');
const {
    charsMatch,
    getExpectedChar,
    splitTextChars,
    assertSingleChar,
} = require('../utils/typingRaceChars');
const { adaptTypingSettingsForTeam } = require('../utils/typingRaceTeamAdapt');

const parseSettings = (row) => {
    const { normalizeTypingRaceSettings } = require('../utils/typingRaceSettings');
    if (!row?.settings) return {};
    const raw = typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings;
    if (row.type === 'typing_race') {
        return normalizeTypingRaceSettings(raw);
    }
    return raw;
};

const getSegmentOwnerSlot = (segments, index) => {
    const seg = segments[index];
    if (seg?.slot != null) return seg.slot;
    for (let i = index - 1; i >= 0; i -= 1) {
        if (segments[i]?.slot != null) return segments[i].slot;
    }
    return segments.find((s) => s.slot != null)?.slot ?? 0;
};

const normalizePracticeMode = (mode) => (mode === 'team' ? 'team' : 'solo');

const buildTeamMembersView = async (eventTeamId) => {
    const members = await eventTeamRepository.getTeamMembers(eventTeamId);
    return members.map((member) => ({
        user_id: member.user_id,
        name: member.user_name,
        slot_index: Number(member.slot_index),
        avatar_url: member.user_avatar ?? null,
    }));
};

const resolveTeamTypingSettings = async (baseSettings, eventTeamId) => {
    const members = await buildTeamMembersView(eventTeamId);
    return adaptTypingSettingsForTeam(baseSettings, members);
};

const buildPracticeCanType = (practiceRun, practiceMode, mySlot, progress) => {
    if (!practiceRun || practiceRun.finished_at) return false;
    if (practiceMode === 'team') {
        return Number(mySlot) === Number(progress?.active_slot);
    }
    return true;
};

const buildProgressView = (settings, run) => {
    const segments = settings.segments || [];
    const totalSegments = segments.length;
    const currentIndex = run?.current_segment_index ?? 0;
    const typedChars = run?.segment_typed_chars ?? 0;
    const activeSlot = totalSegments > 0 ? getSegmentOwnerSlot(segments, currentIndex) : null;
    const currentSegment = segments[currentIndex] || null;
    const segmentText = currentSegment?.text || '';
    const segmentChars = splitTextChars(segmentText);
    const segmentProgress = segmentChars.length
        ? Math.min(100, Math.round((typedChars / segmentChars.length) * 100))
        : 0;

    return {
        current_segment_index: currentIndex,
        segment_typed_chars: typedChars,
        total_segments: totalSegments,
        active_slot: activeSlot,
        current_segment_text: segmentText,
        segment_progress: segmentProgress,
        is_finished: Boolean(run?.finished_at),
        completion_time_ms: run?.completion_time_ms != null ? Number(run.completion_time_ms) : null,
    };
};

const getTypingState = async (eventId, activityId, user) => {
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');

    const activityRow = await activityRepository.getActivityForEvent(eventId, activityId);
    if (!activityRow) throw new Error('Активність не знайдено');
    if (activityRow.type !== 'typing_race') throw new Error('Це не typing race');

    const activity = createActivityEntity(activityRow);
    const baseSettings = activity.settings;
    const runs = await typingRaceRepository.listRunsByActivity(activityId);
    const teams = await eventTeamRepository.listTeamsByEventId(eventId);

    let myTeam = null;
    let mySlot = null;
    if (user) {
        const membership = await eventTeamRepository.getUserTeamInEvent(eventId, user.id);
        if (membership) {
            myTeam = membership.id;
            mySlot = membership.slot_index;
        }
    }

    const runsView = await Promise.all(runs.map(async (run) => {
        const adaptedSettings = await resolveTeamTypingSettings(baseSettings, run.event_team_id);
        return {
            event_team_id: run.event_team_id,
            team_name: run.team_name,
            team_status: run.team_status,
            ...buildProgressView(adaptedSettings, run),
        };
    }));

    const activeSlotGlobal = runsView.find((r) => !r.is_finished)?.active_slot ?? null;
    const responseSettings = myTeam
        ? await resolveTeamTypingSettings(baseSettings, myTeam)
        : baseSettings;

    return {
        event: { id: event.id, status: event.status },
        activity: {
            id: activity.id,
            title: activity.title,
            is_active: activity.is_active,
            started_at: activity.started_at,
            ended_at: activity.ended_at,
        },
        settings: {
            mode: responseSettings.mode,
            team_size: responseSettings.team_size,
            slots: responseSettings.slots,
            segments: responseSettings.segments,
            source_text: responseSettings.source_text,
            occupied_slots: responseSettings.occupied_slots,
        },
        teams: teams.map((t) => ({
            id: t.id,
            name: t.name,
            status: t.status,
            completion_time_ms: t.completion_time_ms != null ? Number(t.completion_time_ms) : null,
        })),
        runs: runsView,
        my_team_id: myTeam,
        my_slot: mySlot != null ? Number(mySlot) : null,
        can_type: Boolean(
            user
            && myTeam
            && activity.is_active
            && !activity.ended_at
            && runsView.some(
                (r) => Number(r.event_team_id) === Number(myTeam)
                    && !r.is_finished
                    && r.active_slot === Number(mySlot)
            )
        ),
        active_slot: activeSlotGlobal,
    };
};

const startTypingRace = async (eventId, activityId, user) => {
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    if (!canManageEvent(user, event)) throw new Error('Немає прав запускати гру');

    const activityRow = await activityRepository.getActivityForEvent(eventId, activityId);
    if (!activityRow) throw new Error('Активність не знайдено');
    if (activityRow.type !== 'typing_race') throw new Error('Це не typing race');
    if (activityRow.is_active && activityRow.started_at) {
        throw new Error('Гра вже запущена');
    }

    const settings = parseSettings(activityRow);
    const teamSize = settings.team_size ?? 4;
    const allTeams = await eventTeamRepository.listTeamsByEventId(eventId);
    const readyTeams = [];

    for (const team of allTeams) {
        if (team.status === 'ready') {
            readyTeams.push(team);
            continue;
        }
        if (team.status === 'open') {
            const count = await eventTeamRepository.countMembers(team.id);
            if (count >= teamSize) {
                await eventTeamRepository.updateTeam(team.id, { status: 'ready' });
                readyTeams.push({ ...team, status: 'ready' });
            }
        }
    }

    if (!readyTeams.length) {
        throw new Error('Немає готових команд. Заповніть слоти та натисніть «Готові»');
    }

    const now = new Date();
    await activityRepository.updateActivity(activityId, {
        is_active: true,
        started_at: now,
        ended_at: null,
    });
    await eventRepository.updateEvent(eventId, { status: 'active' });

    const { query } = require('../config/database');
    await query('DELETE FROM typing_race_runs WHERE activity_id = ? AND is_practice = 1', [activityId]);

    for (const team of readyTeams) {
        await eventTeamRepository.updateTeam(team.id, {
            status: 'racing',
            started_at: now,
            finished_at: null,
            completion_time_ms: null,
        });
        await typingRaceRepository.createRun({
            activity_id: activityId,
            event_team_id: team.id,
            started_at: now,
        });
    }

    return getTypingState(eventId, activityId, user);
};

const typeCharacter = async (eventId, activityId, { event_team_id: eventTeamId, char }, user) => {
    if (!user) throw new Error('Не авторизований');
    const typedChar = assertSingleChar(char);

    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');

    const activityRow = await activityRepository.getActivityForEvent(eventId, activityId);
    if (!activityRow) throw new Error('Активність не знайдено');
    if (!activityRow.is_active || activityRow.ended_at) {
        throw new Error('Гра не активна');
    }

    const settings = await resolveTeamTypingSettings(parseSettings(activityRow), eventTeamId);
    const segments = settings.segments || [];
    if (!segments.length) throw new Error('Немає тексту для набору');

    const team = await eventTeamRepository.getTeamForEvent(eventId, eventTeamId);
    if (!team) throw new Error('Команду не знайдено');
    if (team.status !== 'racing') throw new Error('Команда не в гонці');

    const member = await eventTeamRepository.getMember(eventTeamId, user.id);
    if (!member) throw new Error('Ви не в цій команді');

    const run = await typingRaceRepository.getRun(activityId, eventTeamId);
    if (!run || run.is_practice) throw new Error('Гонка для команди не розпочата');
    if (run.finished_at) throw new Error('Гонка для команди завершена');

    const segmentIndex = run.current_segment_index;
    if (segmentIndex >= segments.length) throw new Error('Усі сегменти пройдено');

    const activeSlot = getSegmentOwnerSlot(segments, segmentIndex);
    if (Number(member.slot_index) !== Number(activeSlot)) {
        throw new Error('Зараз не ваш хід');
    }

    const segmentText = segments[segmentIndex].text || '';
    const expected = getExpectedChar(segmentText, run.segment_typed_chars);
    if (expected == null) throw new Error('Невірний символ');
    if (!charsMatch(expected, typedChar)) {
        throw new Error('Невірний символ');
    }

    const segmentChars = splitTextChars(segmentText);
    const nextTyped = Number(run.segment_typed_chars) + 1;
    let nextSegmentIndex = segmentIndex;
    let nextSegmentTyped = nextTyped;
    let finished = false;

    if (nextTyped >= segmentChars.length) {
        nextSegmentIndex = segmentIndex + 1;
        nextSegmentTyped = 0;
    }

    if (nextSegmentIndex >= segments.length) {
        finished = true;
    }

    if (finished) {
        const finishedAt = new Date();
        const startedAt = run.started_at ? new Date(run.started_at) : finishedAt;
        const completionMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());

        await typingRaceRepository.updateRun(run.id, {
            current_segment_index: nextSegmentIndex,
            segment_typed_chars: 0,
            finished_at: finishedAt,
            completion_time_ms: completionMs,
        });

        await eventTeamRepository.updateTeam(eventTeamId, {
            status: 'finished',
            finished_at: finishedAt,
            completion_time_ms: completionMs,
        });

        const rank = (await typingRaceRepository.countFinishedRuns(activityId));
        await typingRaceRepository.createSubmission({
            activity_id: activityId,
            user_id: user.id,
            team_id: null,
            content: {
                type: 'typing_race_team_result',
                event_team_id: eventTeamId,
                team_name: team.name,
                completion_time_ms: completionMs,
                rank,
                mode: settings.mode || 'team_relay',
            },
            score: Math.max(0, 300000 - completionMs),
        });

        await maybeFinishRace(eventId, activityId);
    } else {
        await typingRaceRepository.updateRun(run.id, {
            current_segment_index: nextSegmentIndex,
            segment_typed_chars: nextSegmentTyped,
        });
    }

    return getTypingState(eventId, activityId, user);
};

const maybeFinishRace = async (eventId, activityId) => {
    const totalRuns = await typingRaceRepository.countRuns(activityId);
    const finishedRuns = await typingRaceRepository.countFinishedRuns(activityId);
    if (finishedRuns < totalRuns) return false;

    const now = new Date();
    await activityRepository.updateActivity(activityId, {
        is_active: false,
        ended_at: now,
    });
    await eventRepository.updateEvent(eventId, { status: 'finished' });
    return true;
};

const finishTypingRace = async (eventId, activityId, user) => {
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    if (!canManageEvent(user, event)) throw new Error('Немає прав завершити гру');

    const activityRow = await activityRepository.getActivityForEvent(eventId, activityId);
    if (!activityRow) throw new Error('Активність не знайдено');

    const settings = parseSettings(activityRow);
    const now = new Date();

    await activityRepository.updateActivity(activityId, {
        is_active: false,
        ended_at: now,
    });
    await eventRepository.updateEvent(eventId, { status: 'finished' });

    const runs = await typingRaceRepository.listRunsByActivity(activityId);
    for (const run of runs) {
        if (run.finished_at) continue;
        const team = await eventTeamRepository.getTeamById(run.event_team_id);
        const startedAt = run.started_at ? new Date(run.started_at) : now;
        const completionMs = Math.max(0, now.getTime() - startedAt.getTime());
        await typingRaceRepository.updateRun(run.id, {
            finished_at: now,
            completion_time_ms: completionMs,
        });
        await eventTeamRepository.updateTeam(run.event_team_id, {
            status: 'finished',
            finished_at: now,
            completion_time_ms: completionMs,
        });
        if (team?.captain_user_id) {
            const rank = (await typingRaceRepository.countFinishedRuns(activityId)) + 1;
            await typingRaceRepository.createSubmission({
                activity_id: activityId,
                user_id: team.captain_user_id,
                team_id: null,
                content: {
                    type: 'typing_race_team_result',
                    event_team_id: run.event_team_id,
                    team_name: team.name,
                    completion_time_ms: completionMs,
                    rank,
                    mode: settings?.mode || 'team_relay',
                },
                score: Math.max(0, 300000 - completionMs),
            });
        }
    }

    await maybeFinishRace(eventId, activityId);
    return getTypingState(eventId, activityId, user);
};

const getPracticeState = async (eventId, activityId, user) => {
    if (!user) throw new Error('Не авторизований');

    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    if (event.status === 'finished') throw new Error('Захід завершено');

    const activityRow = await activityRepository.getActivityForEvent(eventId, activityId);
    if (!activityRow) throw new Error('Активність не знайдено');
    if (activityRow.type !== 'typing_race') throw new Error('Це не typing race');

    const activity = createActivityEntity(activityRow);
    const baseSettings = activity.settings;

    const membership = await eventTeamRepository.getUserTeamInEvent(eventId, user.id);
    if (!membership) throw new Error('Спочатку вступіть у команду');

    const teamMembers = await buildTeamMembersView(membership.id);
    const settings = adaptTypingSettingsForTeam(baseSettings, teamMembers);
    const practiceRun = await typingRaceRepository.getPracticeRun(activityId, membership.id);
    const practiceMode = normalizePracticeMode(practiceRun?.practice_mode);
    const progress = practiceRun ? buildProgressView(settings, practiceRun) : null;
    const mySlot = Number(membership.slot_index);

    return {
        event: { id: event.id, status: event.status },
        activity: { id: activity.id, title: activity.title },
        settings: {
            mode: settings.mode,
            team_size: settings.team_size,
            slots: settings.slots,
            segments: settings.segments,
            source_text: settings.source_text,
            occupied_slots: settings.occupied_slots,
        },
        my_team_id: membership.id,
        my_slot: mySlot,
        practice_mode: practiceMode,
        practice_run: progress,
        team_members: teamMembers,
        is_practice_active: Boolean(practiceRun && !practiceRun.finished_at),
        can_type: buildPracticeCanType(practiceRun, practiceMode, mySlot, progress),
        active_slot: progress?.active_slot ?? null,
    };
};

const startPracticeRun = async (eventId, activityId, { mode = 'solo' } = {}, user) => {
    if (!user) throw new Error('Не авторизований');

    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    if (event.status === 'finished') throw new Error('Захід завершено');
    if (event.status === 'active') throw new Error('Під час live-гонки тренування недоступне');

    const activityRow = await activityRepository.getActivityForEvent(eventId, activityId);
    if (!activityRow) throw new Error('Активність не знайдено');
    if (activityRow.type !== 'typing_race') throw new Error('Це не typing race');

    const membership = await eventTeamRepository.getUserTeamInEvent(eventId, user.id);
    if (!membership) throw new Error('Спочатку вступіть у команду');

    const practiceMode = normalizePracticeMode(mode);
    if (practiceMode === 'team') {
        const membersCount = await eventTeamRepository.countMembers(membership.id);
        if (membersCount < 2) {
            throw new Error('Для командного тренування потрібно щонайменше 2 гравці в команді');
        }
    }

    const competitiveRun = await typingRaceRepository.getRun(activityId, membership.id);
    if (competitiveRun && !competitiveRun.is_practice) {
        throw new Error('Офіційна гонка вже розпочата');
    }

    await typingRaceRepository.deleteRunsForTeam(activityId, membership.id);
    await typingRaceRepository.createRun({
        activity_id: activityId,
        event_team_id: membership.id,
        started_at: new Date(),
        is_practice: true,
        practice_mode: practiceMode,
    });

    return getPracticeState(eventId, activityId, user);
};

const typePracticeCharacter = async (eventId, activityId, { char }, user) => {
    if (!user) throw new Error('Не авторизований');
    const typedChar = assertSingleChar(char);

    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    if (event.status === 'active') throw new Error('Під час live-гонки тренування недоступне');

    const activityRow = await activityRepository.getActivityForEvent(eventId, activityId);
    if (!activityRow) throw new Error('Активність не знайдено');

    const membership = await eventTeamRepository.getUserTeamInEvent(eventId, user.id);
    if (!membership) throw new Error('Ви не в команді');

    const settings = await resolveTeamTypingSettings(parseSettings(activityRow), membership.id);
    const segments = settings.segments || [];
    if (!segments.length) throw new Error('Немає тексту для набору');

    const run = await typingRaceRepository.getPracticeRun(activityId, membership.id);
    if (!run || run.finished_at) throw new Error('Спочатку почніть тренування');

    const practiceMode = normalizePracticeMode(run.practice_mode);
    const member = await eventTeamRepository.getMember(membership.id, user.id);
    if (!member) throw new Error('Ви не в цій команді');

    const segmentIndex = run.current_segment_index;
    if (segmentIndex >= segments.length) throw new Error('Усі сегменти пройдено');

    if (practiceMode === 'team') {
        const activeSlot = getSegmentOwnerSlot(segments, segmentIndex);
        if (Number(member.slot_index) !== Number(activeSlot)) {
            throw new Error('Зараз не ваш хід');
        }
    }

    const segmentText = segments[segmentIndex].text || '';
    const expected = getExpectedChar(segmentText, run.segment_typed_chars);
    if (expected == null) throw new Error('Невірний символ');
    if (!charsMatch(expected, typedChar)) {
        throw new Error('Невірний символ');
    }

    const segmentChars = splitTextChars(segmentText);
    const nextTyped = Number(run.segment_typed_chars) + 1;
    let nextSegmentIndex = segmentIndex;
    let nextSegmentTyped = nextTyped;
    let finished = false;

    if (nextTyped >= segmentChars.length) {
        nextSegmentIndex = segmentIndex + 1;
        nextSegmentTyped = 0;
    }

    if (nextSegmentIndex >= segments.length) {
        finished = true;
    }

    if (finished) {
        const finishedAt = new Date();
        const startedAt = run.started_at ? new Date(run.started_at) : finishedAt;
        const completionMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());

        await typingRaceRepository.updateRun(run.id, {
            current_segment_index: nextSegmentIndex,
            segment_typed_chars: 0,
            finished_at: finishedAt,
            completion_time_ms: completionMs,
        });
    } else {
        await typingRaceRepository.updateRun(run.id, {
            current_segment_index: nextSegmentIndex,
            segment_typed_chars: nextSegmentTyped,
        });
    }

    return getPracticeState(eventId, activityId, user);
};

const resetPracticeRun = async (eventId, activityId, user) => {
    if (!user) throw new Error('Не авторизований');

    const membership = await eventTeamRepository.getUserTeamInEvent(eventId, user.id);
    if (!membership) throw new Error('Спочатку вступіть у команду');

    await typingRaceRepository.resetPracticeRun(activityId, membership.id);
    return getPracticeState(eventId, activityId, user);
};

module.exports = {
    getTypingState,
    getPracticeState,
    startPracticeRun,
    typePracticeCharacter,
    resetPracticeRun,
    startTypingRace,
    typeCharacter,
    finishTypingRace,
    getSegmentOwnerSlot,
};
