const eventTemplateRepository = require('../repositories/eventTemplateRepository');
const { createTemplateEntity, createActivityEntity } = require('../models/eventModel');

const listTemplates = async (filters = {}) => {
    const rows = await eventTemplateRepository.listTemplates(filters);
    return rows.map(createTemplateEntity);
};

const getTemplateById = async (id, { withActivities = false } = {}) => {
    const template = await eventTemplateRepository.getTemplateById(id);
    if (!template) throw new Error('Шаблон не знайдено');

    const result = createTemplateEntity(template);

    if (withActivities) {
        const activities = await eventTemplateRepository.getTemplateActivities(id);
        result.activities = activities.map((row) => ({
            ...row,
            settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
        }));
    }

    return result;
};

module.exports = {
    listTemplates,
    getTemplateById,
};
