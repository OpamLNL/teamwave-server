const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { createApp } = require('./src/createApp');

const app = createApp();

module.exports = app;
