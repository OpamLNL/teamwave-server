const EVENT_STATUSES = ['draft', 'planned', 'active', 'finished'];
const EVENT_TYPES = [
    'icebreaker', 'quiz', 'game', 'challenge', 'collaborative',
    'creative', 'wellness', 'hybrid', 'themed', 'combined',
];

const createEventEntity = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    start_time: row.start_time,
    duration_minutes: row.duration_minutes,
    status: row.status,
    type: row.type,
    organizer_id: row.organizer_id,
    host_id: row.host_id,
    max_participants: row.max_participants,
    is_public: Boolean(row.is_public),
    template_id: row.template_id,
    join_code: row.join_code,
    created_at: row.created_at,
    organizer_name: row.organizer_name ?? null,
    host_name: row.host_name ?? null,
    participants_count: row.participants_count != null ? Number(row.participants_count) : 0,
    activities_count: row.activities_count != null ? Number(row.activities_count) : 0,
});

const createActivityEntity = (row) => ({
    id: row.id,
    event_id: row.event_id,
    title: row.title,
    type: row.type,
    settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
    order_index: row.order_index,
    is_active: Boolean(row.is_active),
    started_at: row.started_at,
    ended_at: row.ended_at,
});

const createTemplateEntity = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    event_type: row.event_type,
    is_public: Boolean(row.is_public),
    created_at: row.created_at,
    activities_count: row.activities_count != null ? Number(row.activities_count) : 0,
});

module.exports = {
    EVENT_STATUSES,
    EVENT_TYPES,
    createEventEntity,
    createActivityEntity,
    createTemplateEntity,
};
