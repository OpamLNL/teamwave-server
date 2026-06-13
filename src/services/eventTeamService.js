const eventRepository = require('../repositories/eventRepository');
const eventTeamRepository = require('../repositories/eventTeamRepository');
const joinRequestRepository = require('../repositories/eventTeamJoinRequestRepository');
const { canManageEvent } = require('./eventService');

const mapTeam = (team, members = [], pendingRequests = []) => ({
    id: team.id,
    event_id: team.event_id,
    name: team.name,
    captain_user_id: team.captain_user_id,
    captain_name: team.captain_name ?? null,
    captain_avatar: team.captain_avatar ?? null,
    status: team.status,
    started_at: team.started_at,
    finished_at: team.finished_at,
    completion_time_ms: team.completion_time_ms != null ? Number(team.completion_time_ms) : null,
    members_count: Number(team.members_count ?? members.length),
    members: members.map((m) => ({
        user_id: m.user_id,
        slot_index: m.slot_index,
        user_name: m.user_name,
        user_avatar: m.user_avatar,
        joined_at: m.joined_at,
    })),
    pending_requests: pendingRequests,
});

const { normalizeTypingRaceSettings } = require('../utils/typingRaceSettings');

const getTeamSize = async (eventId) => {
    const activities = await eventRepository.getActivitiesByEventId(eventId);
    const typingActivity = activities.find((a) => a.type === 'typing_race');
    const settings = typingActivity?.settings
        ? normalizeTypingRaceSettings(
            typeof typingActivity.settings === 'string'
                ? JSON.parse(typingActivity.settings)
                : typingActivity.settings
        )
        : null;
    return settings?.team_size ?? 4;
};

const assertRegistrationOpen = (event) => {
    if (['active', 'finished'].includes(event.status)) {
        throw new Error('Реєстрація команд закрита');
    }
};

const getEventTeams = async (eventId, user = null) => {
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');

    const teams = await eventTeamRepository.listTeamsByEventId(eventId);
    const result = [];
    for (const team of teams) {
        const members = await eventTeamRepository.getTeamMembers(team.id);
        const pendingRequests = await joinRequestRepository.listPendingByTeam(team.id);
        result.push(mapTeam(team, members, pendingRequests));
    }

    let myPendingRequest = null;
    if (user) {
        myPendingRequest = await joinRequestRepository.getPendingByUserForEvent(eventId, user.id);
    }

    return {
        teams: result,
        my_pending_request: myPendingRequest,
    };
};

const createEventTeam = async (eventId, { name }, user) => {
    if (!user) throw new Error('Не авторизований');
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    if (event.status === 'finished') throw new Error('Захід уже завершено');

    const participant = await eventRepository.getParticipant(eventId, user.id);
    if (!participant) throw new Error('Спочатку приєднайтесь до заходу');

    const existingTeam = await eventTeamRepository.getUserTeamInEvent(eventId, user.id);
    if (existingTeam) throw new Error('Ви вже в команді цього заходу');

    const pending = await joinRequestRepository.getPendingByUserForEvent(eventId, user.id);
    if (pending) throw new Error('Спочатку скасуйте запит на вступ до іншої команди');

    const trimmed = name?.trim();
    if (!trimmed) throw new Error('Назва команди обовʼязкова');

    const team = await eventTeamRepository.createTeam({
        event_id: eventId,
        name: trimmed,
        captain_user_id: user.id,
    });

    await eventTeamRepository.addMember({
        event_team_id: team.id,
        user_id: user.id,
        slot_index: 0,
    });

    const members = await eventTeamRepository.getTeamMembers(team.id);
    return mapTeam({ ...team, members_count: members.length }, members, []);
};

