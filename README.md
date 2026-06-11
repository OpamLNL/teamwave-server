# TeamWave — бекенд

REST API для інтерактивної платформи тімбілдингових заходів: Express, MySQL, Firebase Admin для авторизації.

## Стек

- Node.js + Express 4
- MySQL (mysql2)
- Firebase Admin SDK
- Swagger UI: `/api/docs`

## Швидкий старт

```bash
cd teamwave-server
cp .env.example .env
# заповніть підключення до БД та шлях до service account Firebase
yarn install   # або npm install
node ./src/server.js
# або: npm start
```

Сервер слухає порт з `PORT` (за замовчуванням 3000).

При старті автоматично перевіряються таблиці та застосовуються міграції (follows, notifications, content_rating, contact_messages).

## Змінні середовища

Див. `.env.example`. Обовʼязкові:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
- `PORT`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_PATH` — JSON ключ сервісного акаунта

Опційно: `DB_SSL_CA` для хмарної MySQL (Aiven тощо).

## Основні API

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/` або `/api` | Вітання — перевірка, що сервер працює (публічно, без БД) |
| GET | `/api/health` | Health check сервера та MySQL |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/docs/swagger.json` | OpenAPI spec (JSON) |
| POST | `/routes/auth/firebase` | Синхронізація користувача після Firebase login |
| — | ImgBB | Зображення (аватари, арт) — `IMGBB_API_KEY` |
| GET | `/api/works?page&limit&type&sort` | Список творів (пагінація) |
| GET | `/api/works/search?query&page&limit&type` | Пошук творів |
| GET | `/api/posts?page&limit` | Список постів (пагінація) |
| GET/PUT | `/api/posts/:id` | Перегляд / редагування поста |
| GET | `/api/follows/me/feed` | Стрічка підписок |
| POST | `/api/contact` | Форма звернення |

Авторизація: заголовок `Authorization: Bearer <Firebase ID token>`.

## База даних

Повне перестворення схеми (обережно, видаляє дані):

```bash
npm run db:reset
```

## Структура

```
src/
  controllers/
  services/
  repositories/
  routes/
  migrations/
  middlewares/
```

Демо-сценарій і чеклист тестування — [DEMO.md](../DEMO.md).  
**Деплой на Vercel** — [DEPLOY.md](../DEPLOY.md).
