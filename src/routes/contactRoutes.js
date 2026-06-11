const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contactController');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/', asyncHandler(contactController.createMessage));

module.exports = router;
