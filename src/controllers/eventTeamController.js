const eventTeamService = require('../services/eventTeamService');

const handleError = (res, err) => {
    const message = err.message || 'Помилка сервера';
    const status = message.includes('не знайдено') ? 404
        : message.includes('прав') || message.includes('авториз') ? 403
            : message.includes('обов') || message.includes('Некорект') || message.includes('Немає') || message.includes('Спочатку') || message.includes('Ви') || message.includes('Цей') || message.includes('Потрібно') || message.includes('Реєстрація') || message.includes('Не можна') || message.includes('Лише') ? 400
                : 500;
    res.status(status).json({ error: message });
};

const getEventTeams = async (req, res) => {
    try {
        const teams = await eventTeamService.getEventTeams(req.params.id);
        res.json(teams);
    } catch (err) {
        handleError(res, err);
    }
};

const createEventTeam = async (req, res) => {
    try {
        const team = await eventTeamService.createEventTeam(req.params.id, req.body, req.user);
        res.status(201).json(team);
    } catch (err) {
        handleError(res, err);
    }
};

const joinEventTeam = async (req, res) => {
    try {
        const team = await eventTeamService.joinEventTeam(
            req.params.id,
            req.params.teamId,
            req.body,
            req.user
        );
        res.json(team);
    } catch (err) {
        handleError(res, err);
    }
};

const leaveEventTeam = async (req, res) => {
    try {
        const result = await eventTeamService.leaveEventTeam(
            req.params.id,
            req.params.teamId,
            req.user
        );
        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

const markTeamReady = async (req, res) => {
    try {
        const team = await eventTeamService.markTeamReady(
            req.params.id,
            req.params.teamId,
            req.user
        );
        res.json(team);
    } catch (err) {
        handleError(res, err);
    }
};

module.exports = {
    getEventTeams,
    createEventTeam,
    joinEventTeam,
    leaveEventTeam,
    markTeamReady,
};
