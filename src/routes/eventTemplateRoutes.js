const express = require('express');
const router = express.Router();

const eventTemplateController = require('../controllers/eventTemplateController');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', asyncHandler(eventTemplateController.listTemplates));
router.get('/:id', asyncHandler(eventTemplateController.getTemplateById));

module.exports = router;
