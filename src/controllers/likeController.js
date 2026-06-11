const likeService = require('../services/likeService');

const toggleLike = async (req, res) => {
    const result = await likeService.toggleLike(
        {
            user_id: req.user.id,
            target_type: req.body.target_type,
            target_id: req.body.target_id
        },
        req.user
    );

    res.json(result);
};

const getLikesCount = async (req, res) => {
    const result = await likeService.getLikesCount(
        req.query.target_type,
        req.query.target_id
    );

    res.json(result);
};

const getUserLikes = async (req, res) => {
    const likes = await likeService.getUserLikes(req.params.userId);
    res.json(likes);
};

module.exports = {
    toggleLike,
    getLikesCount,
    getUserLikes
};