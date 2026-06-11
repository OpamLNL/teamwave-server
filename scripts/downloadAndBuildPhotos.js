const fs = require('fs');
const path = require('path');
const axios = require('axios');

const TYPES = ['mars', 'earth', 'moon'];
const MAX_PHOTOS = 20;
const NASA_SEARCH_URL = 'https://images-api.nasa.gov/search?q={query}&media_type=image';

async function fetchPhotos(type) {
    const url = NASA_SEARCH_URL.replace('{query}', type);
    const res = await axios.get(url);
    const items = res.data.collection.items.slice(0, MAX_PHOTOS);

    return items.map(item => {
        const data = item.data[0];
        const link = item.links?.[0]?.href || '';

        return {
            title: data.title,
            date: data.date_created.split('T')[0],
            description: data.description,
            thumbUrl: `/images/${type}/${path.basename(link)}`,
            originalUrl: link
        };
    });
}

async function downloadImage(url, type) {
    const filename = path.basename(url);
    const dir = path.join(__dirname, '..', 'public', 'images', type);
    const filepath = path.join(dir, filename);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filepath)) return; // пропустити, якщо файл вже є

    try {
        const res = await axios.get(url, { responseType: 'stream' });
        const writer = fs.createWriteStream(filepath);
        res.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log(`✅ Saved: ${filename}`);
    } catch (err) {
        console.warn(`❌ Failed to download ${url}: ${err.message}`);
    }
}

async function saveToJson(type, newPhotos) {
    const jsonPath = path.join(__dirname, '..', 'src', 'data', 'photos', `${type}.json`);
    const dirPath = path.dirname(jsonPath);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    let existing = [];

    if (fs.existsSync(jsonPath)) {
        try {
            const raw = fs.readFileSync(jsonPath, 'utf-8');
            existing = JSON.parse(raw);
        } catch {
            existing = [];
        }
    }

    const existingUrls = new Set(existing.map(p => p.thumbUrl));
    const merged = [...existing, ...newPhotos.filter(p => !existingUrls.has(p.thumbUrl))];

    fs.writeFileSync(jsonPath, JSON.stringify(merged, null, 2), 'utf-8');
    console.log(`📝 Updated ${type}.json (${merged.length} items)`);
}

async function run() {
    for (const type of TYPES) {
        console.log(`\n📡 Fetching ${type}...`);
        const photos = await fetchPhotos(type);
        await saveToJson(type, photos);

        for (const photo of photos) {
            await downloadImage(photo.originalUrl, type);
        }
    }
}

run();
