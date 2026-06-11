const contactService = require('../services/contactService');

const createMessage = async (req, res) => {
    const result = await contactService.createMessage(req.body);
    res.status(201).json({ success: true, id: result.id });
};

module.exports = {
    createMessage,
};
