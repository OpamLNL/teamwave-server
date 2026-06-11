const adminRepository = require('../repositories/adminRepository');

const USER_ROLES = ['participant', 'host', 'organizer', 'admin'];
const CONTENT_STATUSES = ['active', 'hidden', 'blocked'];
const EVENT_STATUSES = ['draft', 'planned', 'active', 'finished'];

const getStats = async () => adminRepository.getStats();
const getUsers = async () => adminRepository.getUsers();

const searchUsers = async (query) => {
    if (!query || !query.trim()) return getUsers();
    return adminRepository.searchUsers(query.trim());
};

const updateUserRole = async (id, role) => {
    if (!USER_ROLES.includes(role)) {
        throw new Error('Некоректна роль користувача');
    }
    return adminRepository.updateUserRole(id, role);
};

const updateUserBlockedStatus = async (id, isBlocked) =>
    adminRepository.updateUserBlockedStatus(id, isBlocked);

const deleteUser = async (id) => adminRepository.deleteUser(id);

const updateCommentStatus = async (id, status) => {
    if (!CONTENT_STATUSES.includes(status)) {
        throw new Error('Некоректний статус коментаря');
    }
    return adminRepository.updateCommentStatus(id, status);
};

const deleteComment = async (id) => adminRepository.deleteComment(id);

const getAdminEvents = async () => adminRepository.getAdminEvents();

const updateEventStatus = async (id, status) => {
    if (!EVENT_STATUSES.includes(status)) {
        throw new Error('Некоректний статус заходу');
    }
    return adminRepository.updateEventStatus(id, status);
};

const deleteEvent = async (id) => adminRepository.deleteEvent(id);

const getAdminComments = async () => adminRepository.getAdminComments();

module.exports = {
    getStats,
    getUsers,
    searchUsers,
    updateUserRole,
    updateUserBlockedStatus,
    deleteUser,
    updateCommentStatus,
    deleteComment,
    getAdminEvents,
    updateEventStatus,
    deleteEvent,
    getAdminComments,
};
