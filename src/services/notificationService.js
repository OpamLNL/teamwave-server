const notificationRepository = require('../repositories/notificationRepository');
const eventRepository = require('../repositories/eventRepository');
const commentRepository = require('../repositories/commentRepository');

const resolveContentOwner = async (targetType, targetId) => {
    if (targetType === 'event') {
        const event = await eventRepository.getEventById(targetId);
        return event?.organizer_id ?? null;
    }
    if (targetType === 'activity') {
        const { query } = require('../config/database');
        const activityRows = await query(
            'SELECT e.organizer_id FROM activities a JOIN events e ON a.event_id = e.id WHERE a.id = ?',
            [targetId]
        );
        return activityRows[0]?.organizer_id ?? null;
    }
    if (targetType === 'comment') {
        const comment = await commentRepository.getCommentById(targetId);
        return comment?.user_id ?? null;
    }
    if (targetType === 'submission') {
        return null;
    }
    return null;
};

const createIfNotSelf = async ({ recipientId, actorId, type, targetType, targetId, preview }) => {
    if (!recipientId || !actorId || Number(recipientId) === Number(actorId)) {
        return null;
    }

    return notificationRepository.createNotification({
        user_id: recipientId,
        actor_id: actorId,
        type,
        target_type: targetType,
        target_id: targetId,
        preview,
    });
};

const notifyLike = async ({ actor_id, target_type, target_id }) => {
    try {
        const ownerId = await resolveContentOwner(target_type, target_id);
        if (!ownerId) return;

        let preview = null;
        if (target_type === 'event') {
            const event = await eventRepository.getEventById(target_id);
            preview = event?.title || null;
        } else if (target_type === 'comment') {
            const comment = await commentRepository.getCommentById(target_id);
            preview = comment?.content?.slice(0, 120) || null;
        }

        await createIfNotSelf({
            recipientId: ownerId,
            actorId: actor_id,
            type: 'score_update',
            targetType: target_type,
            targetId: target_id,
            preview,
        });
    } catch (err) {
        console.error('notifyLike error:', err.message);
    }
};

const notifyComment = async ({ actor_id, target_type, target_id, content }) => {
    try {
        const ownerId = await resolveContentOwner(target_type, target_id);
        if (!ownerId) return;

        await createIfNotSelf({
            recipientId: ownerId,
            actorId: actor_id,
            type: 'feedback_request',
            targetType: target_type,
            targetId: target_id,
            preview: content?.slice(0, 120) || null,
        });
    } catch (err) {
        console.error('notifyComment error:', err.message);
    }
};

const notifyEventInvite = async ({ recipientId, actorId, eventId, preview }) => {
    try {
        await createIfNotSelf({
            recipientId,
            actorId,
            type: 'event_invite',
            targetType: 'event',
            targetId: eventId,
            preview,
        });
    } catch (err) {
        console.error('notifyEventInvite error:', err.message);
    }
};

module.exports = {
    notifyLike,
    notifyComment,
    notifyEventInvite,
};
