const express = require('express');
const router = express.Router();

const teammateController = require('../controllers/teammateController');
const firebaseAuthMiddleware = require('../middlewares/firebaseAuthMiddleware');
const optionalFirebaseAuth = require('../middlewares/optionalFirebaseAuth');
const { isAuthenticated } = require('../middlewares/roleMiddleware');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/users/:userId', asyncHandler(teammateController.getTeammates));

router.get(
    '/users/:userId/status',
    optionalFirebaseAuth,
    asyncHandler(teammateController.getConnectionStatus)
);

router.get(
    '/me/incoming',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(teammateController.getPendingIncoming)
);

router.post(
    '/users/:userId/invite',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(teammateController.sendInvite)
);

router.post(
    '/users/:userId/accept',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(teammateController.acceptInvite)
);

router.post(
    '/users/:userId/decline',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(teammateController.declineInvite)
);

router.delete(
    '/users/:userId/invite',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(teammateController.cancelInvite)
);

router.delete(
    '/users/:userId',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(teammateController.removeTeammate)
);

module.exports = router;
