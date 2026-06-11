const request = require('supertest');
const { getTestApp } = require('../helpers/createTestApp');

describe('TeamWave API (local e2e, mocked DB)', () => {
    const app = getTestApp();

    describe('Публічні службові маршрути', () => {
        it('GET /api — вітання API', async () => {
            const res = await request(app).get('/api').expect(200);

            expect(res.body).toMatchObject({
                name: 'TeamWave API',
                status: 'ok',
            });
            expect(res.body.docs).toContain('/api/docs');
            expect(res.body.health).toContain('/api/health');
        });

        it('GET /api/health — перевірка стану', async () => {
            const res = await request(app).get('/api/health');

            expect([200, 503]).toContain(res.status);
            expect(res.body).toHaveProperty('status');
            expect(res.body).toHaveProperty('database');
            expect(res.body).toHaveProperty('firebase');
        });

        it('GET /api/docs — HTML Swagger UI (CDN)', async () => {
            const res = await request(app).get('/api/docs').expect(200);

            expect(res.headers['content-type']).toMatch(/html/);
            expect(res.text).toContain('swagger-ui-bundle.js');
            expect(res.text).toContain('cdn.jsdelivr.net');
            expect(res.text).not.toContain('./swagger-ui-bundle.js');
        });

        it('GET /api/docs/swagger.json — OpenAPI spec', async () => {
            const res = await request(app).get('/api/docs/swagger.json').expect(200);

            expect(res.body.openapi).toMatch(/^3\./);
            expect(res.body.info.title).toBe('TeamWave API');
            expect(res.body.paths).toBeDefined();
        });

        it('GET /api/docs/open — редірект у Swagger Editor', async () => {
            const res = await request(app).get('/api/docs/open').expect(302);

            expect(res.headers.location).toContain('editor.swagger.io');
            expect(res.headers.location).toContain('api%2Fdocs%2Fswagger.json');
        });
    });

    describe('Публічні ресурси (читання)', () => {
        it('GET /api/fandoms — список фандомів', async () => {
            const res = await request(app).get('/api/fandoms').expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('catalog_tags');
        });

        it('GET /api/fandom-catalog-tags — каталог-теги фандомів', async () => {
            const res = await request(app).get('/api/fandom-catalog-tags').expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0]).toMatchObject({
                id: expect.any(Number),
                name: expect.any(String),
            });
        });

        it('GET /api/posts — список постів з пагінацією', async () => {
            const res = await request(app).get('/api/posts?page=1&limit=5').expect(200);

            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('pagination');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.pagination).toMatchObject({
                page: 1,
                limit: 5,
            });
        });

        it('GET /api/posts?type=news — фільтр типу поста', async () => {
            await request(app).get('/api/posts?type=news&limit=5').expect(200);
        });

        it('GET /api/tags — список тегів контенту', async () => {
            const res = await request(app).get('/api/tags').expect(200);

            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('Захищені маршрути без токена', () => {
        it('POST /api/posts — 401 без Authorization', async () => {
            const res = await request(app)
                .post('/api/posts')
                .send({
                    fandom_id: 1,
                    title: 'Test',
                    content: 'Body',
                    type: 'discussion',
                });

            expect([401, 403]).toContain(res.status);
        });
    });
});
