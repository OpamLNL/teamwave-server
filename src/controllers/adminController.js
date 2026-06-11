const adminService = require('../services/adminService');

const getStats = async (req, res) => {
    res.json(await adminService.getStats());
};

const getUsers = async (req, res) => {
    res.json(await adminService.getUsers());
};

const searchUsers = async (req, res) => {
    res.json(await adminService.searchUsers(req.query.query));
};

const updateUserRole = async (req, res) => {
    res.json(await adminService.updateUserRole(req.params.id, req.body.role));
};

const updateUserBlockedStatus = async (req, res) => {
    res.json(await adminService.updateUserBlockedStatus(req.params.id, req.body.is_blocked));
};

const deleteUser = async (req, res) => {
    await adminService.deleteUser(req.params.id);
    res.json({ success: true });
};

const updateCommentStatus = async (req, res) => {
    res.json(await adminService.updateCommentStatus(req.params.id, req.body.status));
};

const deleteComment = async (req, res) => {
    await adminService.deleteComment(req.params.id);
    res.json({ success: true });
};

const getAdminEvents = async (req, res) => {
    res.json(await adminService.getAdminEvents());
};

const updateEventStatus = async (req, res) => {
    res.json(await adminService.updateEventStatus(req.params.id, req.body.status));
};

const deleteEvent = async (req, res) => {
    await adminService.deleteEvent(req.params.id);
    res.json({ success: true });
};

const getAdminComments = async (req, res) => {
    res.json(await adminService.getAdminComments());
};

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
