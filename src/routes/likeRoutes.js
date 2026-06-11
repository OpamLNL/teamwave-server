const express = require('express');
const router = express.Router();

const likeController = require('../controllers/likeController');
const firebaseAuthMiddleware = require('../middlewares/firebaseAuthMiddleware');
const { isAuthenticated } = require('../middlewares/roleMiddleware');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// toggle like (тільки авторизований)
router.post(
    '/toggle',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(likeController.toggleLike)
);

// отримати кількість лайків (публічний)
router.get('/count', asyncHandler(likeController.getLikesCount));

// отримати лайки користувача (тільки свій або адмін/модератор — поки просто auth)
router.get(
    '/user/:userId',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(likeController.getUserLikes)
);

module.exports = router;