const requestJoinEventTeam = async (eventId, teamId, { slot_index: slotIndex }, user) => {
    if (!user) throw new Error('Не авторизований');
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    assertRegistrationOpen(event);

    const participant = await eventRepository.getParticipant(eventId, user.id);
    if (!participant) throw new Error('Спочатку приєднайтесь до заходу');

    const team = await eventTeamRepository.getTeamForEvent(eventId, teamId);
    if (!team) throw new Error('Команду не знайдено');
    if (team.status !== 'open') throw new Error('Команду вже зареєстровано');

    const teamSize = await getTeamSize(eventId);
    const slot = Number(slotIndex);
    if (!Number.isInteger(slot) || slot < 0 || slot >= teamSize) {
        throw new Error('Некоректний слот');
    }

    const existingTeam = await eventTeamRepository.getUserTeamInEvent(eventId, user.id);
    if (existingTeam) throw new Error('Ви вже в команді цього заходу');

    const slotTaken = await eventTeamRepository.getMemberBySlot(teamId, slot);
    if (slotTaken) throw new Error('Цей слот уже зайнятий');

    const slotPending = await joinRequestRepository.getPendingByTeamAndSlot(teamId, slot);
    if (slotPending && Number(slotPending.user_id) !== Number(user.id)) {
        throw new Error('На цей слот уже є запит');
    }

    const myPending = await joinRequestRepository.getPendingByUserForEvent(eventId, user.id);
    if (myPending) {
        if (Number(myPending.event_team_id) === Number(teamId) && Number(myPending.slot_index) === slot) {
            return mapTeam(
                team,
                await eventTeamRepository.getTeamMembers(teamId),
                await joinRequestRepository.listPendingByTeam(teamId)
            );
        }
        await joinRequestRepository.cancelPendingForUserInEvent(eventId, user.id);
    }

    await joinRequestRepository.createRequest({
        event_team_id: teamId,
        user_id: user.id,
        slot_index: slot,
    });

    const members = await eventTeamRepository.getTeamMembers(teamId);
    const pendingRequests = await joinRequestRepository.listPendingByTeam(teamId);
    return mapTeam(await eventTeamRepository.getTeamById(teamId), members, pendingRequests);
};

const acceptJoinRequest = async (eventId, teamId, requestId, user) => {
    if (!user) throw new Error('Не авторизований');
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    assertRegistrationOpen(event);

    const team = await eventTeamRepository.getTeamForEvent(eventId, teamId);
    if (!team) throw new Error('Команду не знайдено');
    if (team.status !== 'open') throw new Error('Команду вже зареєстровано');

    const isCaptain = Number(team.captain_user_id) === Number(user.id);
    if (!isCaptain && !canManageEvent(user, event)) {
        throw new Error('Лише капітан може приймати запити');
    }

    const request = await joinRequestRepository.getRequestForTeam(teamId, requestId);
    if (!request || request.status !== 'pending') {
        throw new Error('Запит не знайдено');
    }

    const existingTeam = await eventTeamRepository.getUserTeamInEvent(eventId, request.user_id);
    if (existingTeam) {
        await joinRequestRepository.updateRequestStatus(requestId, 'declined');
        throw new Error('Користувач уже в іншій команді');
    }

    const slotTaken = await eventTeamRepository.getMemberBySlot(teamId, request.slot_index);
    if (slotTaken) {
        await joinRequestRepository.updateRequestStatus(requestId, 'declined');
        throw new Error('Слот уже зайнятий');
    }

    await eventTeamRepository.addMember({
        event_team_id: teamId,
        user_id: request.user_id,
        slot_index: request.slot_index,
    });

    await joinRequestRepository.updateRequestStatus(requestId, 'accepted');
    await joinRequestRepository.cancelPendingForUserInEvent(eventId, request.user_id, teamId);

    const members = await eventTeamRepository.getTeamMembers(teamId);
    const pendingRequests = await joinRequestRepository.listPendingByTeam(teamId);
    return mapTeam(await eventTeamRepository.getTeamById(teamId), members, pendingRequests);
};

