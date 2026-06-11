const path = require('path');

module.exports = function getSwaggerOptions(baseUrl = 'http://localhost:3000') {
    return {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'TeamWave API',
            version: '1.0.0',
            description: 'API інтерактивної платформи для віддалених тімбілдингових заходів'
        },
        servers: [
            { url: baseUrl, description: 'Поточний сервер (production / preview)' },
            { url: 'http://localhost:3000', description: 'Локальна розробка' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'Firebase ID Token'
                }
            },
            schemas: {
                TagBody: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', example: 'Dark Fantasy' }
                    }
                },
                FandomBody: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', example: 'Naruto' },
                        description: { type: 'string', example: 'Світ шинобі' },
                        cover_image: { type: 'string', example: 'https://picsum.photos/seed/naruto/400/300' }
                    }
                },
                WorkBody: {
                    type: 'object',
                    required: ['fandom_id', 'title'],
                    properties: {
                        fandom_id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Тінь Хокаге' },
                        description: { type: 'string', example: 'Альтернативна історія' },
                        type: { type: 'string', enum: ['fanfic', 'art', 'theory', 'review', 'cosplay'], example: 'fanfic' },
                        tags: {
                            type: 'array',
                            items: { type: 'integer' },
                            example: [1, 3, 10]
                        }
                    }
                },
                PostBody: {
                    type: 'object',
                    required: ['fandom_id', 'title'],
                    properties: {
                        fandom_id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Який момент змінив сюжет?' },
                        content: { type: 'string', example: 'Пропоную обговорити...' },
                        type: { type: 'string', enum: ['discussion', 'question', 'news'], example: 'discussion' },
                        tags: {
                            type: 'array',
                            items: { type: 'integer' },
                            example: [4, 18]
                        }
                    }
                },
                CommentBody: {
                    type: 'object',
                    required: ['target_type', 'target_id', 'content'],
                    properties: {
                        target_type: { type: 'string', enum: ['work', 'post'], example: 'work' },
                        target_id: { type: 'integer', example: 1 },
                        content: { type: 'string', example: 'Дуже цікава робота!' }
                    }
                },
                LikeBody: {
                    type: 'object',
                    required: ['target_type', 'target_id'],
                    properties: {
                        target_type: { type: 'string', enum: ['work', 'post', 'comment'], example: 'work' },
                        target_id: { type: 'integer', example: 1 }
                    }
                },
                UserBody: {
                    type: 'object',
                    properties: {
                        firebase_uid: { type: 'string', example: 'firebase_uid_123' },
                        email: { type: 'string', example: 'user@gmail.com' },
                        name: { type: 'string', example: 'User Name' },
                        avatar_url: { type: 'string', example: 'https://i.pravatar.cc/150?img=1' }
                    }
                },
                RoleBody: {
                    type: 'object',
                    required: ['role'],
                    properties: {
                        role: { type: 'string', enum: ['user', 'moderator', 'admin'], example: 'moderator' }
                    }
                },
                ChapterBody: {
                    type: 'object',
                    required: ['content'],
                    properties: {
                        title: { type: 'string', example: 'Розділ 1' },
                        content: { type: 'string', example: 'Текст розділу...' },
                        order_index: { type: 'integer', example: 1 }
                    }
                },
                ReportBody: {
                    type: 'object',
                    required: ['target_type', 'target_id', 'reason'],
                    properties: {
                        target_type: {
                            type: 'string',
                            enum: ['work', 'post', 'comment', 'user'],
                            example: 'work'
                        },
                        target_id: {
                            type: 'integer',
                            example: 1
                        },
                        reason: {
                            type: 'string',
                            example: 'Порушення правил спільноти'
                        }
                    }
                },
                ReportStatusBody: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['pending', 'reviewed', 'rejected', 'resolved'],
                            example: 'reviewed'
                        }
                    }
                },
                FavoriteBody: {
                    type: 'object',
                    required: ['target_type', 'target_id'],
                    properties: {
                        target_type: {
                            type: 'string',
                            enum: ['work', 'post'],
                            example: 'work'
                        },
                        target_id: {
                            type: 'integer',
                            example: 1
                        }
                    }
                }
            }
        },
        paths: {
            '/': {
                get: {
                    tags: ['Health'],
                    summary: 'Вітання — перевірка, що сервер працює',
                    description: 'Публічний endpoint без авторизації. Не потребує підключення до БД.',
                    responses: {
                        200: {
                            description: 'Сервер працює',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string', example: 'TeamWave API' },
                                            message: { type: 'string', example: 'Вітаємо! Сервер Фандомії працює.' },
                                            version: { type: 'string', example: '1.0.0' },
                                            status: { type: 'string', example: 'ok' },
                                            docs: { type: 'string', example: '/api/docs' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api': {
                get: {
                    tags: ['Health'],
                    summary: 'Вітання API',
                    description: 'Те саме, що GET / — зручно для перевірки базового шляху /api',
                    responses: { 200: { description: 'Сервер працює' } },
                },
            },
            '/api/health': {
                get: {
                    tags: ['Health'],
                    summary: 'Health check (сервер + БД)',
                    description: 'Перевіряє доступність MySQL. 200 — все ок, 503 — БД недоступна.',
                    responses: {
                        200: { description: 'Сервер і БД працюють' },
                        503: { description: 'Сервер працює, БД недоступна' },
                    },
                },
            },

            '/api/users': {
                get: {
                    tags: ['Users'],
                    summary: 'Отримати всіх користувачів',
                    responses: { 200: { description: 'OK' } }
                },
                post: {
                    tags: ['Users'],
                    summary: 'Створити користувача',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserBody' } } }
                    },
                    responses: { 201: { description: 'Created' } }
                }
            },
            '/api/users/search': {
                get: {
                    tags: ['Users'],
                    summary: 'Пошук користувачів',
                    parameters: [
                        { in: 'query', name: 'query', schema: { type: 'string' }, example: 'Alice' }
                    ],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/users/{id}': {
                get: {
                    tags: ['Users'],
                    summary: 'Отримати користувача по ID',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                },
                put: {
                    tags: ['Users'],
                    summary: 'Оновити користувача',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserBody' } } }
                    },
                    responses: { 200: { description: 'OK' } }
                },
                delete: {
                    tags: ['Users'],
                    summary: 'Видалити користувача',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/users/{id}/role': {
                patch: {
                    tags: ['Users'],
                    summary: 'Змінити роль користувача',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/RoleBody' } } }
                    },
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/users/{id}/works': {
                get: {
                    tags: ['Users'],
                    summary: 'Роботи користувача',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/users/{id}/posts': {
                get: {
                    tags: ['Users'],
                    summary: 'Пости користувача',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/users/{id}/comments': {
                get: {
                    tags: ['Users'],
                    summary: 'Коментарі користувача',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/users/{id}/stats': {
                get: {
                    tags: ['Users'],
                    summary: 'Статистика користувача',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },

            '/api/fandoms': {
                get: {
                    tags: ['Fandoms'],
                    summary: 'Отримати всі фандоми',
                    responses: { 200: { description: 'OK' } }
                },
                post: {
                    tags: ['Fandoms'],
                    summary: 'Створити фандом',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/FandomBody' } } }
                    },
                    responses: { 201: { description: 'Created' } }
                }
            },
            '/api/fandoms/search': {
                get: {
                    tags: ['Fandoms'],
                    summary: 'Пошук фандомів',
                    parameters: [{ in: 'query', name: 'name', schema: { type: 'string' }, example: 'Naruto' }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/fandoms/{id}': {
                get: {
                    tags: ['Fandoms'],
                    summary: 'Отримати фандом по ID',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                },
                put: {
                    tags: ['Fandoms'],
                    summary: 'Оновити фандом',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/FandomBody' } } }
                    },
                    responses: { 200: { description: 'OK' } }
                },
                delete: {
                    tags: ['Fandoms'],
                    summary: 'Видалити фандом',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/fandoms/{id}/works': {
                get: {
                    tags: ['Fandoms'],
                    summary: 'Роботи фандому',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/fandoms/{id}/posts': {
                get: {
                    tags: ['Fandoms'],
                    summary: 'Пости фандому',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/fandoms/{id}/stats': {
                get: {
                    tags: ['Fandoms'],
                    summary: 'Статистика фандому',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },

            '/api/works': {
                get: {
                    tags: ['Works'],
                    summary: 'Отримати всі роботи',
                    parameters: [
                        {
                            in: 'query',
                            name: 'page',
                            required: false,
                            schema: { type: 'integer', example: 1 }
                        },
                        {
                            in: 'query',
                            name: 'limit',
                            required: false,
                            schema: { type: 'integer', example: 10 }
                        }
                    ],
                    responses: { 200: { description: 'OK' } }
                },
            },
            '/api/works/search': {
                get: {
                    tags: ['Works'],
                    summary: 'Пошук робіт',
                    parameters: [{ in: 'query', name: 'query', schema: { type: 'string' }, example: 'Naruto' }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/works/{id}': {
                get: {
                    tags: ['Works'],
                    summary: 'Отримати роботу по ID',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                },
                put: {
                    tags: ['Works'],
                    summary: 'Оновити роботу',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkBody' } } }
                    },
                    responses: { 200: { description: 'OK' } }
                },
                delete: {
                    tags: ['Works'],
                    summary: 'Видалити роботу',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/works/author/{userId}': {
                get: {
                    tags: ['Works'],
                    summary: 'Роботи автора',
                    parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/works/fandom/{fandomId}': {
                get: {
                    tags: ['Works'],
                    summary: 'Роботи фандому',
                    parameters: [{ in: 'path', name: 'fandomId', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/works/type/{type}': {
                get: {
                    tags: ['Works'],
                    summary: 'Роботи за типом',
                    parameters: [{ in: 'path', name: 'type', required: true, schema: { type: 'string', enum: ['fanfic', 'art', 'theory', 'review', 'cosplay'] } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/works/tag/{tagId}': {
                get: {
                    tags: ['Works'],
                    summary: 'Роботи за тегом',
                    parameters: [{ in: 'path', name: 'tagId', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },

            '/api/posts': {
                get: {
                    tags: ['Posts'],
                    summary: 'Отримати всі пости',
                    responses: { 200: { description: 'OK' } }
                },
                post: {
                    tags: ['Posts'],
                    summary: 'Створити пост',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/PostBody' } } }
                    },
                    responses: { 201: { description: 'Created' } }
                }
            },
            '/api/posts/search': {
                get: {
                    tags: ['Posts'],
                    summary: 'Пошук постів',
                    parameters: [{ in: 'query', name: 'query', schema: { type: 'string' }, example: 'фінал' }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/posts/latest': {
                get: {
                    tags: ['Posts'],
                    summary: 'Останні пости',
                    parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer' }, example: 10 }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/posts/{id}': {
                get: {
                    tags: ['Posts'],
                    summary: 'Отримати пост по ID',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                },
                put: {
                    tags: ['Posts'],
                    summary: 'Оновити пост',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/PostBody' } } }
                    },
                    responses: { 200: { description: 'OK' } }
                },
                delete: {
                    tags: ['Posts'],
                    summary: 'Видалити пост',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },

            '/api/tags': {
                get: {
                    tags: ['Tags'],
                    summary: 'Отримати всі теги',
                    responses: { 200: { description: 'OK' } }
                },
                post: {
                    tags: ['Tags'],
                    summary: 'Створити тег',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/TagBody' } } }
                    },
                    responses: { 201: { description: 'Created' } }
                }
            },
            '/api/tags/search': {
                get: {
                    tags: ['Tags'],
                    summary: 'Пошук тегів',
                    parameters: [{ in: 'query', name: 'query', schema: { type: 'string' }, example: 'Dark' }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/tags/popular': {
                get: {
                    tags: ['Tags'],
                    summary: 'Популярні теги',
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/tags/{id}': {
                get: {
                    tags: ['Tags'],
                    summary: 'Отримати тег по ID',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                },
                put: {
                    tags: ['Tags'],
                    summary: 'Оновити тег',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/TagBody' } } }
                    },
                    responses: { 200: { description: 'OK' } }
                },
                delete: {
                    tags: ['Tags'],
                    summary: 'Видалити тег',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/tags/{id}/works': {
                get: {
                    tags: ['Tags'],
                    summary: 'Роботи за тегом',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/tags/{id}/posts': {
                get: {
                    tags: ['Tags'],
                    summary: 'Пости за тегом',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },

            '/api/comments/{type}/{id}': {
                get: {
                    tags: ['Comments'],
                    summary: 'Коментарі до роботи або поста',
                    parameters: [
                        { in: 'path', name: 'type', required: true, schema: { type: 'string', enum: ['work', 'post'] } },
                        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }
                    ],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/comments/single/{id}': {
                get: {
                    tags: ['Comments'],
                    summary: 'Отримати коментар по ID',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/comments': {
                post: {
                    tags: ['Comments'],
                    summary: 'Створити коментар',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/CommentBody' } } }
                    },
                    responses: { 201: { description: 'Created' } }
                }
            },
            '/api/comments/{id}': {
                put: {
                    tags: ['Comments'],
                    summary: 'Оновити коментар',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['content'],
                                    properties: {
                                        content: { type: 'string', example: 'Оновлений коментар' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { 200: { description: 'OK' } }
                },
                delete: {
                    tags: ['Comments'],
                    summary: 'Видалити коментар',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },

            '/api/likes/toggle': {
                post: {
                    tags: ['Likes'],
                    summary: 'Поставити або прибрати лайк',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/LikeBody' } } }
                    },
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/likes/count': {
                get: {
                    tags: ['Likes'],
                    summary: 'Кількість лайків',
                    parameters: [
                        { in: 'query', name: 'target_type', required: true, schema: { type: 'string', enum: ['work', 'post', 'comment'] } },
                        { in: 'query', name: 'target_id', required: true, schema: { type: 'integer' } }
                    ],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/likes/user/{userId}': {
                get: {
                    tags: ['Likes'],
                    summary: 'Лайки користувача',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },

            '/api/work-uploads/{workId}/images': {
                get: {
                    tags: ['WorkUploads'],
                    summary: 'Отримати картинки роботи',
                    parameters: [{ in: 'path', name: 'workId', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                },
                post: {
                    tags: ['WorkUploads'],
                    summary: 'Завантажити картинки до роботи',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'workId', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        images: {
                                            type: 'array',
                                            items: { type: 'string', format: 'binary' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: { 201: { description: 'Created' } }
                }
            },
            '/api/work-uploads/images/{imageId}': {
                delete: {
                    tags: ['WorkUploads'],
                    summary: 'Видалити картинку',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'imageId', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/work-uploads/{workId}/chapters': {
                get: {
                    tags: ['WorkUploads'],
                    summary: 'Отримати розділи роботи',
                    parameters: [{ in: 'path', name: 'workId', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                },
                post: {
                    tags: ['WorkUploads'],
                    summary: 'Створити розділ',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'workId', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ChapterBody' } } }
                    },
                    responses: { 201: { description: 'Created' } }
                }
            },
            '/api/work-uploads/chapters/{chapterId}': {
                get: {
                    tags: ['WorkUploads'],
                    summary: 'Отримати контент розділу',
                    parameters: [{ in: 'path', name: 'chapterId', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                },
                put: {
                    tags: ['WorkUploads'],
                    summary: 'Оновити розділ',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'chapterId', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ChapterBody' } } }
                    },
                    responses: { 200: { description: 'OK' } }
                },
                delete: {
                    tags: ['WorkUploads'],
                    summary: 'Видалити розділ',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'chapterId', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/favorites/toggle': {
                post: {
                    tags: ['Favorites'],
                    summary: 'Додати або прибрати з обраного',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/FavoriteBody' }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'OK' },
                        401: { description: 'Не авторизований' }
                    }
                }
            },
            '/api/reports': {
                get: {
                    tags: ['Reports'],
                    summary: 'Отримати всі скарги',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'OK' } }
                },
                post: {
                    tags: ['Reports'],
                    summary: 'Створити скаргу',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ReportBody' }
                            }
                        }
                    },
                    responses: { 201: { description: 'Created' } }
                }
            },

            '/api/reports/status/{status}': {
                get: {
                    tags: ['Reports'],
                    summary: 'Отримати скарги за статусом',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'status',
                            required: true,
                            schema: {
                                type: 'string',
                                enum: ['pending', 'reviewed', 'rejected', 'resolved']
                            }
                        }
                    ],
                    responses: { 200: { description: 'OK' } }
                }
            },

            '/api/reports/user/{userId}': {
                get: {
                    tags: ['Reports'],
                    summary: 'Отримати скарги користувача',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'userId',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: { 200: { description: 'OK' } }
                }
            },

            '/api/reports/{id}': {
                get: {
                    tags: ['Reports'],
                    summary: 'Отримати скаргу по ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: { 200: { description: 'OK' } }
                },
                delete: {
                    tags: ['Reports'],
                    summary: 'Видалити скаргу',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: { 200: { description: 'OK' } }
                }
            },

            '/api/reports/{id}/status': {
                patch: {
                    tags: ['Reports'],
                    summary: 'Змінити статус скарги',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ReportStatusBody' }
                            }
                        }
                    },
                    responses: { 200: { description: 'OK' } }
                }
            },
            '/api/users/{id}/block': {
                patch: {
                    tags: ['Users'],
                    summary: 'Заблокувати / розблокувати користувача',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['is_blocked'],
                                    properties: {
                                        is_blocked: {
                                            type: 'boolean',
                                            example: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'OK' }
                    }
                }
            },
            '/api/favorites/user/{userId}': {
                get: {
                    tags: ['Favorites'],
                    summary: 'Отримати обране користувача',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'userId',
                            required: true,
                            schema: { type: 'integer' },
                            description: 'ID користувача'
                        }
                    ],
                    responses: {
                        200: { description: 'OK' },
                        401: { description: 'Не авторизований' }
                    }
                }
            }
        }
    },
    apis: [path.join(__dirname, '..', 'routes', '*.js')],
    };
};