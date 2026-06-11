const commentService = require('../services/commentService');

const getComments = async (req, res) => {
    const { type, id } = req.params;
    const comments = await commentService.getCommentsByTarget(type, id);
    res.json(comments);
};

const getCommentById = async (req, res) => {
    const comment = await commentService.getCommentById(req.params.id);
    res.json(comment);
};

const createComment = async (req, res) => {
    const comment = await commentService.createComment(
        {
            user_id: req.user.id,
            target_type: req.body.target_type,
            target_id: req.body.target_id,
            content: req.body.content
        },
        req.user
    );

    res.status(201).json(comment);
};

const updateComment = async (req, res) => {
    const comment = await commentService.updateComment(
        req.params.id,
        req.user.id,
        req.body.content,
        req.user
    );

    res.json(comment);
};

const deleteComment = async (req, res) => {
    await commentService.deleteComment(
        req.params.id,
        req.user.id,
        req.user.role
    );

    res.json({ success: true });
};

module.exports = {
    getComments,
    getCommentById,
    createComment,
    updateComment,
    deleteComment
};