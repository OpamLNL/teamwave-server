const CATEGORY_ICONS = {
    icebreaker: '🧊',
    quiz: '🧠',
    challenge: '🏆',
    combined: '🎯',
    wellness: '🌿',
    creative: '🎨',
    game: '🎮',
    hybrid: '🔀',
    collaborative: '🤝',
    themed: '🎭',
};

const TYPE_ICONS = {
    icebreaker: '🧊',
    quiz: '🧠',
    game: '🎮',
    challenge: '🏆',
    collaborative: '🤝',
    creative: '🎨',
    wellness: '🌿',
    hybrid: '🔀',
    themed: '🎭',
    combined: '🎯',
};

const TEMPLATE_ICONS = {
    9: '⌨️',
    16: '⌨️',
    17: '🏆',
};

const resolveIcon = ({ icon, category, event_type: eventType, type, template_id: templateId, id }) => {
    if (icon?.trim()) return icon.trim();
    if (templateId && TEMPLATE_ICONS[templateId]) return TEMPLATE_ICONS[templateId];
    if (id && TEMPLATE_ICONS[id]) return TEMPLATE_ICONS[id];
    if (category && CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
    const t = eventType || type;
    if (t && TYPE_ICONS[t]) return TYPE_ICONS[t];
    return '📅';
};

module.exports = {
    CATEGORY_ICONS,
    TYPE_ICONS,
    TEMPLATE_ICONS,
    resolveIcon,
};
