const { createApp } = require('../../src/createApp');

let cachedApp = null;

function getTestApp() {
    if (!cachedApp) {
        cachedApp = createApp();
    }
    return cachedApp;
}

module.exports = { getTestApp };
