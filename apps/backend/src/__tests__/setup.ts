// Test setup file - runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Increase test timeout for integration tests
jest.setTimeout(10000);
