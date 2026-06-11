const LIKE_TARGETS = {
    EVENT: 'event',
    ACTIVITY: 'activity',
    SUBMISSION: 'submission',
    COMMENT: 'comment',
};

const createLikeEntity = ({
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
    LIKE_TARGETS,
    createLikeEntity,
};
