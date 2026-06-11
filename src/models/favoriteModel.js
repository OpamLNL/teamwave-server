const FAVORITE_TARGETS = {
    EVENT: 'event',
    TEMPLATE: 'template',
    ACTIVITY: 'activity',
};

const createFavoriteEntity = ({
    user_id,
    target_type,
    target_id,
    created_at,
}) => ({
    user_id,
    target_type,
    target_id,
    created_at,
});

module.exports = {
    FAVORITE_TARGETS,
    createFavoriteEntity,
};
