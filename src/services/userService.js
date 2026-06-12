const fs = require('fs');
const path = require('path');
const userRepository = require('../repositories/userRepository');
const { USER_ROLES, createUserEntity } = require('../models/userModel');

const fileUploadService = require('./fileUploadService');
const imgbbService = require('./imgbbService');
const { getUploadsRoot } = require('../utils/uploadPaths');

const DEFAULT_AVATAR = '/images/users/default_avatar.png';

const resolveUserId = async (idOrUid) => {
    const raw = String(idOrUid).trim();

    if (/^\d+$/.test(raw)) {
        const user = await userRepository.getUserById(Number(raw));
        if (!user) throw new Error('Користувача не знайдено');
        return user.id;
    }

    const user = await userRepository.getUserByFirebaseUid(raw);
    if (!user) throw new Error('Користувача не знайдено');
    return user.id;
};

const getUserById = async (userId) => {
    const id = await resolveUserId(userId);
    const user = await userRepository.getUserById(id);

    if (!user) throw new Error('Користувача не знайдено');

    const stats = await userRepository.getUserStats(id);

    return createUserEntity({ ...user, ...stats });
};

const getUserByFirebaseUid = async (firebaseUid) => {
    const user = await userRepository.getUserByFirebaseUid(firebaseUid);

    if (!user) throw new Error('Користувача не знайдено');

    return createUserEntity(user);
};

const getUserByEmail = async (email) => {
    const user = await userRepository.getUserByEmail(email);

    if (!user) throw new Error('Користувача не знайдено');

    return createUserEntity(user);
};

const getAllUsers = async () => {
    const users = await userRepository.getAllUsers();
    return users.map(user => createUserEntity(user));
};

const searchUsers = async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
        return await getAllUsers();
    }

    const users = await userRepository.searchUsers(searchQuery.trim());
    return users.map(user => createUserEntity(user));
};

const getUserEvents = async (userId) => {
    const id = await resolveUserId(userId);
    const user = await userRepository.getUserById(id);
    if (!user) throw new Error('Користувача не знайдено');
    return userRepository.getUserEvents(id);
};

const getUserComments = async (userId) => {
    const id = await resolveUserId(userId);
    const user = await userRepository.getUserById(id);

    if (!user) throw new Error('Користувача не знайдено');

    return await userRepository.getUserComments(id);
};

const getReceivedComments = async (userId) => {
    const id = await resolveUserId(userId);
    const user = await userRepository.getUserById(id);

    if (!user) throw new Error('Користувача не знайдено');

    return await userRepository.getReceivedComments(id);
};

const getUserStats = async (userId) => {
    const id = await resolveUserId(userId);
    const user = await userRepository.getUserById(id);

    if (!user) throw new Error('Користувача не знайдено');

    return await userRepository.getUserStats(id);
};

const getUserTeams = async (userId) => {
    const id = await resolveUserId(userId);
    const user = await userRepository.getUserById(id);
    if (!user) throw new Error('Користувача не знайдено');
    return userRepository.getUserTeams(id);
};

const getPopularAuthors = async (limit = 3) => {
    return userRepository.getPopularAuthors(limit);
};

const createUser = async ({ firebase_uid, email, name, avatar_url, role }) => {
    if (!firebase_uid) throw new Error('Firebase UID обовʼязковий');

    if (role && !Object.values(USER_ROLES).includes(role)) {
        throw new Error('Некоректна роль користувача');
    }

    const existing = await userRepository.getUserByFirebaseUid(firebase_uid);

    if (existing) {
        return createUserEntity(existing);
    }

    const user = await userRepository.createUser({
        firebase_uid,
        email: email || null,
        name: name || 'Новий користувач',
        avatar_url: avatar_url || DEFAULT_AVATAR,
        role: role || USER_ROLES.PARTICIPANT
    });

    return createUserEntity(user);
};


