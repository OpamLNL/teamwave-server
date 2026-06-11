jest.mock('../src/config/database', () => ({
    query: jest.fn(),
}));

const { query } = require('../src/config/database');

process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'teamwave-test';

jest.mock('../src/migrations/db-checker', () => ({
    checkAndInitDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../firebase-admin', () => ({
    getFirebaseConfigStatus: jest.fn(() => ({
        configured: false,
        source: 'test',
        missing_env: [],
    })),
}));

function sqlText(sql) {
    return String(sql).replace(/\s+/g, ' ').trim().toLowerCase();
}

beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (sql, params = []) => {
        const text = sqlText(sql);

        if (text.includes('select 1')) {
            return [{ ok: 1 }];
        }

        if (text.includes('count(*)') && text.includes('from posts')) {
            return [{ count: 0 }];
        }

        if (text.includes('count(*)') && text.includes('from works')) {
            return [{ count: 0 }];
        }

        if (text.includes('from posts p') && text.includes('limit')) {
            return [];
        }

        if (text.includes('from fandom_catalog_tags t') && text.includes('group by')) {
            return [
                { id: 1, name: 'Аніме', sort_order: 1, fandoms_count: 2 },
                { id: 2, name: 'Гра', sort_order: 3, fandoms_count: 1 },
            ];
        }

        if (text.includes('fandom_catalog_tag_links') && text.includes('fandom_id in')) {
            return [{ fandom_id: 1, id: 1, name: 'Аніме', sort_order: 1 }];
        }

        if (text.includes('from fandoms f') && text.includes('fandom_catalog_tag_links')) {
            return [
                {
                    id: 1,
                    name: 'Naruto',
                    description: 'Світ шинобі',
                    cover_image: null,
                },
            ];
        }

        if (text.includes('from fandoms') && text.includes('order by name')) {
            return [
                {
                    id: 1,
                    name: 'Naruto',
                    description: 'Світ шинобі',
                    cover_image: null,
                },
            ];
        }

        if (text.includes('from tags t')) {
            return [{ id: 1, name: 'Romance', works_count: 0, posts_count: 0, usage_count: 0 }];
        }

        return [];
    });
});