const declineJoinRequest = async (eventId, teamId, requestId, user) => {
    if (!user) throw new Error('Не авторизований');
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');

    const team = await eventTeamRepository.getTeamForEvent(eventId, teamId);
    if (!team) throw new Error('Команду не знайдено');

    const isCaptain = Number(team.captain_user_id) === Number(user.id);
    if (!isCaptain && !canManageEvent(user, event)) {
        throw new Error('Лише капітан може відхиляти запити');
    }

    const request = await joinRequestRepository.getRequestForTeam(teamId, requestId);
    if (!request || request.status !== 'pending') {
        throw new Error('Запит не знайдено');
    }

    await joinRequestRepository.updateRequestStatus(requestId, 'declined');

    const members = await eventTeamRepository.getTeamMembers(teamId);
    const pendingRequests = await joinRequestRepository.listPendingByTeam(teamId);
    return mapTeam(await eventTeamRepository.getTeamById(teamId), members, pendingRequests);
};

const cancelJoinRequest = async (eventId, teamId, user) => {
    if (!user) throw new Error('Не авторизований');
    const team = await eventTeamRepository.getTeamForEvent(eventId, teamId);
    if (!team) throw new Error('Команду не знайдено');

    await joinRequestRepository.cancelPendingForUserInTeam(teamId, user.id);
    return { ok: true };
};

const leaveEventTeam = async (eventId, teamId, user) => {
    if (!user) throw new Error('Не авторизований');
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    if (['active', 'finished'].includes(event.status)) {
        throw new Error('Не можна покинути команду під час гри');
    }

    const team = await eventTeamRepository.getTeamForEvent(eventId, teamId);
    if (!team) throw new Error('Команду не знайдено');

    const member = await eventTeamRepository.getMember(teamId, user.id);
    if (!member) {
        await joinRequestRepository.cancelPendingForUserInTeam(teamId, user.id);
        return { ok: true };
    }

    await eventTeamRepository.removeMember(teamId, user.id);
    await joinRequestRepository.cancelPendingForUserInTeam(teamId, user.id);

    const members = await eventTeamRepository.getTeamMembers(teamId);
    if (members.length === 0) {
        await eventTeamRepository.updateTeam(teamId, { captain_user_id: null, status: 'open' });
    } else if (Number(team.captain_user_id) === Number(user.id)) {
        await eventTeamRepository.updateTeam(teamId, {
            captain_user_id: members[0].user_id,
            status: 'open',
        });
    } else {
        await eventTeamRepository.updateTeam(teamId, { status: 'open' });
    }

    return { ok: true };
};

const markTeamReady = async (eventId, teamId, user) => {
    if (!user) throw new Error('Не авторизований');
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    if (event.status === 'finished') throw new Error('Захід уже завершено');

    const team = await eventTeamRepository.getTeamForEvent(eventId, teamId);
    if (!team) throw new Error('Команду не знайдено');

    const pendingCount = (await joinRequestRepository.listPendingByTeam(teamId)).length;
    if (pendingCount > 0) {
        throw new Error('Спочатку опрацюйте запити на вступ');
    }

    const isCaptain = Number(team.captain_user_id) === Number(user.id);
    if (!isCaptain && !canManageEvent(user, event)) {
        throw new Error('Лише капітан може підтвердити готовність');
    }

    const teamSize = await getTeamSize(eventId);
    const membersCount = await eventTeamRepository.countMembers(teamId);

    if (membersCount < teamSize) {
        throw new Error(`Потрібно ${teamSize} гравців у команді`);
    }

    await eventTeamRepository.updateTeam(teamId, { status: 'ready' });
    const members = await eventTeamRepository.getTeamMembers(teamId);
    return mapTeam(await eventTeamRepository.getTeamById(teamId), members, []);
};

module.exports = {
    getEventTeams,
    createEventTeam,
    requestJoinEventTeam,
    acceptJoinRequest,
    declineJoinRequest,
    cancelJoinRequest,
    leaveEventTeam,
    markTeamReady,
};
