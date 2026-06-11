/**
 * Замінює локальні /uploads/ та localhost URL у БД на публічні зображення.
 *
 *   cd teamwave-server
 *   node scripts/replace-local-media-with-public-urls.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { query, closePool } = require('../src/config/database');
const fandomSeed = require('../src/seed/fandoms.json');

function isPublicHttps(url) {
    if (!url || typeof url !== 'string') return false;
    if (!/^https:\/\//i.test(url.trim())) return false;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(url)) return false;
    return true;
}

function isLocalMediaUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (isPublicHttps(trimmed)) return false;
    if (trimmed.startsWith('/uploads/')) return true;
    if (trimmed.startsWith('/images/')) return true;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(trimmed)) return true;
    return false;
}

function avatarUrl(userId) {
    const img = ((Number(userId) - 1) % 70) + 1;
    return `https://i.pravatar.cc/150?img=${img}`;
}

function workImageUrl(workId, imageId) {
    return `https://picsum.photos/seed/teamwave-work-${workId}-${imageId}/800/600`;
}

function fandomCoverUrl(fandom) {
    const fromSeed = fandomSeed.find((item) => Number(item.id) === Number(fandom.id));
    if (fromSeed?.cover_image && isPublicHttps(fromSeed.cover_image)) {
        return fromSeed.cover_image;
    }
    const seed = encodeURIComponent(String(fandom.name || fandom.id).toLowerCase().replace(/\s+/g, '-'));
    return `https://picsum.photos/seed/${seed}/400/300`;
}

function postImageUrl(postId) {
    return `https://picsum.photos/seed/teamwave-post-${postId}/640/480`;
}

async function replaceUserAvatars() {
    const users = await query(`SELECT id, avatar_url FROM users`);
    let count = 0;

    for (const user of users) {
        if (!isLocalMediaUrl(user.avatar_url)) continue;
        const nextUrl = avatarUrl(user.id);
        await query(
            `UPDATE users SET avatar_url = ?, avatar_delete_url = NULL WHERE id = ?`,
            [nextUrl, user.id]
        );
        count += 1;
        console.log(`✅ user #${user.id} avatar → ${nextUrl}`);
    }

    return count;
}

async function replaceWorkImages() {
    const images = await query(`SELECT id, work_id, image_path FROM work_images`);
    let count = 0;

    for (const image of images) {
        if (!isLocalMediaUrl(image.image_path)) continue;
        const nextUrl = workImageUrl(image.work_id, image.id);
        await query(
            `UPDATE work_images SET image_path = ?, delete_url = NULL WHERE id = ?`,
            [nextUrl, image.id]
        );
        count += 1;
        console.log(`✅ work_image #${image.id} → ${nextUrl}`);
    }

    return count;
}

async function replaceFandomCovers() {
    const fandoms = await query(`SELECT id, name, cover_image FROM fandoms`);
    let count = 0;

    for (const fandom of fandoms) {
        if (!isLocalMediaUrl(fandom.cover_image)) continue;
        const nextUrl = fandomCoverUrl(fandom);
        await query(`UPDATE fandoms SET cover_image = ? WHERE id = ?`, [nextUrl, fandom.id]);
        count += 1;
        console.log(`✅ fandom #${fandom.id} (${fandom.name}) → ${nextUrl}`);
    }

    return count;
}

async function replacePostImages() {
    let rows = [];
    try {
        rows = await query(`SELECT id, image_url FROM posts WHERE image_url IS NOT NULL AND image_url != ''`);
    } catch {
        return 0;
    }

    let count = 0;
    for (const post of rows) {
        if (!isLocalMediaUrl(post.image_url)) continue;
        const nextUrl = postImageUrl(post.id);
        await query(`UPDATE posts SET image_url = ? WHERE id = ?`, [nextUrl, post.id]);
        count += 1;
        console.log(`✅ post #${post.id} → ${nextUrl}`);
    }

    return count;
}

async function main() {
    console.log('🖼️  Заміна локальних URL на публічні зображення...\n');

    const stats = {
        avatars: await replaceUserAvatars(),
        works: await replaceWorkImages(),
        fandoms: await replaceFandomCovers(),
        posts: await replacePostImages(),
    };

    const total = Object.values(stats).reduce((sum, n) => sum + n, 0);
    console.log('\n📊 Підсумок:', stats);
    console.log(total > 0 ? `✅ Оновлено ${total} записів.` : 'ℹ️  Локальних URL не знайдено — нічого змінювати.');

    await closePool();
}

main().catch(async (err) => {
    console.error('❌', err.message || err);
    try {
        await closePool();
    } catch {
        // ignore
    }
    process.exit(1);
});
