export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/app.js',
    'src/js/**/*.js',
    '!src/js/**/*.test.js',
    '!**/node_modules/**'
  ],
  // Commented out coverage thresholds for unit tests
  // Uncomment when you add integration tests
  // coverageThreshold: {
  //   global: {
  //     branches: 50,
  //     functions: 50,
  //     lines: 50,
  //     statements: 50
  //   }
  // },
  verbose: true,
  clearMocks: true
};
