const COMMENT_TARGETS = {
    EVENT: 'event',
    ACTIVITY: 'activity',
    SUBMISSION: 'submission',
};

const createCommentEntity = ({
    id,
    user_id,
    target_type,
    target_id,
    content,
    status,
    created_at,
    author_name,
    author_avatar,
}) => ({
    id,
    user_id,
    target_type,
    target_id,
    content,
    status,
    created_at,
    author_name,
    author_avatar,
});

module.exports = {
    COMMENT_TARGETS,
    createCommentEntity,
};
