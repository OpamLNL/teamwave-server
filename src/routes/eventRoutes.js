const express = require('express');
const router = express.Router();

const eventController = require('../controllers/eventController');
const eventTeamController = require('../controllers/eventTeamController');
const typingRaceController = require('../controllers/typingRaceController');
const { uploadImages } = require('../middlewares/uploadMiddleware');
const firebaseAuthMiddleware = require('../middlewares/firebaseAuthMiddleware');
const optionalFirebaseAuth = firebaseAuthMiddleware.optionalFirebaseAuth;
const { isAuthenticated } = require('../middlewares/roleMiddleware');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const optionalAuth = optionalFirebaseAuth;

router.get('/', asyncHandler(eventController.listEvents));
router.get('/me', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.getMyEvents));
router.get('/code/:code', asyncHandler(eventController.getEventByJoinCode));

router.post('/', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.createEvent));
router.post('/from-template/:templateId', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.createEventFromTemplate));
router.post('/join', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.joinByCode));

router.get('/:id/cover-image', asyncHandler(eventController.streamEventCover));
router.get('/:id/activities', asyncHandler(eventController.getEventActivities));
router.get('/:id/participants', asyncHandler(eventController.getEventParticipants));
router.get('/:id/team-leaderboard', asyncHandler(eventController.getEventTeamLeaderboard));
router.get('/:id/teams', asyncHandler(eventTeamController.getEventTeams));

router.get('/:id/activities/:activityId/typing-state', optionalAuth, asyncHandler(typingRaceController.getTypingState));

router.post('/:id/join', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.joinEvent));
router.post('/:id/leave', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.leaveEvent));
router.post('/:id/teams', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventTeamController.createEventTeam));
router.post('/:id/teams/:teamId/join', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventTeamController.joinEventTeam));
router.post('/:id/teams/:teamId/ready', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventTeamController.markTeamReady));
router.post('/:id/activities/:activityId/start', firebaseAuthMiddleware, isAuthenticated, asyncHandler(typingRaceController.startTypingRace));
router.post('/:id/activities/:activityId/type', firebaseAuthMiddleware, isAuthenticated, asyncHandler(typingRaceController.typeCharacter));
router.post('/:id/activities/:activityId/finish', firebaseAuthMiddleware, isAuthenticated, asyncHandler(typingRaceController.finishTypingRace));

router.delete('/:id/teams/:teamId/join', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventTeamController.leaveEventTeam));

router.get('/:id', asyncHandler(eventController.getEventById));

router.put('/:id', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.updateEvent));
router.post(
    '/:id/cover',
    firebaseAuthMiddleware,
    isAuthenticated,
    uploadImages.single('cover'),
    asyncHandler(eventController.uploadEventCover)
);
router.delete('/:id', firebaseAuthMiddleware, isAuthenticated, asyncHandler(eventController.deleteEvent));

module.exports = router;
