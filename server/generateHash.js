/**
 * Generate bcrypt password hashes for Node.js
 * Run: node generateHash.js
 */

const bcrypt = require('bcrypt');

const passwords = {
  admin: 'password',
  cashier: '1234'
};

async function generateHashes() {
  console.log('='.repeat(80));
  console.log('GOLDEN MUNCH POS - Password Hash Generator');
  console.log('='.repeat(80));
  console.log('');

  for (const [role, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${role.toUpperCase()}:`);
    console.log(`  Password: ${password}`);
    console.log(`  Hash: ${hash}`);
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('SQL UPDATE STATEMENTS:');
  console.log('='.repeat(80));
  console.log('');

  const adminHash = await bcrypt.hash('password', 10);
  const cashierHash = await bcrypt.hash('1234', 10);

  console.log(`-- Update Admin password`);
  console.log(`UPDATE admin SET password_hash = '${adminHash}' WHERE username = 'admin';`);
  console.log('');
  console.log(`-- Update Cashier PIN`);
  console.log(`UPDATE cashier SET pin_hash = '${cashierHash}' WHERE cashier_code = 'CASH001';`);
  console.log('');
  console.log('='.repeat(80));
}

generateHashes().catch(console.error);
