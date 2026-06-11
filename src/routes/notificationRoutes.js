const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const firebaseAuthMiddleware = require('../middlewares/firebaseAuthMiddleware');
const { isAuthenticated } = require('../middlewares/roleMiddleware');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get(
    '/me',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(notificationController.getMyNotifications)
);

router.get(
    '/me/unread-count',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(notificationController.getUnreadCount)
);

router.post(
    '/me/read-all',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(notificationController.markAllAsRead)
);

router.patch(
    '/:id/read',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(notificationController.markAsRead)
);

module.exports = router;
