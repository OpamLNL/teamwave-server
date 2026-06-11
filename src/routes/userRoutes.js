const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const firebaseAuthMiddleware = require('../middlewares/firebaseAuthMiddleware');
const { uploadImages } = require('../middlewares/uploadMiddleware');

const {
    isAdmin,
    isAuthenticated,
    isOwner
} = require('../middlewares/roleMiddleware');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// public
router.get('/search', asyncHandler(userController.searchUsers));
router.get('/popular', asyncHandler(userController.getPopularAuthors));

router.get('/firebase/:firebaseUid', asyncHandler(userController.getUserByFirebaseUid));
router.get('/email/:email', asyncHandler(userController.getUserByEmail));

router.get(
    '/me',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(userController.getMe)
);
router.get(
    '/me/events',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(userController.getMyEvents)
);
router.get(
    '/me/comments/received',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(userController.getMyReceivedComments)
);
router.get(
    '/me/comments',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(userController.getMyComments)
);

router.get('/:id/events', asyncHandler(userController.getUserEvents));
router.get('/:id/comments', asyncHandler(userController.getUserComments));
router.get('/:id/stats', asyncHandler(userController.getUserStats));

router.get('/', asyncHandler(userController.getAllUsers));
router.get('/:id', asyncHandler(userController.getUserById));

// create
router.post('/', asyncHandler(userController.createUser));

// update profile: сам користувач / модератор / адмін
router.put(
    '/me',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(userController.updateMe)
);

router.post(
    '/me/avatar',
    firebaseAuthMiddleware,
    isAuthenticated,
    uploadImages.single('avatar'),
    asyncHandler(userController.uploadMyAvatar)
);

router.put(
    '/:id',
    firebaseAuthMiddleware,
    isOwner((req) => req.params.id),
    asyncHandler(userController.updateUser)
);

router.post(
    '/:id/avatar',
    firebaseAuthMiddleware,
    isOwner((req) => req.params.id),
    uploadImages.single('avatar'),
    asyncHandler(userController.uploadAvatar)
);

// change role: тільки адмін
router.patch(
    '/:id/role',
    firebaseAuthMiddleware,
    isAdmin,
    asyncHandler(userController.updateUserRole)
);

// block/unblock: тільки адмін
router.patch(
    '/:id/block',
    firebaseAuthMiddleware,
    isAdmin,
    asyncHandler(userController.updateUserBlockedStatus)
);

// delete user: тільки адмін
router.delete(
    '/:id',
    firebaseAuthMiddleware,
    isAdmin,
    asyncHandler(userController.deleteUser)
);

module.exports = router;