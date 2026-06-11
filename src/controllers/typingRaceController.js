const typingRaceService = require('../services/typingRaceService');

const handleError = (res, err) => {
    const message = err.message || 'Помилка сервера';
    const status = message.includes('не знайдено') ? 404
        : message.includes('прав') || message.includes('авториз') ? 403
            : message.includes('Немає') || message.includes('не активна') || message.includes('не ваш') || message.includes('Невірний') || message.includes('Передайте') || message.includes('Це не') || message.includes('вже') ? 400
                : 500;
    res.status(status).json({ error: message });
};

const getTypingState = async (req, res) => {
    try {
        const state = await typingRaceService.getTypingState(
            req.params.id,
            req.params.activityId,
            req.user || null
        );
        res.json(state);
    } catch (err) {
        handleError(res, err);
    }
};

const startTypingRace = async (req, res) => {
    try {
        const state = await typingRaceService.startTypingRace(
            req.params.id,
            req.params.activityId,
            req.user
        );
        res.json(state);
    } catch (err) {
        handleError(res, err);
    }
};

const typeCharacter = async (req, res) => {
    try {
        const state = await typingRaceService.typeCharacter(
            req.params.id,
            req.params.activityId,
            req.body,
            req.user
        );
        res.json(state);
    } catch (err) {
        handleError(res, err);
    }
};

const finishTypingRace = async (req, res) => {
    try {
        const state = await typingRaceService.finishTypingRace(
            req.params.id,
            req.params.activityId,
            req.user
        );
        res.json(state);
    } catch (err) {
        handleError(res, err);
    }
};

module.exports = {
    getTypingState,
    startTypingRace,
    typeCharacter,
    finishTypingRace,
};
