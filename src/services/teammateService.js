const teammateRepository = require('../repositories/teammateRepository');
const userRepository = require('../repositories/userRepository');
const notificationService = require('./notificationService');

const resolveUserId = async (idOrUid) => {
    const raw = String(idOrUid).trim();
    if (/^\d+$/.test(raw)) {
        const user = await userRepository.getUserById(Number(raw));
        if (!user) throw new Error('Користувача не знайдено');
        return user.id;
    }
    const user = await userRepository.getUserByFirebaseUid(raw);
    if (!user) throw new Error('Користувача не знайдено');
    return user.id;
};

const getConnectionStatus = async (viewerId, profileUserId) => {
    if (!viewerId) {
        return { status: 'guest' };
    }
    if (Number(viewerId) === Number(profileUserId)) {
        return { status: 'self' };
    }

    const sent = await teammateRepository.getRequestBetween(viewerId, profileUserId);
    if (sent?.status === 'accepted') {
        return { status: 'accepted', request_id: sent.id };
    }
    if (sent?.status === 'pending') {
        return { status: 'pending_sent', request_id: sent.id };
    }

    const received = await teammateRepository.getRequestBetween(profileUserId, viewerId);
    if (received?.status === 'accepted') {
        return { status: 'accepted', request_id: received.id };
    }
    if (received?.status === 'pending') {
        return { status: 'pending_received', request_id: received.id };
    }

    return { status: 'none' };
};

const getTeammates = async (userId) => {
    const id = await resolveUserId(userId);
    return teammateRepository.getTeammates(id);
};

const getPendingIncoming = async (userId) => {
    return teammateRepository.getPendingIncoming(userId);
};

const sendInvite = async (fromUserId, toUserId) => {
    if (Number(fromUserId) === Number(toUserId)) {
        throw new Error('Не можна запросити самого себе');
    }

    const target = await userRepository.getUserById(toUserId);
    if (!target) throw new Error('Користувача не знайдено');
    if (target.is_blocked) throw new Error('Користувач недоступний');

    const existingSent = await teammateRepository.getRequestBetween(fromUserId, toUserId);
    if (existingSent?.status === 'accepted') {
        throw new Error('Користувач уже у вашій команді');
    }
    if (existingSent?.status === 'pending') {
        return { status: 'pending_sent', request_id: existingSent.id, already_sent: true };
    }

    const existingReceived = await teammateRepository.getRequestBetween(toUserId, fromUserId);
    if (existingReceived?.status === 'pending') {
        await teammateRepository.updateRequestStatus(existingReceived.id, 'accepted');
        return { status: 'accepted', request_id: existingReceived.id, auto_accepted: true };
    }
    if (existingReceived?.status === 'accepted') {
        throw new Error('Користувач уже у вашій команді');
    }

    if (existingSent?.status === 'declined') {
        await teammateRepository.updateRequestStatus(existingSent.id, 'pending');
        await notificationService.notifyTeamInvite({
            recipientId: toUserId,
            actorId: fromUserId,
        });
        return { status: 'pending_sent', request_id: existingSent.id };
    }

    const request = await teammateRepository.createRequest(fromUserId, toUserId);
    await notificationService.notifyTeamInvite({
        recipientId: toUserId,
        actorId: fromUserId,
    });
    return { status: 'pending_sent', request_id: request.id };
};

const acceptInvite = async (userId, fromUserId) => {
    const request = await teammateRepository.getRequestBetween(fromUserId, userId);
    if (!request || request.status !== 'pending') {
        throw new Error('Запрошення не знайдено');
    }
    await teammateRepository.updateRequestStatus(request.id, 'accepted');
    return { status: 'accepted', request_id: request.id };
};

const declineInvite = async (userId, fromUserId) => {
    const request = await teammateRepository.getRequestBetween(fromUserId, userId);
    if (!request || request.status !== 'pending') {
        throw new Error('Запрошення не знайдено');
    }
    await teammateRepository.updateRequestStatus(request.id, 'declined');
    return { status: 'declined', request_id: request.id };
};

const cancelInvite = async (userId, toUserId) => {
    const request = await teammateRepository.getRequestBetween(userId, toUserId);
    if (!request || request.status !== 'pending') {
        throw new Error('Активного запрошення немає');
    }
    await teammateRepository.deleteRequest(request.id);
    return { status: 'none' };
};

const removeTeammate = async (userId, otherUserId) => {
    await teammateRepository.deleteConnectionBetween(userId, otherUserId);
    return { status: 'none' };
};

module.exports = {
    getConnectionStatus,
    getTeammates,
    getPendingIncoming,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
    removeTeammate,
};
