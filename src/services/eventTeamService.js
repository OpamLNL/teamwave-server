const eventRepository = require('../repositories/eventRepository');
const eventTeamRepository = require('../repositories/eventTeamRepository');
const { canManageEvent } = require('./eventService');

const mapTeam = (team, members = []) => ({
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
});

const getEventTeams = async (eventId) => {
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');

    const teams = await eventTeamRepository.listTeamsByEventId(eventId);
    const result = [];
    for (const team of teams) {
        const members = await eventTeamRepository.getTeamMembers(team.id);
        result.push(mapTeam(team, members));
    }
    return result;
};

const createEventTeam = async (eventId, { name }, user) => {
    if (!user) throw new Error('Не авторизований');
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    if (['finished'].includes(event.status)) throw new Error('Захід уже завершено');

    const participant = await eventRepository.getParticipant(eventId, user.id);
    if (!participant) throw new Error('Спочатку приєднайтесь до заходу');

    const existingTeam = await eventTeamRepository.getUserTeamInEvent(eventId, user.id);
    if (existingTeam) throw new Error('Ви вже в команді цього заходу');

    const trimmed = name?.trim();
    if (!trimmed) throw new Error('Назва команди обовʼязкова');

    const team = await eventTeamRepository.createTeam({
        event_id: eventId,
        name: trimmed,
        captain_user_id: user.id,
    });

    const members = await eventTeamRepository.getTeamMembers(team.id);
    return mapTeam({ ...team, members_count: 0 }, members);
};

const joinEventTeam = async (eventId, teamId, { slot_index: slotIndex }, user) => {
    if (!user) throw new Error('Не авторизований');
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    if (['active', 'finished'].includes(event.status)) {
        throw new Error('Реєстрація команд закрита');
    }

    const participant = await eventRepository.getParticipant(eventId, user.id);
    if (!participant) throw new Error('Спочатку приєднайтесь до заходу');

    const team = await eventTeamRepository.getTeamForEvent(eventId, teamId);
    if (!team) throw new Error('Команду не знайдено');
    if (team.status !== 'open') throw new Error('Команду вже зареєстровано');

    const activities = await eventRepository.getActivitiesByEventId(eventId);
    const typingActivity = activities.find((a) => a.type === 'typing_race');
    const settings = typingActivity?.settings
        ? (typeof typingActivity.settings === 'string'
            ? JSON.parse(typingActivity.settings)
            : typingActivity.settings)
        : null;
    const teamSize = settings?.team_size ?? 4;

    const slot = Number(slotIndex);
    if (!Number.isInteger(slot) || slot < 0 || slot >= teamSize) {
        throw new Error('Некоректний слот');
    }

    const existingTeam = await eventTeamRepository.getUserTeamInEvent(eventId, user.id);
    if (existingTeam && Number(existingTeam.id) !== Number(teamId)) {
        throw new Error('Ви вже в іншій команді');
    }

    const existingMember = await eventTeamRepository.getMember(teamId, user.id);
    if (existingMember) {
        if (Number(existingMember.slot_index) === slot) {
            const members = await eventTeamRepository.getTeamMembers(teamId);
            return mapTeam(team, members);
        }
        await eventTeamRepository.removeMember(teamId, user.id);
    }

    const slotTaken = await eventTeamRepository.getMemberBySlot(teamId, slot);
    if (slotTaken && Number(slotTaken.user_id) !== Number(user.id)) {
        throw new Error('Цей слот уже зайнятий');
    }

    await eventTeamRepository.addMember({
        event_team_id: teamId,
        user_id: user.id,
        slot_index: slot,
    });

    if (!team.captain_user_id) {
        await eventTeamRepository.updateTeam(teamId, { captain_user_id: user.id });
    }

    const members = await eventTeamRepository.getTeamMembers(teamId);
    return mapTeam(await eventTeamRepository.getTeamById(teamId), members);
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
    if (!member) throw new Error('Ви не в цій команді');

    await eventTeamRepository.removeMember(teamId, user.id);

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

    const isCaptain = Number(team.captain_user_id) === Number(user.id);
    if (!isCaptain && !canManageEvent(user, event)) {
        throw new Error('Лише капітан може підтвердити готовність');
    }

    const activities = await eventRepository.getActivitiesByEventId(eventId);
    const typingActivity = activities.find((a) => a.type === 'typing_race');
    const settings = typingActivity?.settings
        ? (typeof typingActivity.settings === 'string'
            ? JSON.parse(typingActivity.settings)
            : typingActivity.settings)
        : null;
    const teamSize = settings?.team_size ?? 4;
    const membersCount = await eventTeamRepository.countMembers(teamId);

    if (membersCount < teamSize) {
        throw new Error(`Потрібно ${teamSize} гравців у команді`);
    }

    await eventTeamRepository.updateTeam(teamId, { status: 'ready' });
    const members = await eventTeamRepository.getTeamMembers(teamId);
    return mapTeam(await eventTeamRepository.getTeamById(teamId), members);
};

module.exports = {
    getEventTeams,
    createEventTeam,
    joinEventTeam,
    leaveEventTeam,
    markTeamReady,
};
