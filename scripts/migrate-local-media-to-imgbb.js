/**
 * Одноразова міграція локальних /uploads/ URL у БД → ImgBB.
 * Запускати ЛОКАЛЬНО (де є папка uploads/ з файлами):
 *
 *   cd teamwave-server
 *   node scripts/migrate-local-media-to-imgbb.js
 *
 * Потрібно: .env з DB_* та IMGBB_API_KEY
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { query, closePool } = require('../src/config/database');
const imgbbService = require('../src/services/imgbbService');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

function isLocalMediaUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (imgbbService.isHostedImageUrl(url)) return false;
    if (url.startsWith('/uploads/')) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\//i.test(url);
}

function localPathFromUrl(url) {
    const normalized = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
    const relative = normalized.replace(/^\/+/, '');
    if (!relative.startsWith('uploads/')) return null;
    return path.join(__dirname, '..', relative);
}

async function uploadLocalFile(absolutePath, name) {
    const buffer = fs.readFileSync(absolutePath);
    return imgbbService.uploadImage(buffer, name);
}

async function migrateUserAvatars() {
    const users = await query(
        `SELECT id, avatar_url FROM users WHERE avatar_url IS NOT NULL AND avatar_url != ''`
    );

    for (const user of users) {
        if (!isLocalMediaUrl(user.avatar_url)) continue;

        const filePath = localPathFromUrl(user.avatar_url);
        if (!filePath || !fs.existsSync(filePath)) {
            console.warn(`⚠️  avatar user #${user.id}: файл не знайдено (${user.avatar_url})`);
            continue;
        }

        const uploaded = await uploadLocalFile(filePath, `avatar-${user.id}`);
        await query(
            `UPDATE users SET avatar_url = ?, avatar_delete_url = ? WHERE id = ?`,
            [uploaded.url, uploaded.deleteUrl, user.id]
        );
        console.log(`✅ avatar user #${user.id} → ${uploaded.url}`);
    }
}

async function migrateWorkImages() {
    const images = await query(`SELECT id, work_id, image_path FROM work_images`);

    for (const image of images) {
        if (!isLocalMediaUrl(image.image_path)) continue;

        const filePath = localPathFromUrl(image.image_path);
        if (!filePath || !fs.existsSync(filePath)) {
            console.warn(`⚠️  work_image #${image.id}: файл не знайдено (${image.image_path})`);
            continue;
        }

        const uploaded = await uploadLocalFile(filePath, `work-${image.work_id}-${image.id}`);
        await query(
            `UPDATE work_images SET image_path = ?, delete_url = ? WHERE id = ?`,
            [uploaded.url, uploaded.deleteUrl, image.id]
        );
        console.log(`✅ work_image #${image.id} → ${uploaded.url}`);
    }
}

async function migrateFandomCovers() {
    const fandoms = await query(
        `SELECT id, cover_image FROM fandoms WHERE cover_image IS NOT NULL AND cover_image != ''`
    );

    for (const fandom of fandoms) {
        if (!isLocalMediaUrl(fandom.cover_image)) continue;

        const filePath = localPathFromUrl(fandom.cover_image);
        if (!filePath || !fs.existsSync(filePath)) {
            console.warn(`⚠️  fandom #${fandom.id}: файл не знайдено (${fandom.cover_image})`);
            continue;
        }

        const uploaded = await uploadLocalFile(filePath, `fandom-${fandom.id}`);
        await query(`UPDATE fandoms SET cover_image = ? WHERE id = ?`, [uploaded.url, fandom.id]);
        console.log(`✅ fandom #${fandom.id} → ${uploaded.url}`);
    }
}

async function migratePostImages() {
    let rows = [];
    try {
        rows = await query(
            `SELECT id, image_url FROM posts WHERE image_url IS NOT NULL AND image_url != ''`
        );
    } catch {
        return;
    }

    for (const post of rows) {
        if (!isLocalMediaUrl(post.image_url)) continue;

        const filePath = localPathFromUrl(post.image_url);
        if (!filePath || !fs.existsSync(filePath)) {
            console.warn(`⚠️  post #${post.id}: файл не знайдено (${post.image_url})`);
            continue;
        }

        const uploaded = await uploadLocalFile(filePath, `post-${post.id}`);
        await query(`UPDATE posts SET image_url = ? WHERE id = ?`, [uploaded.url, post.id]);
        console.log(`✅ post #${post.id} → ${uploaded.url}`);
    }
}

async function main() {
    if (!imgbbService.isConfigured()) {
        console.error('❌ IMGBB_API_KEY не задано в .env');
        process.exit(1);
    }

    if (!fs.existsSync(UPLOADS_ROOT)) {
        console.warn(`⚠️  Папка uploads не знайдена: ${UPLOADS_ROOT}`);
    }

    console.log('🚀 Міграція локальних зображень на ImgBB...\n');

    await migrateUserAvatars();
    await migrateWorkImages();
    await migrateFandomCovers();
    await migratePostImages();

    console.log('\n✅ Готово.');
    await closePool();
}

main().catch(async (err) => {
    console.error('❌', err);
    try {
        await closePool();
    } catch {
        // ignore
    }
    process.exit(1);
});
