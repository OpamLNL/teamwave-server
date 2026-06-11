const eventService = require('../services/eventService');

const handleError = (res, err) => {
    const message = err.message || 'Помилка сервера';
    const status = message.includes('не знайдено') ? 404
        : message.includes('прав') || message.includes('авториз') ? 403
            : message.includes('обов') || message.includes('Некорект') ? 400
                : 500;
    res.status(status).json({ error: message });
};

const listEvents = async (req, res) => {
    try {
        const events = await eventService.listEvents({
            status: req.query.status,
            type: req.query.type,
            isPublic: req.query.is_public,
            organizerId: req.query.organizer_id,
            search: req.query.search,
            limit: req.query.limit,
            offset: req.query.offset,
        });
        res.json(events);
    } catch (err) {
        handleError(res, err);
    }
};

const getEventById = async (req, res) => {
    try {
        const event = await eventService.getEventById(req.params.id, {
            withActivities: req.query.include === 'activities' || req.query.include === 'all',
            withParticipants: req.query.include === 'participants' || req.query.include === 'all',
        });
        res.json(event);
    } catch (err) {
        handleError(res, err);
    }
};

const getEventByJoinCode = async (req, res) => {
    try {
        const event = await eventService.getEventByJoinCode(req.params.code);
        res.json(event);
    } catch (err) {
        handleError(res, err);
    }
};

const createEvent = async (req, res) => {
    try {
        const event = await eventService.createEvent(req.body, req.user);
        res.status(201).json(event);
    } catch (err) {
        handleError(res, err);
    }
};

const createEventFromTemplate = async (req, res) => {
    try {
        const event = await eventService.createEventFromTemplate(
            req.params.templateId,
            req.body,
            req.user
        );
        res.status(201).json(event);
    } catch (err) {
        handleError(res, err);
    }
};

const updateEvent = async (req, res) => {
    try {
        const event = await eventService.updateEvent(req.params.id, req.body, req.user);
        res.json(event);
    } catch (err) {
        handleError(res, err);
    }
};

const deleteEvent = async (req, res) => {
    try {
        await eventService.deleteEvent(req.params.id, req.user);
        res.json({ ok: true });
    } catch (err) {
        handleError(res, err);
    }
};

const joinEvent = async (req, res) => {
    try {
        const result = await eventService.joinEvent({
            joinCode: req.body.join_code,
            eventId: req.params.id,
            user: req.user,
        });
        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

const joinByCode = async (req, res) => {
    try {
        const result = await eventService.joinEvent({
            joinCode: req.body.join_code || req.params.code,
            user: req.user,
        });
        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

const leaveEvent = async (req, res) => {
    try {
        await eventService.leaveEvent(req.params.id, req.user);
        res.json({ ok: true });
    } catch (err) {
        handleError(res, err);
    }
};

const getMyEvents = async (req, res) => {
    try {
        const events = await eventService.getMyEvents(req.user.id);
        res.json(events);
    } catch (err) {
        handleError(res, err);
    }
};

const getEventActivities = async (req, res) => {
    try {
        const activities = await eventService.getEventActivities(req.params.id);
        res.json(activities);
    } catch (err) {
        handleError(res, err);
    }
};

const getEventParticipants = async (req, res) => {
    try {
        const participants = await eventService.getEventParticipants(req.params.id);
        res.json(participants);
    } catch (err) {
        handleError(res, err);
    }
};

const getEventTeamLeaderboard = async (req, res) => {
    try {
        const leaderboard = await eventService.getEventTeamLeaderboard(req.params.id);
        res.json(leaderboard);
    } catch (err) {
        handleError(res, err);
    }
};

const uploadEventCover = async (req, res) => {
    try {
        const event = await eventService.uploadEventCover(req.params.id, req.file, req.user);
        res.json(event);
    } catch (err) {
        handleError(res, err);
    }
};

module.exports = {
    listEvents,
    getEventById,
    getEventByJoinCode,
    createEvent,
    createEventFromTemplate,
    updateEvent,
    deleteEvent,
    joinEvent,
    joinByCode,
    leaveEvent,
    getMyEvents,
    getEventActivities,
    getEventParticipants,
    getEventTeamLeaderboard,
    uploadEventCover,
};
