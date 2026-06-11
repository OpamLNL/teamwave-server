const teammateService = require('../services/teammateService');

const getTeammates = async (req, res) => {
    const teammates = await teammateService.getTeammates(req.params.userId);
    res.json(teammates);
};

const getConnectionStatus = async (req, res) => {
    const profileUserId = req.params.userId;
    const status = await teammateService.getConnectionStatus(req.user?.id, profileUserId);
    res.json(status);
};

const getPendingIncoming = async (req, res) => {
    const requests = await teammateService.getPendingIncoming(req.user.id);
    res.json(requests);
};

const sendInvite = async (req, res) => {
    const result = await teammateService.sendInvite(req.user.id, Number(req.params.userId));
    res.json(result);
};

const acceptInvite = async (req, res) => {
    const result = await teammateService.acceptInvite(req.user.id, Number(req.params.userId));
    res.json(result);
};

const declineInvite = async (req, res) => {
    const result = await teammateService.declineInvite(req.user.id, Number(req.params.userId));
    res.json(result);
};

const cancelInvite = async (req, res) => {
    const result = await teammateService.cancelInvite(req.user.id, Number(req.params.userId));
    res.json(result);
};

const removeTeammate = async (req, res) => {
    const result = await teammateService.removeTeammate(req.user.id, Number(req.params.userId));
    res.json(result);
};

module.exports = {
    getTeammates,
    getConnectionStatus,
    getPendingIncoming,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
    removeTeammate,
};
