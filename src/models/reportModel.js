const REPORT_TARGETS = {
    WORK: 'work',
    POST: 'post',
    COMMENT: 'comment',
    USER: 'user'
};

const REPORT_STATUSES = {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    REJECTED: 'rejected',
    RESOLVED: 'resolved'
};

const createReportEntity = ({
                                id,
                                reporter_id,
                                target_type,
                                target_id,
                                reason,
                                status,
                                created_at,
                                reporter_name,
                                reporter_avatar
                            }) => ({
    id,
    reporter_id,
    target_type,
    target_id,
    reason,
    status,
    created_at,
    reporter_name,
    reporter_avatar
});

module.exports = {
    REPORT_TARGETS,
    REPORT_STATUSES,
    createReportEntity
};