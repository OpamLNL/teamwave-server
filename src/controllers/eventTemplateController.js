const eventTemplateService = require('../services/eventTemplateService');

const handleError = (res, err) => {
    const message = err.message || 'Помилка сервера';
    const status = message.includes('не знайдено') ? 404 : 500;
    res.status(status).json({ error: message });
};

const listTemplates = async (req, res) => {
    try {
        const templates = await eventTemplateService.listTemplates({
            category: req.query.category,
            eventType: req.query.event_type,
            isPublic: req.query.is_public ?? true,
        });
        res.json(templates);
    } catch (err) {
        handleError(res, err);
    }
};

const getTemplateById = async (req, res) => {
    try {
        const template = await eventTemplateService.getTemplateById(req.params.id, {
            withActivities: req.query.include === 'activities' || req.query.include === 'all',
        });
        res.json(template);
    } catch (err) {
        handleError(res, err);
    }
};

module.exports = {
    listTemplates,
    getTemplateById,
};
