const commentRepository = require('../repositories/commentRepository');
const { COMMENT_TARGETS, createCommentEntity } = require('../models/commentModel');
const notificationService = require('./notificationService');

const getCommentsByTarget = async (targetType, targetId) => {
    if (!Object.values(COMMENT_TARGETS).includes(targetType)) {
        throw new Error('Некоректний тип цілі');
    }

    const comments = await commentRepository.getCommentsByTarget(targetType, targetId);

    return comments.map(c => createCommentEntity(c));
};

const getCommentById = async (id) => {
    const comment = await commentRepository.getCommentById(id);

    if (!comment) {
        throw new Error('Коментар не знайдено');
    }

    return createCommentEntity(comment);
};

const createComment = async (data, user) => {
    if (user?.is_blocked) {
        throw new Error('Користувач заблокований');
    }

    const { user_id, target_type, target_id, content } = data;

    if (!user_id) throw new Error('user_id обовʼязковий');
    if (!target_id) throw new Error('target_id обовʼязковий');
    if (!content || !content.trim()) throw new Error('Текст коментаря обовʼязковий');

    if (!Object.values(COMMENT_TARGETS).includes(target_type)) {
        throw new Error('Некоректний target_type');
    }

    const comment = await commentRepository.createComment({
        user_id,
        target_type,
        target_id,
        content: content.trim()
    });

    notificationService.notifyComment({
        actor_id: user_id,
        target_type,
        target_id,
        content: content.trim(),
    });

    return await getCommentById(comment.id);
};

const updateComment = async (id, userId, content, user) => {
    if (user?.is_blocked) {
        throw new Error('Користувач заблокований');
    }

    const existing = await commentRepository.getCommentById(id);

    if (!existing) {
        throw new Error('Коментар не знайдено');
    }

    if (existing.user_id !== userId) {
        throw new Error('Немає прав редагувати коментар');
    }

    if (!content || !content.trim()) {
        throw new Error('Текст обовʼязковий');
    }

    await commentRepository.updateComment(id, content.trim());

    return await getCommentById(id);
};

const deleteComment = async (id, userId, role) => {
    const existing = await commentRepository.getCommentById(id);

    if (!existing) {
        throw new Error('Коментар не знайдено');
    }

    if (existing.user_id !== userId && !['admin', 'organizer'].includes(role)) {
        throw new Error('Немає прав видаляти');
    }

    return await commentRepository.deleteComment(id);
};

module.exports = {
    getCommentsByTarget,
    getCommentById,
    createComment,
    updateComment,
    deleteComment
};