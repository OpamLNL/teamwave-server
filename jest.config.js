/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/test/local/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/migrations/init-db.js',
        '!src/seed/**',
    ],
    coverageDirectory: 'coverage',
    testTimeout: 15000,
    forceExit: true,
};
