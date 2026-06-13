const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const http = require('http');
const { createApp } = require('./createApp');
const { closePool } = require('./config/database');

const app = createApp();
const PORT = process.env.PORT || 3000;
const ipAddress = process.env.DB_IP || '0.0.0.0';
const server = http.createServer(app);

server.listen(PORT, ipAddress, () => {
    console.log('===================================================');
    console.log(`======== TeamWave Server is running on port:${PORT}`);
    console.log('===================================================');
});

let shuttingDown = false;

function gracefulShutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n${signal} — зупинка сервера…`);

    server.close(async () => {
        try {
            await closePool();
            console.log('🔌 Відключено від БД');
            console.log('🛑 Сервер зупинено');
            process.exit(0);
        } catch (error) {
            console.error('❌ Помилка при відключенні від БД', error);
            process.exit(1);
        }
    });

    setTimeout(() => {
        console.error('❌ Примусова зупинка після таймауту');
        process.exit(1);
    }, 10000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
