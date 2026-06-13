const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const http = require('http');
const { createApp } = require('./createApp');
const { closePool, pingDatabase } = require('./config/database');

const app = createApp();
const PORT = process.env.PORT || 3000;
const listenHost = process.env.HOST || '0.0.0.0';
const server = http.createServer(app);

let shuttingDown = false;

async function startServer() {
    try {
        await pingDatabase();
        console.log(`✅ MySQL: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_DATABASE}`);
    } catch (err) {
        console.error('⚠️  MySQL недоступна при старті:', err.message);
        console.error('   API працюватиме частково. Перевірте .env, інтернет і VPN до хмарної БД.');
    }

    server.listen(PORT, listenHost, () => {
        console.log('===================================================');
        console.log(`======== TeamWave Server is running on port:${PORT}`);
        console.log('===================================================');
    });
}

function gracefulShutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n${signal} — зупинка сервера…`);

    const forceTimer = setTimeout(() => {
        console.error('❌ Примусова зупинка після таймауту');
        process.exit(1);
    }, 5000);

    if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
    }

    server.close(async () => {
        clearTimeout(forceTimer);
        try {
            await closePool();
            console.log('🔌 Відключено від БД');
        } catch (error) {
            console.error('⚠️  Помилка при відключенні від БД:', error.message);
        }
        console.log('🛑 Сервер зупинено');
        process.exit(0);
    });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer().catch((err) => {
    console.error('❌ Не вдалося запустити сервер:', err.message);
    process.exit(1);
});
