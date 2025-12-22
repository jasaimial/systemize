#!/usr/bin/env tsx
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

/**
 * Generate a test JWT token for local development
 * Usage: pnpm tsx scripts/generate-test-token.ts
 */

const payload = {
  id: 'test-user-123',
  email: 'test@example.com',
  provider: 'google',
};

const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

console.log('\n✨ Test JWT Token Generated!\n');
console.log('Token (valid for 24 hours):');
console.log('─'.repeat(80));
console.log(token);
console.log('─'.repeat(80));
console.log('\nPayload:');
console.log(JSON.stringify(payload, null, 2));
console.log('\nUsage:');
console.log('1. Copy the token above');
console.log('2. Open apps/backend/api.http');
console.log('3. Replace @authToken value with this token');
console.log('4. Click "Send Request" on any protected endpoint\n');
