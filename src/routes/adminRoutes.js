const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const firebaseAuthMiddleware = require('../middlewares/firebaseAuthMiddleware');
const { isAuthenticated, isAdmin, isModeratorOrAdmin } = require('../middlewares/roleMiddleware');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.use(firebaseAuthMiddleware);
router.use(isAuthenticated);

router.get('/stats', isModeratorOrAdmin, asyncHandler(adminController.getStats));
router.get('/events', isModeratorOrAdmin, asyncHandler(adminController.getAdminEvents));
router.patch('/events/:id/status', isModeratorOrAdmin, asyncHandler(adminController.updateEventStatus));
router.delete('/events/:id', isModeratorOrAdmin, asyncHandler(adminController.deleteEvent));
router.get('/comments', isModeratorOrAdmin, asyncHandler(adminController.getAdminComments));
router.patch('/comments/:id/status', isModeratorOrAdmin, asyncHandler(adminController.updateCommentStatus));
router.delete('/comments/:id', isModeratorOrAdmin, asyncHandler(adminController.deleteComment));

router.get('/users', isAdmin, asyncHandler(adminController.getUsers));
router.get('/users/search', isAdmin, asyncHandler(adminController.searchUsers));
router.patch('/users/:id/role', isAdmin, asyncHandler(adminController.updateUserRole));
router.patch('/users/:id/block', isAdmin, asyncHandler(adminController.updateUserBlockedStatus));
router.delete('/users/:id', isAdmin, asyncHandler(adminController.deleteUser));

module.exports = router;
