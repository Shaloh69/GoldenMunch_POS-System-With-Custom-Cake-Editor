#!/usr/bin/env node

/**
 * Environment Setup Script
 * Creates a .env file with secure JWT secrets
 * Run with: node src/scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('GoldenMunch POS - Environment Setup');
  console.log('='.repeat(60) + '\n');

  const envPath = path.join(__dirname, '../../.env');
  const envExamplePath = path.join(__dirname, '../../.env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    const overwrite = await question('Do you want to overwrite it? (yes/no): ');
    if (overwrite.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('📝 Creating .env file with secure JWT secrets...\n');

  // Generate secrets
  const jwtSecret = generateSecret();
  const adminJwtSecret = generateSecret();
  const cashierJwtSecret = generateSecret();

  console.log('✓ Generated JWT_SECRET');
  console.log('✓ Generated ADMIN_JWT_SECRET');
  console.log('✓ Generated CASHIER_JWT_SECRET\n');

  // Database configuration
  console.log('Database Configuration:');
  const dbHost = await question('DB Host [localhost]: ') || 'localhost';
  const dbPort = await question('DB Port [3306]: ') || '3306';
  const dbUser = await question('DB User [root]: ') || 'root';
  const dbPassword = await question('DB Password: ');
  const dbName = await question('DB Name [GoldenMunchPOS]: ') || 'GoldenMunchPOS';

  console.log('\nApplication Configuration:');
  const nodeEnv = await question('Environment (development/production) [development]: ') || 'development';
  const port = await question('Server Port [5000]: ') || '5000';
  const host = await question('Server Host [localhost]: ') || 'localhost';

  // Create .env content
  const envContent = `# Server Environment Configuration
# Generated on ${new Date().toISOString()}

# Application Environment
NODE_ENV=${nodeEnv}
PORT=${port}
HOST=${host}

# Database Configuration (MySQL)
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}

# JWT Authentication Secrets
# IMPORTANT: These are auto-generated secure secrets - DO NOT SHARE!
JWT_SECRET=${jwtSecret}
ADMIN_JWT_SECRET=${adminJwtSecret}
CASHIER_JWT_SECRET=${cashierJwtSecret}

# JWT Token Expiration
ADMIN_JWT_EXPIRES_IN=8h
CASHIER_JWT_EXPIRES_IN=12h

# CORS Configuration
# Multiple origins can be specified as comma-separated values
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Frontend URL (for QR code generation)
FRONTEND_URL=http://localhost:3002

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload (in bytes - 10MB default)
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n' + '='.repeat(60));
  console.log('✅ .env file created successfully!');
  console.log('='.repeat(60));
  console.log(`\nLocation: ${envPath}\n`);
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('  1. The .env file contains sensitive information');
  console.log('  2. NEVER commit .env to version control (already in .gitignore)');
  console.log('  3. Keep your JWT secrets secure and private');
  console.log('  4. Use different secrets for development and production\n');
  console.log('Next steps:');
  console.log('  1. Review the .env file and adjust values if needed');
  console.log('  2. Restart your server to load the new configuration');
  console.log('  3. Clear any existing authentication tokens in your browser');
  console.log('  4. Log in again with fresh credentials\n');

  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
