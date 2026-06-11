const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const commentRoutes = require('./commentRoutes');
const likeRoutes = require('./likeRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');
const contactRoutes = require('./contactRoutes');
const eventRoutes = require('./eventRoutes');
const eventTemplateRoutes = require('./eventTemplateRoutes');

router.use('/api/users', userRoutes);
router.use('/api/events', eventRoutes);
router.use('/api/event-templates', eventTemplateRoutes);
router.use('/api/comments', commentRoutes);
router.use('/api/likes', likeRoutes);
router.use('/api/favorites', favoriteRoutes);
router.use('/api/notifications', notificationRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/contact', contactRoutes);

module.exports = router;
