const express = require('express');
const router = express.Router();

const eventController = require('../controllers/eventController');
const firebaseAuthMiddleware = require('../middlewares/firebaseAuthMiddleware');
const { isAuthenticated } = require('../middlewares/roleMiddleware');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', asyncHandler(eventController.listEvents));
router.get('/me', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.getMyEvents));
router.get('/code/:code', asyncHandler(eventController.getEventByJoinCode));
router.get('/:id/activities', asyncHandler(eventController.getEventActivities));
router.get('/:id/participants', asyncHandler(eventController.getEventParticipants));
router.get('/:id', asyncHandler(eventController.getEventById));

router.post('/', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.createEvent));
router.post('/join', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.joinByCode));
router.post('/:id/join', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.joinEvent));
router.post('/:id/leave', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.leaveEvent));

router.put('/:id', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.updateEvent));
router.delete('/:id', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.deleteEvent));

module.exports = router;
