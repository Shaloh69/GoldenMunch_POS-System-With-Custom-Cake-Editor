/**
 * Show FULL admin password hash
 * Run with: node check-full-hash.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkFullHash() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'GoldenMunchPOS'
    });

    const [admins] = await connection.query(
      'SELECT username, password_hash FROM admin WHERE username = ?',
      ['admin']
    );

    if (admins.length > 0) {
      const currentHash = admins[0].password_hash;
      const expectedHash = '$2b$10$CXizOigTmnkp0RTmFSF2D.rfmDhi9A4TTLK0CFmHNhRWMhQAT5DYG';

      console.log('=== FULL HASH COMPARISON ===\n');
      console.log('Current hash in DB:');
      console.log(currentHash);
      console.log('\nExpected hash (from V3 schema):');
      console.log(expectedHash);
      console.log('\nHashes match:', currentHash === expectedHash ? '✅ YES' : '❌ NO');
      console.log('Hash length in DB:', currentHash.length);
      console.log('Expected hash length:', expectedHash.length);

      // Test both hashes
      console.log('\n=== PASSWORD TESTS ===');
      const test1 = await bcrypt.compare('admin123', currentHash);
      console.log('Current hash validates "admin123":', test1 ? '✅ YES' : '❌ NO');

      const test2 = await bcrypt.compare('admin123', expectedHash);
      console.log('Expected hash validates "admin123":', test2 ? '✅ YES' : '❌ NO');

      // Try different passwords
      console.log('\n=== TRYING OTHER PASSWORDS ===');
      const commonPasswords = ['admin', 'password', '123456', 'Admin123', 'ADMIN123'];
      for (const pwd of commonPasswords) {
        const isValid = await bcrypt.compare(pwd, currentHash);
        if (isValid) {
          console.log(`✅ FOUND IT! The password is: "${pwd}"`);
        }
      }

    } else {
      console.log('❌ Admin user not found!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkFullHash();
