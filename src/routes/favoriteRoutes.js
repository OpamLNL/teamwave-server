const express = require('express');
const router = express.Router();

const favoriteController = require('../controllers/favoriteController');
const firebaseAuthMiddleware = require('../middlewares/firebaseAuthMiddleware');
const { isAuthenticated } = require('../middlewares/roleMiddleware');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @swagger
 * tags:
 *   - name: Favorites
 *     description: Обране
 */

/**
 * @swagger
 * /api/favorites/toggle:
 *   post:
 *     summary: Додати або прибрати з обраного
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FavoriteBody'
 *             required:
 *               - target_type
 *               - target_id
 *             properties:
 *               target_type:
 *                 type: string
 *                 enum: [work, post]
 *                 example: work
 *               target_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
    '/toggle',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(favoriteController.toggleFavorite)
);

/**
 * @swagger
 * /api/favorites/user/{userId}:
 *   get:
 *     summary: Отримати обране користувача
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID користувача
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
    '/me',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(favoriteController.getUserFavorites)
);

router.get(
    '/me/items',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(favoriteController.getUserFavoriteItems)
);

router.get(
    '/user/:userId',
    firebaseAuthMiddleware,
    isAuthenticated,
    asyncHandler(favoriteController.getUserFavoritesById)
);

module.exports = router;