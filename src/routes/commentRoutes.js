const express = require('express');
const router = express.Router();

const commentController = require('../controllers/commentController');
const firebaseAuthMiddleware = require('../middlewares/firebaseAuthMiddleware');
const {
    isAuthenticated,
    isOwnerOrModeratorOrAdmin
} = require('../middlewares/roleMiddleware');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const commentRepository = require('../repositories/commentRepository');

const getCommentOwner = async (req) => {
    const comment = await commentRepository.getCommentById(req.params.id);
    if (!comment) throw new Error('Коментар не знайдено');
    return comment.user_id;
};

// get
router.get('/:type/:id', asyncHandler(commentController.getComments));
router.get('/single/:id', asyncHandler(commentController.getCommentById));

// create
router.post(
    '/',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(commentController.createComment)
);

// update
router.put(
    '/:id',
    firebaseAuthMiddleware,
    isOwnerOrModeratorOrAdmin(getCommentOwner),
    asyncHandler(commentController.updateComment)
);

// delete
router.delete(
    '/:id',
    firebaseAuthMiddleware,
    isOwnerOrModeratorOrAdmin(getCommentOwner),
    asyncHandler(commentController.deleteComment)
);

module.exports = router;