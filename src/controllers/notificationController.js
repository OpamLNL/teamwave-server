const notificationService = require('../services/notificationService');

const getMyNotifications = async (req, res) => {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.json(notifications);
};

const getUnreadCount = async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
};

const markAsRead = async (req, res) => {
    const result = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json(result);
};

const markAllAsRead = async (req, res) => {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(result);
};

module.exports = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