const updateUser = async (userId, userData) => {
    const existing = await userRepository.getUserById(userId);

    if (!existing) throw new Error('Користувача не знайдено');

    await userRepository.updateUser(userId, {
        email: userData.email !== undefined ? userData.email : existing.email,
        name: userData.name !== undefined ? userData.name : existing.name,
        avatar_url: userData.avatar_url !== undefined ? userData.avatar_url : existing.avatar_url,
        bio: userData.bio !== undefined ? userData.bio : existing.bio,
        company: userData.company !== undefined ? userData.company : existing.company,
        position: userData.position !== undefined ? userData.position : existing.position,
        timezone: userData.timezone !== undefined ? userData.timezone : existing.timezone,
        interests: userData.interests !== undefined ? userData.interests : existing.interests,
        ...(userData.show_mature_content !== undefined
            ? { show_mature_content: Boolean(userData.show_mature_content) }
            : {}),
    });

    return await getUserById(userId);
};

const uploadUserAvatar = async (userId, file, user) => {
    if (user?.is_blocked) {
        throw new Error('Користувач заблокований');
    }

    const existing = await userRepository.getUserById(userId);
    if (!existing) throw new Error('Користувача не знайдено');

    if (!file) {
        throw new Error('Файл аватара не передано');
    }

    const uploaded = await fileUploadService.saveUserAvatar(userId, file);

    if (existing.avatar_delete_url) {
        await imgbbService.deleteByUrl(existing.avatar_delete_url);
    } else if (imgbbService.isLocalUploadPath(existing.avatar_url)) {
        const localPath = path.resolve(__dirname, '..', '..', String(existing.avatar_url).replace(/^\/+/, ''));
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
        }
    }

    await userRepository.updateUser(userId, {
        email: existing.email,
        name: existing.name,
        avatar_url: uploaded.url,
        avatar_delete_url: uploaded.deleteUrl,
    });

    return await getUserById(userId);
};

const streamUserAvatar = async (userId, res) => {
    const id = await resolveUserId(userId);
    const user = await userRepository.getUserById(id);

    if (!user?.avatar_url) {
        throw new Error('Аватар не знайдено');
    }

    const avatarUrl = user.avatar_url;

    if (imgbbService.isLocalUploadPath(avatarUrl)) {
        const relative = String(avatarUrl).replace(/^\/uploads\/?/, '');
        const localPath = path.join(getUploadsRoot(), relative);

        if (!fs.existsSync(localPath)) {
            throw new Error('Файл аватара не знайдено');
        }

        res.set('Cache-Control', 'public, max-age=86400');
        return res.sendFile(localPath);
    }

    const response = await fetch(avatarUrl, {
        headers: { 'User-Agent': 'TeamWave-Server/1.0' },
    });

    if (!response.ok) {
        throw new Error('Не вдалося завантажити аватар');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(await response.arrayBuffer()));
};

const updateUserRole = async (userId, role) => {
    const existing = await userRepository.getUserById(userId);

    if (!existing) throw new Error('Користувача не знайдено');

    if (!Object.values(USER_ROLES).includes(role)) {
        throw new Error('Некоректна роль користувача');
    }

    await userRepository.updateUserRole(userId, role);

    return await getUserById(userId);
};

const updateUserBlockedStatus = async (userId, isBlocked) => {
    const existing = await userRepository.getUserById(userId);

    if (!existing) throw new Error('Користувача не знайдено');

    await userRepository.updateUserBlockedStatus(userId, Boolean(isBlocked));

    return await getUserById(userId);
};

const deleteUser = async (userId) => {
    const existing = await userRepository.getUserById(userId);

    if (!existing) throw new Error('Користувача не знайдено');

    await userRepository.deleteUser(userId);

    return { id: userId };
};

module.exports = {
    getUserById,
    getUserByFirebaseUid,
    getUserByEmail,
    getAllUsers,
    searchUsers,
    getUserEvents,
    getUserComments,
    getReceivedComments,
    getUserStats,
    getUserTeams,
    getPopularAuthors,
    createUser,
    updateUser,
    uploadUserAvatar,
    streamUserAvatar,
    updateUserRole,
    updateUserBlockedStatus,
    deleteUser
};