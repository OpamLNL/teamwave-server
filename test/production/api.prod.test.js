const request = require('supertest');
const { getProductionBaseUrl } = require('../helpers/productionBaseUrl');

describe(`TeamWave API (production: ${getProductionBaseUrl()})`, () => {
    const baseUrl = getProductionBaseUrl();

    describe('Службові маршрути', () => {
        it('GET /api — вітання API', async () => {
            const res = await request(baseUrl).get('/api').timeout(20000).expect(200);

            expect(res.body).toMatchObject({
                name: 'TeamWave API',
                status: 'ok',
            });
            expect(res.body.docs).toMatch(/\/api\/docs/);
            expect(res.body.health).toMatch(/\/api\/health/);
        });

        it('GET /api/health — БД і Firebase на проді', async () => {
            const res = await request(baseUrl).get('/api/health').timeout(20000);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                status: 'ok',
                database: 'connected',
            });
            expect(res.body.firebase).toBeDefined();
            expect(res.body.firebase.configured).toBe(true);
            expect(res.body.environment).toBe('vercel');
        });

        it('GET /api/docs — Swagger UI (CDN)', async () => {
            const res = await request(baseUrl).get('/api/docs').timeout(20000).expect(200);

            expect(res.headers['content-type']).toMatch(/html/);
            expect(res.text).toContain('swagger-ui-bundle.js');
            expect(res.text).toContain('cdn.jsdelivr.net');
            expect(res.text).not.toContain('./swagger-ui-bundle.js');
        });

        it('GET /api/docs/swagger.json — OpenAPI spec', async () => {
            const res = await request(baseUrl)
                .get('/api/docs/swagger.json')
                .timeout(20000)
                .expect(200);

            expect(res.body.openapi).toMatch(/^3\./);
            expect(res.body.info.title).toBe('TeamWave API');
            expect(res.body.paths).toBeDefined();
        });

        it('GET /api/docs/open — редірект у Swagger Editor', async () => {
            const res = await request(baseUrl).get('/api/docs/open').timeout(20000).expect(302);

            expect(res.headers.location).toContain('editor.swagger.io');
        });
    });

    describe('Публічні ресурси (реальна БД)', () => {
        it('GET /api/fandoms — список фандомів', async () => {
            const res = await request(baseUrl).get('/api/fandoms').timeout(20000).expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('name');
                expect(res.body[0]).toHaveProperty('catalog_tags');
                expect(Array.isArray(res.body[0].catalog_tags)).toBe(true);
            }
        });

        it('GET /api/fandom-catalog-tags — каталог-теги', async () => {
            const res = await request(baseUrl)
                .get('/api/fandom-catalog-tags')
                .timeout(20000)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            if (res.body.length > 0) {
                expect(res.body[0]).toMatchObject({
                    id: expect.any(Number),
                    name: expect.any(String),
                });
            }
        });

        it('GET /api/posts — пагінація', async () => {
            const res = await request(baseUrl)
                .get('/api/posts?page=1&limit=5')
                .timeout(20000)
                .expect(200);

            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('pagination');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.pagination).toMatchObject({
                page: 1,
                limit: 5,
            });
        });

        it('GET /api/posts?type=news — фільтр типу', async () => {
            await request(baseUrl)
                .get('/api/posts?type=news&limit=5')
                .timeout(20000)
                .expect(200);
        });

        it('GET /api/tags — теги контенту', async () => {
            const res = await request(baseUrl).get('/api/tags').timeout(20000).expect(200);

            expect(Array.isArray(res.body)).toBe(true);
        });

        it('GET /api/works?limit=3 — каталог творів', async () => {
            const res = await request(baseUrl)
                .get('/api/works?limit=3')
                .timeout(20000)
                .expect(200);

            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('Захист (без змін даних на проді)', () => {
        it('POST /api/posts — 401 без Authorization', async () => {
            const res = await request(baseUrl)
                .post('/api/posts')
                .timeout(20000)
                .send({
                    fandom_id: 1,
                    title: 'prod-smoke-test-do-not-create',
                    content: 'automated test',
                    type: 'discussion',
                });

            expect([401, 403]).toContain(res.status);
        });
    });
});
