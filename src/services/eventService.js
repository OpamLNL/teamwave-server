const eventRepository = require('../repositories/eventRepository');
const {
    EVENT_STATUSES,
    EVENT_TYPES,
    createEventEntity,
    createActivityEntity,
} = require('../models/eventModel');

const STAFF_ROLES = ['admin', 'organizer', 'host'];

const generateJoinCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i += 1) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
};

const ensureUniqueJoinCode = async (excludeId = null) => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const code = generateJoinCode();
        const exists = await eventRepository.joinCodeExists(code, excludeId);
        if (!exists) return code;
    }
    throw new Error('Не вдалося згенерувати унікальний код заходу');
};

const canManageEvent = (user, event) => {
    if (!user || !event) return false;
    if (user.role === 'admin') return true;
    if (['organizer', 'host'].includes(user.role)) {
        return Number(event.organizer_id) === Number(user.id)
            || Number(event.host_id) === Number(user.id);
    }
    return false;
};

const listEvents = async (filters = {}) => {
    const rows = await eventRepository.listEvents(filters);
    return rows.map(createEventEntity);
};

const getEventById = async (id, { withActivities = false, withParticipants = false } = {}) => {
    const event = await eventRepository.getEventById(id);
    if (!event) {
        throw new Error('Захід не знайдено');
    }

    const result = createEventEntity(event);

    if (withActivities) {
        const activities = await eventRepository.getActivitiesByEventId(id);
        result.activities = activities.map(createActivityEntity);
    }

    if (withParticipants) {
        result.participants = await eventRepository.getParticipantsByEventId(id);
    }

    return result;
};

const getEventByJoinCode = async (joinCode) => {
    const event = await eventRepository.getEventByJoinCode(joinCode);
    if (!event) {
        throw new Error('Захід з таким кодом не знайдено');
    }
    return createEventEntity(event);
};

const createEvent = async (data, user) => {
    if (!user) throw new Error('Не авторизований');
    if (user.is_blocked) throw new Error('Користувач заблокований');
    if (!['admin', 'organizer', 'host'].includes(user.role)) {
        throw new Error('Недостатньо прав для створення заходу');
    }

    if (!data.title?.trim()) throw new Error('Назва заходу обовʼязкова');
    if (!data.start_time) throw new Error('Час початку обовʼязковий');

    const status = data.status ?? 'draft';
    if (!EVENT_STATUSES.includes(status)) throw new Error('Некоректний статус');

    const type = data.type ?? 'combined';
    if (!EVENT_TYPES.includes(type)) throw new Error('Некоректний тип заходу');

    const joinCode = data.join_code?.trim().toUpperCase() || await ensureUniqueJoinCode();

    if (await eventRepository.joinCodeExists(joinCode)) {
        throw new Error('Код заходу вже використовується');
    }

    const row = await eventRepository.createEvent({
        ...data,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        organizer_id: user.id,
        host_id: data.host_id || user.id,
        join_code: joinCode,
        status,
        type,
    });

    await eventRepository.addParticipant({
        event_id: row.id,
        user_id: row.host_id,
        role_in_event: 'host',
    });

    return createEventEntity(row);
};

const updateEvent = async (id, data, user) => {
    const existing = await eventRepository.getEventById(id);
    if (!existing) throw new Error('Захід не знайдено');
    if (!canManageEvent(user, existing)) throw new Error('Немає прав редагувати захід');

    if (data.status && !EVENT_STATUSES.includes(data.status)) {
        throw new Error('Некоректний статус');
    }
    if (data.type && !EVENT_TYPES.includes(data.type)) {
        throw new Error('Некоректний тип заходу');
    }
    if (data.join_code) {
        const code = data.join_code.trim().toUpperCase();
        if (await eventRepository.joinCodeExists(code, id)) {
            throw new Error('Код заходу вже використовується');
        }
        data.join_code = code;
    }

    const row = await eventRepository.updateEvent(id, data);
    return createEventEntity(row);
};

const deleteEvent = async (id, user) => {
    const existing = await eventRepository.getEventById(id);
    if (!existing) throw new Error('Захід не знайдено');
    if (!canManageEvent(user, existing) && user.role !== 'admin') {
        throw new Error('Немає прав видаляти захід');
    }
    return eventRepository.deleteEvent(id);
};

const joinEvent = async ({ joinCode, eventId, user }) => {
    if (!user) throw new Error('Не авторизований');
    if (user.is_blocked) throw new Error('Користувач заблокований');

    const event = joinCode
        ? await eventRepository.getEventByJoinCode(joinCode)
        : await eventRepository.getEventById(eventId);

    if (!event) throw new Error('Захід не знайдено');
    if (['finished'].includes(event.status)) {
        throw new Error('Захід уже завершено');
    }

    const existing = await eventRepository.getParticipant(event.id, user.id);
    if (existing) {
        return { event: createEventEntity(event), participant: existing, alreadyJoined: true };
    }

    const participants = await eventRepository.getParticipantsByEventId(event.id);
    if (participants.length >= event.max_participants) {
        throw new Error('Досягнуто ліміт учасників');
    }

    const participant = await eventRepository.addParticipant({
        event_id: event.id,
        user_id: user.id,
        role_in_event: 'participant',
    });

    return { event: createEventEntity(event), participant, alreadyJoined: false };
};

const leaveEvent = async (eventId, user) => {
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');

    const participant = await eventRepository.getParticipant(eventId, user.id);
    if (!participant) throw new Error('Ви не учасник цього заходу');
    if (participant.role_in_event === 'host') {
        throw new Error('Ведучий не може покинути захід');
    }

    return eventRepository.removeParticipant(eventId, user.id);
};

const getMyEvents = async (userId) => {
    const rows = await eventRepository.getEventsForUser(userId);
    return rows.map(createEventEntity);
};

const getEventActivities = async (eventId) => {
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    const activities = await eventRepository.getActivitiesByEventId(eventId);
    return activities.map(createActivityEntity);
};

const getEventParticipants = async (eventId) => {
    const event = await eventRepository.getEventById(eventId);
    if (!event) throw new Error('Захід не знайдено');
    return eventRepository.getParticipantsByEventId(eventId);
};

module.exports = {
    listEvents,
    getEventById,
    getEventByJoinCode,
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    getMyEvents,
    getEventActivities,
    getEventParticipants,
    canManageEvent,
    STAFF_ROLES,
};
