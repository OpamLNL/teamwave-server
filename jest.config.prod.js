/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/test/production/**/*.test.js'],
    testTimeout: 30000,
    forceExit: true,
};
